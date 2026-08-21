import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import { API_URL, REQUEST_TIMEOUT_MS } from '@/config/env';
import {
  CHANNEL_HEADERS,
  CHANNEL_VERSION,
  isEnvelope,
  openEnvelope,
  signRequest,
} from '@/security/envelope';
import {
  canRenew,
  channelKeyBytes,
  clearSession,
  getSession,
  hasFreshAccess,
} from '@/security/session';

/**
 * Portão único de acesso à nuvem.
 *
 * Nenhuma tela fala HTTP direto: tudo passa por aqui, e é aqui que mora a diferença
 * entre "buscar um JSON" e "abrir um canal". A cada requisição este módulo:
 *
 * 1. garante que o token de acesso está fresco (renovando sozinho quando falta pouco);
 * 2. anexa o token temporário e assina a chamada com a chave da sessão;
 * 3. abre em JavaScript o envelope cifrado que voltar, de modo que o dado legível só
 *    exista dentro da memória do app — nunca no corpo HTTP, nunca na URL;
 * 4. reage a 401 renovando uma vez e, se não der, encerrando a sessão na hora.
 *
 * Os cabeçalhos do canal seguro só são enviados quando o backend aceitou a chave no
 * login (`secureChannel`). Contra um backend que não conhece o protocolo, o app se
 * comporta como antes — sem inventar cabeçalhos que quebrariam o CORS.
 */

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Pula sessão/assinatura — usado pelas próprias rotas de login e renovação. */
    skipAuth?: boolean;
    /** Marca interna para não repetir a mesma requisição em loop após um 401. */
    retriedAfterRenew?: boolean;
  }
}

export const cloudClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

type Renewer = () => Promise<boolean>;

let renewer: Renewer | null = null;
let renewalInFlight: Promise<boolean> | null = null;

/**
 * Registra quem sabe renovar a sessão.
 *
 * Evita import circular: `authApi` conhece o cloudClient, e o cloudClient só conhece
 * esta função.
 */
export function registerRenewer(fn: Renewer): void {
  renewer = fn;
}

/** Renova no máximo uma vez por vez: várias requisições simultâneas esperam a mesma. */
async function renewOnce(): Promise<boolean> {
  if (!renewer) return false;
  if (!renewalInFlight) {
    renewalInFlight = renewer().finally(() => {
      renewalInFlight = null;
    });
  }
  return renewalInFlight;
}

/** Garante um token de acesso válido antes de sair a requisição. */
export async function ensureFreshAccess(): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  if (hasFreshAccess()) return true;
  if (!canRenew()) {
    await clearSession();
    return false;
  }
  return renewOnce();
}

function requestPath(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? '';
  const absolute = /^https?:\/\//i.test(url) ? url : `${config.baseURL ?? ''}${url}`;
  const withoutProtocol = absolute.replace(/^https?:\/\/[^/]+/i, '');
  return withoutProtocol.split('?')[0] || '/';
}

cloudClient.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config;

  await ensureFreshAccess();
  const session = getSession();
  if (!session) return config;

  config.headers.set('Authorization', `Bearer ${session.accessToken}`);

  const channelKey = channelKeyBytes();
  if (!channelKey) return config;

  config.headers.set(CHANNEL_HEADERS.channel, CHANNEL_VERSION);
  config.headers.set(CHANNEL_HEADERS.session, session.sessionId);

  const body =
    config.data === undefined || config.data === null
      ? ''
      : typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data);

  const signature = await signRequest(
    { method: config.method ?? 'get', path: requestPath(config), body },
    channelKey
  );
  Object.entries(signature).forEach(([name, value]) => config.headers.set(name, value));

  return config;
});

cloudClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    if (!isEnvelope(response.data)) return response;

    const channelKey = channelKeyBytes();
    if (!channelKey) {
      throw new Error('Resposta cifrada recebida sem chave de sessão. Faça login novamente.');
    }

    // O dado legível nasce aqui, em memória — nunca trafegou em claro.
    response.data = await openEnvelope(response.data, channelKey);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & AxiosRequestConfig) | undefined;

    if (error.response?.status !== 401 || !config || config.skipAuth || config.retriedAfterRenew) {
      return Promise.reject(error);
    }

    if (!canRenew() || !(await renewOnce())) {
      await clearSession();
      return Promise.reject(error);
    }

    config.retriedAfterRenew = true;
    return cloudClient.request(config);
  }
);

type CacheEntry = { value: unknown; expiresAt: number };

const memoryCache = new Map<string, CacheEntry>();

/**
 * Cache em memória para dados da nuvem.
 *
 * De propósito não persiste: dado da nuvem vive enquanto o app está aberto e some com
 * ele, em vez de ficar em claro no armazenamento do dispositivo.
 */
export async function readCached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 60_000
): Promise<T> {
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const value = await loader();
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearCloudCache(): void {
  memoryCache.clear();
}

/** Mensagem de erro amigável — o backend responde `{ date, status, error, message }`. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.code === 'ECONNABORTED') return 'A nuvem demorou para responder. Tente novamente.';
    if (!error.response) return 'Sem conexão com a nuvem. Verifique sua internet.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
