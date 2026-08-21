import * as ExpoCrypto from 'expo-crypto';

/**
 * Primitivas criptográficas do app, com detecção de capacidade por plataforma.
 *
 * - **Web**: usa a WebCrypto nativa do navegador (`crypto.subtle`) — AES-256-GCM,
 *   HMAC-SHA256 e bytes aleatórios de verdade.
 * - **Android/iOS**: a WebCrypto não existe no Hermes, então os bytes aleatórios e o
 *   SHA-256 vêm do `expo-crypto` e o HMAC é montado sobre ele (construção padrão
 *   RFC 2104 — nada de algoritmo caseiro). O AES fica indisponível; nessas plataformas
 *   os segredos ficam no Keychain/Keystore, que é uma proteção mais forte do que
 *   cifrar em JavaScript.
 */

const webCrypto: Crypto | undefined = (globalThis as { crypto?: Crypto }).crypto;
const subtle: SubtleCrypto | undefined = webCrypto?.subtle;

/** Indica se a plataforma consegue abrir envelopes cifrados e cifrar dados locais. */
export const supportsAesGcm = typeof subtle?.decrypt === 'function';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? BASE64_ALPHABET[chunk & 63] : '=';
  }
  return output;
}

export function fromBase64(value: string): Uint8Array {
  const clean = value.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let byteIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const chunk =
      (BASE64_ALPHABET.indexOf(clean[i]) << 18) |
      (BASE64_ALPHABET.indexOf(clean[i + 1]) << 12) |
      ((i + 2 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 2]) : 0) << 6) |
      (i + 3 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 3]) : 0);
    if (byteIndex < bytes.length) bytes[byteIndex++] = (chunk >> 16) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = (chunk >> 8) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = chunk & 255;
  }
  return bytes;
}

/** Base64 seguro para URL, usado nos tokens (mesmo formato de um JWT). */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array {
  return fromBase64(value.replace(/-/g, '+').replace(/_/g, '/'));
}

export function encodeUtf8(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text);
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) as number;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63)
      );
    }
  }
  return new Uint8Array(bytes);
}

export function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  let text = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    if (byte < 0x80) {
      text += String.fromCharCode(byte);
    } else if (byte < 0xe0) {
      text += String.fromCharCode(((byte & 31) << 6) | (bytes[++i] & 63));
    } else if (byte < 0xf0) {
      text += String.fromCharCode(((byte & 15) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63));
    } else {
      const code =
        ((byte & 7) << 18) | ((bytes[++i] & 63) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63);
      text += String.fromCodePoint(code);
    }
  }
  return text;
}

/** Bytes aleatórios criptograficamente seguros. */
export function randomBytes(length: number): Uint8Array {
  if (webCrypto?.getRandomValues) {
    return webCrypto.getRandomValues(new Uint8Array(length));
  }
  return ExpoCrypto.getRandomBytes(length);
}

export function randomId(): string {
  return toBase64Url(randomBytes(16));
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  if (subtle) {
    return new Uint8Array(await subtle.digest('SHA-256', toArrayBuffer(data)));
  }
  const digest = await ExpoCrypto.digest(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    toArrayBuffer(data)
  );
  return new Uint8Array(digest);
}

const HMAC_BLOCK_SIZE = 64;

/**
 * HMAC-SHA256 (RFC 2104).
 *
 * No navegador delega para a WebCrypto; no celular usa o SHA-256 do expo-crypto na
 * construção padrão `H((K^opad) || H((K^ipad) || msg))`.
 */
export async function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  if (subtle) {
    const cryptoKey = await subtle.importKey(
      'raw',
      toArrayBuffer(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return new Uint8Array(await subtle.sign('HMAC', cryptoKey, toArrayBuffer(message)));
  }

  let blockKey = key.length > HMAC_BLOCK_SIZE ? await sha256(key) : key;
  if (blockKey.length < HMAC_BLOCK_SIZE) {
    const padded = new Uint8Array(HMAC_BLOCK_SIZE);
    padded.set(blockKey);
    blockKey = padded;
  }

  const innerPad = new Uint8Array(HMAC_BLOCK_SIZE);
  const outerPad = new Uint8Array(HMAC_BLOCK_SIZE);
  for (let i = 0; i < HMAC_BLOCK_SIZE; i += 1) {
    innerPad[i] = blockKey[i] ^ 0x36;
    outerPad[i] = blockKey[i] ^ 0x5c;
  }

  const inner = await sha256(concat(innerPad, message));
  return sha256(concat(outerPad, inner));
}

/** Comparação em tempo constante — não vaza onde as assinaturas divergem. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export type SealedData = {
  /** Nonce do GCM em base64. */
  iv: string;
  /** Texto cifrado + tag de autenticação em base64. */
  data: string;
};

/** Cifra com AES-256-GCM. Só disponível onde {@link supportsAesGcm} é `true`. */
export async function aesGcmEncrypt(key: Uint8Array, plaintext: string): Promise<SealedData> {
  if (!subtle) throw new Error('AES-GCM indisponível nesta plataforma');
  const iv = randomBytes(12);
  const cryptoKey = await importAesKey(key, 'encrypt');
  const sealed = await subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: 128 },
    cryptoKey,
    toArrayBuffer(encodeUtf8(plaintext))
  );
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(sealed)) };
}

/** Abre um blob AES-256-GCM. Lança se a tag de autenticação não bater (dado adulterado). */
export async function aesGcmDecrypt(key: Uint8Array, sealed: SealedData): Promise<string> {
  if (!subtle) throw new Error('AES-GCM indisponível nesta plataforma');
  const cryptoKey = await importAesKey(key, 'decrypt');
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(sealed.iv)), tagLength: 128 },
    cryptoKey,
    toArrayBuffer(fromBase64(sealed.data))
  );
  return decodeUtf8(new Uint8Array(plaintext));
}

async function importAesKey(key: Uint8Array, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  return (subtle as SubtleCrypto).importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'AES-GCM' },
    false,
    [usage]
  );
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

/** A WebCrypto recusa views de um buffer maior; esta cópia garante um ArrayBuffer exato. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
