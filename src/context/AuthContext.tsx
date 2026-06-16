import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pokemon } from "@/@types/pokemon";
import { registerUser, loginUser, getApiErrorMessage } from "@/integration/pokemonApi";

type UserCredentials = {
    userId: string;          // UUID retornado pelo backend no login/registro
    name: string;            // username usado na autenticação
    team: Pokemon[];
    availablePokemons: Pokemon[]; // Nova lista fixa salva por usuário
};

// Sessão atual (restaurada ao abrir o app).
const LOGGED_USER_KEY = '@Auth:loggedUser';
// Dados de jogo (time/explorar) ficam locais, indexados pelo userId do backend.
const gameDataKey = (userId: string) => `@PokeData:${userId}`;

type AuthContextData = {
    isAuthenticated: boolean;
    user: UserCredentials | null;
    isLoading: boolean;
    signIn: (usernameOrEmail: string, senha: string) => Promise<void>;
    signUp: (name: string, senha: string) => Promise<void>;
    signOut: () => Promise<void>;
    addToTeam: (pokemon: Pokemon) => Promise<void>;
    removeFromTeam: (pokemonIndex: number) => Promise<void>;
    setInitialExplorationList: (pokemons: Pokemon[]) => Promise<void>; // Registra a primeira lista
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserCredentials | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            const storageUser = await AsyncStorage.getItem(LOGGED_USER_KEY);
            if (storageUser) {
                setUser(JSON.parse(storageUser));
                setIsAuthenticated(true);
            }
            setIsLoading(false);
        }
        loadStorageData();
    }, []);

    async function updateGlobalUserData(updatedUser: UserCredentials) {
        setUser(updatedUser);
        await AsyncStorage.setItem(LOGGED_USER_KEY, JSON.stringify(updatedUser));

        // Persiste os dados de jogo localmente, atrelados ao userId do backend.
        await AsyncStorage.setItem(
            gameDataKey(updatedUser.userId),
            JSON.stringify({
                team: updatedUser.team,
                availablePokemons: updatedUser.availablePokemons,
            })
        );
    }

    async function signIn(username: string, senha: string) {
        let userId: string;
        try {
            ({ userId } = await loginUser(username.trim(), senha));
        } catch (error) {
            throw new Error(getApiErrorMessage(error, "Usuário ou senha inválidos."));
        }

        // Recupera os dados de jogo salvos localmente para este usuário (se houver).
        const storedGameData = await AsyncStorage.getItem(gameDataKey(userId));
        const gameData = storedGameData ? JSON.parse(storedGameData) : {};

        const loggedUser: UserCredentials = {
            userId,
            name: username.trim(),
            team: gameData.team || [],
            availablePokemons: gameData.availablePokemons || [],
        };

        setUser(loggedUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(LOGGED_USER_KEY, JSON.stringify(loggedUser));
    }

    async function signUp(name: string, senha: string) {
        // O backend autentica apenas por username + senha (sem e-mail).
        try {
            await registerUser(name.trim(), senha);
        } catch (error) {
            throw new Error(getApiErrorMessage(error, "Não foi possível criar a conta."));
        }
        // Os dados de jogo são criados localmente no primeiro login.
    }

    // Define de forma definitiva a lista de exploração gerada na criação da conta
    async function setInitialExplorationList(pokemons: Pokemon[]) {
        if (!user || user.availablePokemons.length > 0) return;
        await updateGlobalUserData({ ...user, availablePokemons: pokemons });
    }

    async function addToTeam(pokemon: Pokemon) {
        if (!user) return;
        
        const alreadyInTeam = user.team.some(p => p.index === pokemon.index);
        if (alreadyInTeam) throw new Error("Este Pokémon já está no seu time!");

        if (user.team.length >= 6) {
            throw new Error("Seu time já está cheio (máximo 6 Pokémon)!");
        }

        const updatedTeam = [...user.team, pokemon];
        await updateGlobalUserData({ ...user, team: updatedTeam });
    }

    async function removeFromTeam(pokemonIndex: number) {
        if (!user) return;

        const updatedTeam = user.team.filter(p => p.index !== pokemonIndex);
        await updateGlobalUserData({ ...user, team: updatedTeam });
    }

    async function signOut() {
        setUser(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem(LOGGED_USER_KEY);
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, signIn, signUp, signOut, addToTeam, removeFromTeam, setInitialExplorationList, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);