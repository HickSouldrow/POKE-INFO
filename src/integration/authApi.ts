import axios from 'axios';

import { AUTH_ROUTES } from '@/config/env';
import {
  canRenew,
  clearSession,
  createChannelKey,
  getSession,
  replaceTokens,
  startSession,
  type ServerTokens,
  type Session,
  type SessionUser,
} from '@/security/session';

import { cloudClient, readCached, registerRenewer } from './cloudClient';

export { getApiErrorMessage } from './cloudClient';

/**
 * Autenticação contra a nuvem.
 *
 * O contrato é o mesmo do projeto de login usado como referência (`/auth/v1/...`), e o
 * app se adapta ao que o backend devolver:
 *
 * - devolveu `accessToken`/`token` → são os tokens temporários oficiais da sessão;
 * - devolveu só `userId` (backend atual) → o app emite os tickets curtos localmente e
 *   segue com o mesmo ciclo de expiração e renovação.
 *
 * Em qualquer um dos casos, credencial nenhuma fica guardada: o que sobra no dispositivo
 * é um token de renovação temporário, no armazenamento seguro.
 */

type CloudAuthPayload = {
  userId?: string;
  id?: string;
  username?: string;
  roles?: string[];
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  sessionId?: string;
  secureChannel?: boolean;
};

export type CloudProfile = {
  userId: string;
  username: string;
  roles: string[];
  email?: string;
  cep?: string;
};

/** Cria a conta. O backend responde com o usuário criado; a sessão vem no login. */
export async function registerUser(username: string, password: string): Promise<void> {
  await cloudClient.post<CloudAuthPayload>(
    AUTH_ROUTES.register,
    { username, password },
    { skipAuth: true }
  );
}

/**
 * Autentica e abre a sessão temporária.
 *
 * A chave do canal seguro é gerada em memória e enviada uma única vez, aqui. Se o backend
 * confirmar (`secureChannel: true`), as respostas seguintes chegam cifradas e são abertas
 * em JavaScript; se não conhecer o protocolo, ele ignora o campo e nada muda para ele.
 */
export async function loginUser(username: string, password: string): Promise<Session> {
  const channelKey = createChannelKey();

  let data: CloudAuthPayload;
  try {
    ({ data } = await cloudClient.post<CloudAuthPayload>(
      AUTH_ROUTES.login,
      { username, password, clientKey: channelKey },
      { skipAuth: true }
    ));
  } catch (error) {
    // Backend com validação estrita de schema pode recusar o campo extra. Nesse caso
    // tentamos de novo sem ele: o login continua funcionando, só sem canal cifrado.
    if (!channelKey || !isSchemaRejection(error)) throw error;

    ({ data } = await cloudClient.post<CloudAuthPayload>(
      AUTH_ROUTES.login,
      { username, password },
      { skipAuth: true }
    ));
  }

  const user = readUser(data, username);
  const acceptedChannel = data?.secureChannel === true ? channelKey : undefined;

  return startSession(user, acceptedChannel, readTokens(data));
}

function isSchemaRejection(error: unknown): boolean {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 400 || status === 422;
}

/** Encerra a sessão — avisa o backend quando ele mantém estado, e limpa o dispositivo. */
export async function logoutFromCloud(): Promise<void> {
  const session = getSession();

  if (session?.issuedByServer) {
    try {
      await cloudClient.post(
        AUTH_ROUTES.logout,
        { refreshToken: session.refreshToken },
        { skipAuth: true }
      );
    } catch {
      // Logout é local em primeiro lugar: falha de rede não pode prender o usuário na sessão.
    }
  }

  await clearSession();
}

/**
 * Troca o token de renovação por um par novo.
 *
 * É chamada sozinha pelo `cloudClient` quando o token de acesso está para vencer ou o
 * backend responde 401.
 */
export async function renewSession(): Promise<boolean> {
  const session = getSession();
  if (!session || !canRenew()) return false;

  if (!session.issuedByServer) {
    // Tickets locais: o de renovação ainda vale, então emitimos um acesso novo e curto.
    await replaceTokens(null);
    return true;
  }

  try {
    const { data } = await cloudClient.post<CloudAuthPayload>(
      AUTH_ROUTES.refresh,
      { refreshToken: session.refreshToken, clientKey: session.channelKey },
      { skipAuth: true }
    );

    const tokens = readTokens(data);
    if (!tokens) {
      await clearSession();
      return false;
    }

    await replaceTokens(tokens);
    return true;
  } catch {
    await clearSession();
    return false;
  }
}

registerRenewer(renewSession);

/**
 * Perfil do usuário guardado na nuvem.
 *
 * É a rota que chega cifrada quando o canal seguro está ativo: o corpo HTTP é um blob e
 * o objeto abaixo só existe depois que o app o abre. Backends que não expõem a rota
 * simplesmente não têm perfil remoto, e o app segue com os dados da sessão.
 */
export async function fetchCloudProfile(): Promise<CloudProfile | null> {
  const session = getSession();
  if (!session?.issuedByServer) return null;

  try {
    return await readCached(
      `profile:${session.user.userId}`,
      async () => {
        const { data } = await cloudClient.get<CloudProfile>(AUTH_ROUTES.session);
        return data;
      },
      5 * 60_000
    );
  } catch {
    return null;
  }
}

function readTokens(payload: CloudAuthPayload | undefined): ServerTokens | null {
  if (!payload) return null;

  const accessToken = payload.accessToken ?? payload.token;
  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn,
    sessionId: payload.sessionId,
  };
}

function readUser(payload: CloudAuthPayload | undefined, fallbackUsername: string): SessionUser {
  const userId = payload?.userId ?? payload?.id;
  if (!userId) {
    throw new Error('A nuvem não identificou o usuário. Tente novamente.');
  }

  return {
    userId,
    username: payload?.username ?? fallbackUsername,
    roles: payload?.roles ?? ['USER'],
  };
}
