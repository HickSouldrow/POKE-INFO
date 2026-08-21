import Constants from 'expo-constants';

/**
 * Configuração de ambiente.
 *
 * A URL da nuvem nunca fica espalhada pelo código: quem precisa falar com o backend
 * usa `cloudClient`, e quem precisa saber o endereço lê daqui. Assim dá para apontar
 * o app para outro backend (o servidor Spring do projeto de exemplo, um ambiente de
 * homologação, um IP da rede local para testar no celular) sem tocar em nenhuma tela.
 *
 * Ordem de precedência:
 *   1. variável de ambiente `EXPO_PUBLIC_API_URL` (arquivo .env na raiz do projeto)
 *   2. `expo.extra.apiUrl` do app.json
 *   3. o backend padrão do projeto (AWS API Gateway)
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const DEFAULT_API_URL =
  'https://lnh1dhp1mj.execute-api.us-east-1.amazonaws.com/api-pokemon';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  extra.apiUrl ??
  DEFAULT_API_URL
).replace(/\/+$/, '');

/** Rotas de autenticação — o mesmo contrato do projeto de login usado como referência. */
export const AUTH_ROUTES = {
  register: '/auth/v1/register',
  login: '/auth/v1/login',
  refresh: '/auth/v1/refresh',
  logout: '/auth/v1/logout',
  session: '/auth/v1/session',
};

/**
 * Validade dos tokens temporários emitidos/aceitos pelo app.
 *
 * O token de acesso é curto de propósito: se alguém capturar o tráfego ou ler o
 * armazenamento do dispositivo, o que conseguir já nasce quase vencido. A renovação
 * acontece sozinha enquanto o token de renovação estiver válido.
 */
export const SESSION_TTL = {
  /** Token de acesso: 5 minutos. */
  accessSeconds: Number(process.env.EXPO_PUBLIC_ACCESS_TTL ?? 300),
  /** Token de renovação: 8 horas. Depois disso é obrigatório logar de novo. */
  refreshSeconds: Number(process.env.EXPO_PUBLIC_REFRESH_TTL ?? 8 * 60 * 60),
  /** Renova antecipadamente quando faltarem menos de 45s para expirar. */
  renewBeforeSeconds: 45,
};

/** Janela aceita para requisições assinadas (proteção contra replay). */
export const SIGNATURE_WINDOW_SECONDS = 120;

export const REQUEST_TIMEOUT_MS = 15000;
