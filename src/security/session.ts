import { SESSION_TTL } from '@/config/env';

import {
  encodeUtf8,
  decodeUtf8,
  fromBase64,
  fromBase64Url,
  hmacSha256,
  randomBytes,
  randomId,
  supportsAesGcm,
  timingSafeEqual,
  toBase64,
  toBase64Url,
} from './crypto';
import { deleteSecret, getDeviceKey, getSecret, setSecret } from './secureStore';

/**
 * Sessão do usuário baseada em tokens temporários.
 *
 * É o mesmo desenho do projeto de login usado como referência, trazido para o app:
 * um **token de acesso curto** (minutos) que acompanha cada requisição e um **token de
 * renovação** mais longo que só serve para emitir um par novo. Se o backend já devolve
 * JWT, o app usa os tokens dele; se devolve apenas o `userId` (caso do backend atual),
 * o app emite localmente tickets no mesmo formato, assinados com a chave do dispositivo.
 *
 * O que o ticket local garante e o que não garante:
 * - **garante** que a sessão expira sozinha, que o `userId` gravado no aparelho não pode
 *   ser editado à mão (a assinatura quebra) e que existe uma chave por sessão para
 *   cifrar dados e assinar requisições;
 * - **não substitui** validação no servidor: só um backend que confere a assinatura
 *   pode recusar um token forjado. Por isso o formato é idêntico ao do backend Spring —
 *   quando ele entrar no lugar, muda a URL e nada mais.
 */

export type SessionUser = {
  userId: string;
  username: string;
  roles: string[];
};

export type Session = {
  user: SessionUser;
  sessionId: string;
  accessToken: string;
  /** Epoch em ms. */
  accessExpiresAt: number;
  refreshToken: string;
  refreshExpiresAt: number;
  /** Chave AES-256 (base64) do canal seguro; ausente onde o AES não está disponível. */
  channelKey?: string;
  /** `true` quando os tokens vieram do backend; `false` quando emitidos pelo app. */
  issuedByServer: boolean;
};

const STORAGE_KEY = 'poke.session.v1';
const TICKET_PREFIX = 'pk1';

type TicketPayload = {
  sub: string;
  usr: string;
  sid: string;
  typ: 'access' | 'refresh';
  iat: number;
  exp: number;
  jti: string;
};

type PersistedSession = {
  user: SessionUser;
  sessionId: string;
  refreshToken: string;
  refreshExpiresAt: number;
  channelKey?: string;
  issuedByServer: boolean;
};

type Listener = (session: Session | null) => void;

let current: Session | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

export function getSession(): Session | null {
  return current;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener(current));
}

/** Token de acesso ainda utilizável (com margem para a renovação antecipada). */
export function hasFreshAccess(): boolean {
  if (!current) return false;
  return current.accessExpiresAt - Date.now() > SESSION_TTL.renewBeforeSeconds * 1000;
}

export function canRenew(): boolean {
  return !!current && current.refreshExpiresAt > Date.now();
}

export function secondsUntilExpiry(): number {
  if (!current) return 0;
  return Math.max(0, Math.floor((current.refreshExpiresAt - Date.now()) / 1000));
}

/** Chave do canal seguro em bytes, para cifrar/assinar. */
export function channelKeyBytes(): Uint8Array | null {
  if (!current?.channelKey) return null;
  return fromBase64(current.channelKey);
}

/** Gera a chave que o app manda ao backend no login para receber respostas cifradas. */
export function createChannelKey(): string | undefined {
  return supportsAesGcm ? toBase64(randomBytes(32)) : undefined;
}

export type ServerTokens = {
  accessToken: string;
  refreshToken?: string;
  /** Em segundos. */
  expiresIn?: number;
  sessionId?: string;
};

/**
 * Abre uma sessão nova.
 *
 * @param serverTokens tokens do backend, quando ele os emite; `null` faz o app emitir
 *                     os tickets temporários localmente.
 */
export async function startSession(
  user: SessionUser,
  channelKey: string | undefined,
  serverTokens: ServerTokens | null
): Promise<Session> {
  const sessionId = serverTokens?.sessionId ?? randomId();
  const now = Date.now();

  const session: Session = serverTokens
    ? {
        user,
        sessionId,
        accessToken: serverTokens.accessToken,
        accessExpiresAt: now + (serverTokens.expiresIn ?? SESSION_TTL.accessSeconds) * 1000,
        refreshToken: serverTokens.refreshToken ?? serverTokens.accessToken,
        refreshExpiresAt: now + SESSION_TTL.refreshSeconds * 1000,
        channelKey,
        issuedByServer: true,
      }
    : {
        user,
        sessionId,
        accessToken: await mintTicket(user, sessionId, 'access', SESSION_TTL.accessSeconds),
        accessExpiresAt: now + SESSION_TTL.accessSeconds * 1000,
        refreshToken: await mintTicket(user, sessionId, 'refresh', SESSION_TTL.refreshSeconds),
        refreshExpiresAt: now + SESSION_TTL.refreshSeconds * 1000,
        channelKey,
        issuedByServer: false,
      };

  current = session;
  await persist(session);
  scheduleExpiry();
  emit();
  return session;
}

/** Substitui o par de tokens mantendo a mesma sessão (renovação). */
export async function replaceTokens(serverTokens: ServerTokens | null): Promise<Session | null> {
  if (!current) return null;
  const now = Date.now();

  current = serverTokens
    ? {
        ...current,
        accessToken: serverTokens.accessToken,
        accessExpiresAt: now + (serverTokens.expiresIn ?? SESSION_TTL.accessSeconds) * 1000,
        refreshToken: serverTokens.refreshToken ?? current.refreshToken,
        issuedByServer: true,
      }
    : {
        ...current,
        accessToken: await mintTicket(
          current.user,
          current.sessionId,
          'access',
          SESSION_TTL.accessSeconds
        ),
        accessExpiresAt: now + SESSION_TTL.accessSeconds * 1000,
      };

  await persist(current);
  emit();
  return current;
}

/**
 * Restaura a sessão gravada no dispositivo.
 *
 * O token de acesso nunca é persistido — só o de renovação, que fica no armazenamento
 * seguro. Ao reabrir o app, um token de acesso novo é emitido a partir dele.
 */
export async function restoreSession(): Promise<Session | null> {
  const stored = await getSecret(STORAGE_KEY);
  if (!stored) return null;

  try {
    const persisted = JSON.parse(stored) as PersistedSession;

    if (persisted.refreshExpiresAt <= Date.now()) {
      await clearSession();
      return null;
    }

    if (!persisted.issuedByServer) {
      // Ticket local: só vale se a assinatura da chave deste dispositivo conferir.
      const payload = await verifyTicket(persisted.refreshToken);
      if (!payload || payload.typ !== 'refresh' || payload.sub !== persisted.user.userId) {
        await clearSession();
        return null;
      }
    }

    current = {
      user: persisted.user,
      sessionId: persisted.sessionId,
      // Expirado de propósito: força a renovação antes da primeira requisição.
      accessToken: '',
      accessExpiresAt: 0,
      refreshToken: persisted.refreshToken,
      refreshExpiresAt: persisted.refreshExpiresAt,
      channelKey: persisted.channelKey,
      issuedByServer: persisted.issuedByServer,
    };

    scheduleExpiry();
    emit();
    return current;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  current = null;
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  await deleteSecret(STORAGE_KEY);
  emit();
}

async function persist(session: Session): Promise<void> {
  const persisted: PersistedSession = {
    user: session.user,
    sessionId: session.sessionId,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
    channelKey: session.channelKey,
    issuedByServer: session.issuedByServer,
  };
  await setSecret(STORAGE_KEY, JSON.stringify(persisted));
}

/** Derruba a sessão no instante em que o token de renovação vence, sem esperar uma ação. */
function scheduleExpiry() {
  if (expiryTimer) clearTimeout(expiryTimer);
  if (!current) return;

  const remaining = current.refreshExpiresAt - Date.now();
  if (remaining <= 0) {
    void clearSession();
    return;
  }
  // setTimeout satura acima de ~24 dias; a sessão é bem mais curta que isso.
  expiryTimer = setTimeout(() => {
    void clearSession();
  }, remaining);
}

async function mintTicket(
  user: SessionUser,
  sessionId: string,
  type: 'access' | 'refresh',
  ttlSeconds: number
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: TicketPayload = {
    sub: user.userId,
    usr: user.username,
    sid: sessionId,
    typ: type,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
    jti: randomId(),
  };

  const body = toBase64Url(encodeUtf8(JSON.stringify(payload)));
  const signature = await signTicketBody(body);
  return `${TICKET_PREFIX}.${body}.${signature}`;
}

/** Confere assinatura e validade de um ticket emitido por este dispositivo. */
export async function verifyTicket(ticket: string): Promise<TicketPayload | null> {
  const parts = ticket.split('.');
  if (parts.length !== 3 || parts[0] !== TICKET_PREFIX) return null;

  const [, body, signature] = parts;
  const expected = await signTicketBody(body);
  if (!timingSafeEqual(fromBase64Url(expected), fromBase64Url(signature))) return null;

  try {
    const payload = JSON.parse(decodeUtf8(fromBase64Url(body))) as TicketPayload;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function signTicketBody(body: string): Promise<string> {
  const deviceKey = await getDeviceKey();
  return toBase64Url(await hmacSha256(deviceKey, encodeUtf8(`${TICKET_PREFIX}.${body}`)));
}
