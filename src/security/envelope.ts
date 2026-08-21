import { SIGNATURE_WINDOW_SECONDS } from '@/config/env';

import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  encodeUtf8,
  hmacSha256,
  randomId,
  toBase64,
} from './crypto';

/**
 * Canal seguro em cima do HTTP.
 *
 * Duas coisas acontecem aqui:
 *
 * 1. **Envelope cifrado** — quando o backend responde `{ v, alg, iv, data }`, o corpo que
 *    trafega é um blob AES-256-GCM opaco. O JSON de verdade só passa a existir depois que
 *    este módulo o abre em JavaScript, com a chave que o app gerou em memória e enviou uma
 *    única vez no login. Repetir a URL no navegador, no curl ou olhar a aba Network devolve
 *    texto cifrado; e como o GCM autentica o conteúdo, resposta adulterada não abre.
 * 2. **Requisição assinada** — cada chamada leva timestamp, nonce e um HMAC da própria
 *    requisição. Capturar e repetir não funciona: o timestamp sai da janela e o nonce é
 *    de uso único.
 *
 * Isso soma ao HTTPS, não o substitui. E vale lembrar do limite real: o JavaScript roda
 * na máquina do usuário, então essas camadas elevam bastante o custo de bisbilhotar,
 * inspecionar e repetir tráfego — não tornam o cliente confiável. A palavra final continua
 * sendo do servidor, que valida token e assinatura.
 */

export type CloudEnvelope = {
  v: number;
  alg: string;
  iv: string;
  data: string;
};

export const CHANNEL_VERSION = 'v1';

export const CHANNEL_HEADERS = {
  timestamp: 'X-Poke-Timestamp',
  nonce: 'X-Poke-Nonce',
  signature: 'X-Poke-Signature',
  channel: 'X-Poke-Channel',
  session: 'X-Poke-Session',
};

export function isEnvelope(body: unknown): body is CloudEnvelope {
  if (!body || typeof body !== 'object') return false;
  const candidate = body as Partial<CloudEnvelope>;
  return (
    typeof candidate.v === 'number' &&
    typeof candidate.alg === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.data === 'string'
  );
}

/** Abre o envelope e devolve o JSON original. Lança se a chave ou a tag não conferirem. */
export async function openEnvelope<T>(envelope: CloudEnvelope, key: Uint8Array): Promise<T> {
  if (!envelope.alg.toUpperCase().startsWith('AES-256-GCM')) {
    throw new Error(`Envelope com algoritmo não suportado: ${envelope.alg}`);
  }
  const json = await aesGcmDecrypt(key, { iv: envelope.iv, data: envelope.data });
  return JSON.parse(json) as T;
}

/** Empacota um payload de saída no mesmo formato, para backends que aceitam corpo cifrado. */
export async function sealPayload(payload: unknown, key: Uint8Array): Promise<CloudEnvelope> {
  const sealed = await aesGcmEncrypt(key, JSON.stringify(payload));
  return { v: 1, alg: 'AES-256-GCM', iv: sealed.iv, data: sealed.data };
}

export type SignatureInput = {
  method: string;
  /** Caminho da requisição, sem host e sem query. */
  path: string;
  /** Corpo já serializado, quando houver. */
  body?: string;
};

/**
 * Assina a requisição com a chave da sessão.
 *
 * A mensagem cobre método, caminho, timestamp, nonce e corpo — trocar qualquer um deles
 * invalida a assinatura. A janela aceita é de {@link SIGNATURE_WINDOW_SECONDS} segundos.
 */
export async function signRequest(
  input: SignatureInput,
  key: Uint8Array
): Promise<Record<string, string>> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomId();
  const message = [input.method.toUpperCase(), input.path, timestamp, nonce, input.body ?? ''].join(
    '\n'
  );
  const signature = toBase64(await hmacSha256(key, encodeUtf8(message)));

  return {
    [CHANNEL_HEADERS.timestamp]: timestamp,
    [CHANNEL_HEADERS.nonce]: nonce,
    [CHANNEL_HEADERS.signature]: signature,
  };
}

/** Janela de validade anunciada ao backend, para manter os dois lados combinados. */
export const signatureWindowSeconds = SIGNATURE_WINDOW_SECONDS;
