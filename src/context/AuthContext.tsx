import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Pokemon } from '@/@types/pokemon';
import {
  fetchCloudProfile,
  getApiErrorMessage,
  loginUser,
  logoutFromCloud,
  registerUser,
} from '@/integration/authApi';
import { clearCloudCache } from '@/integration/cloudClient';
import { getProtected, setProtected } from '@/security/secureStore';
import {
  getSession,
  restoreSession,
  secondsUntilExpiry,
  subscribe,
  type Session,
} from '@/security/session';

type UserCredentials = {
  /** Identificador do usuário na nuvem. */
  userId: string;
  /** Username usado na autenticação. */
  name: string;
  team: Pokemon[];
  availablePokemons: Pokemon[];
};

type GameData = {
  team: Pokemon[];
  availablePokemons: Pokemon[];
};

/** Dados de jogo, guardados cifrados/selados e indexados pelo userId da nuvem. */
const gameDataKey = (userId: string) => `poke.game.v2.${userId}`;

/** Chaves da versão anterior, quando sessão e time ficavam em texto puro. */
const LEGACY_SESSION_KEY = '@Auth:loggedUser';
const legacyGameDataKey = (userId: string) => `@PokeData:${userId}`;

type AuthContextData = {
  isAuthenticated: boolean;
  user: UserCredentials | null;
  isLoading: boolean;
  /** Segundos restantes da sessão temporária (0 quando não há sessão). */
  sessionExpiresIn: number;
  /** `true` quando a nuvem aceitou o canal cifrado desta sessão. */
  isSecureChannelActive: boolean;
  signIn: (usernameOrEmail: string, senha: string) => Promise<void>;
  signUp: (name: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  addToTeam: (pokemon: Pokemon) => Promise<void>;
  removeFromTeam: (pokemonIndex: string) => Promise<void>;
  setInitialExplorationList: (pokemons: Pokemon[]) => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(0);
  const [isSecureChannelActive, setIsSecureChannelActive] = useState(false);

  // Mantém a última sessão vista para reagir ao encerramento sem recriar o efeito.
  const userRef = useRef<UserCredentials | null>(null);
  userRef.current = user;

  const applySession = useCallback(async (session: Session) => {
    const gameData = await loadGameData(session.user.userId);

    setUser({
      userId: session.user.userId,
      name: session.user.username,
      team: gameData.team,
      availablePokemons: gameData.availablePokemons,
    });
    setIsAuthenticated(true);
    setIsSecureChannelActive(!!session.channelKey);
    setSessionExpiresIn(secondsUntilExpiry());

    // Perfil da nuvem: chega cifrado quando o canal seguro está ativo e é aberto em
    // JavaScript pelo cloudClient. Backend sem essa rota devolve null e nada muda.
    void fetchCloudProfile().then((profile) => {
      if (!profile) return;
      setUser((previous) =>
        previous && previous.userId === profile.userId
          ? { ...previous, name: profile.username }
          : previous
      );
    });
  }, []);

  const forgetLocalState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setIsSecureChannelActive(false);
    setSessionExpiresIn(0);
    clearCloudCache();
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      await AsyncStorage.removeItem(LEGACY_SESSION_KEY);

      const session = await restoreSession();
      if (!active) return;

      if (session) {
        await applySession(session);
      }
      setIsLoading(false);
    }

    void bootstrap();

    // A sessão pode cair sozinha (token de renovação vencido, 401 da nuvem, logout em
    // outra aba). Quando isso acontece o app volta para a tela de login na hora.
    const unsubscribe = subscribe((session) => {
      if (!session && userRef.current) {
        forgetLocalState();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applySession, forgetLocalState]);

  // Contador regressivo da sessão, para a interface poder avisar o usuário.
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => setSessionExpiresIn(secondsUntilExpiry()), 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  async function updateGlobalUserData(updatedUser: UserCredentials) {
    setUser(updatedUser);
    await setProtected(gameDataKey(updatedUser.userId), {
      team: updatedUser.team,
      availablePokemons: updatedUser.availablePokemons,
    } satisfies GameData);
  }

  async function signIn(username: string, senha: string) {
    let session: Session;
    try {
      session = await loginUser(username.trim(), senha);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Usuário ou senha inválidos.'));
    }

    await applySession(session);
  }

  async function signUp(name: string, senha: string) {
    try {
      await registerUser(name.trim(), senha);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Não foi possível criar a conta.'));
    }
  }

  async function setInitialExplorationList(pokemons: Pokemon[]) {
    if (!user || user.availablePokemons.length > 0) return;
    await updateGlobalUserData({ ...user, availablePokemons: pokemons });
  }

  async function addToTeam(pokemon: Pokemon) {
    if (!user) return;

    if (user.team.some((p) => p.index === pokemon.index)) {
      throw new Error('Este Pokémon já está no seu time!');
    }
    if (user.team.length >= 6) {
      throw new Error('Seu time já está cheio (máximo 6 Pokémon)!');
    }

    await updateGlobalUserData({ ...user, team: [...user.team, pokemon] });
  }

  async function removeFromTeam(pokemonIndex: string) {
    if (!user) return;
    await updateGlobalUserData({
      ...user,
      team: user.team.filter((p) => p.index !== pokemonIndex),
    });
  }

  async function signOut() {
    await logoutFromCloud();
    forgetLocalState();
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        sessionExpiresIn,
        isSecureChannelActive,
        signIn,
        signUp,
        signOut,
        addToTeam,
        removeFromTeam,
        setInitialExplorationList,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Lê o save do usuário, trazendo automaticamente o que estava gravado em texto puro
 * pela versão anterior — quem já usava o app não perde time nem lista de exploração.
 */
async function loadGameData(userId: string): Promise<GameData> {
  const stored = await getProtected<GameData>(gameDataKey(userId));
  if (stored) {
    return { team: stored.team ?? [], availablePokemons: stored.availablePokemons ?? [] };
  }

  const legacyRaw = await AsyncStorage.getItem(legacyGameDataKey(userId));
  if (!legacyRaw) {
    return { team: [], availablePokemons: [] };
  }

  try {
    const legacy = JSON.parse(legacyRaw) as Partial<GameData>;
    const migrated: GameData = {
      team: legacy.team ?? [],
      availablePokemons: legacy.availablePokemons ?? [],
    };

    await setProtected(gameDataKey(userId), migrated);
    await AsyncStorage.removeItem(legacyGameDataKey(userId));
    return migrated;
  } catch {
    return { team: [], availablePokemons: [] };
  }
}

export const useAuth = () => useContext(AuthContext);

/** Sessão corrente, para quem precisa dos dados fora da árvore de componentes. */
export { getSession };
