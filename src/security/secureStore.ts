import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  encodeUtf8,
  fromBase64,
  hmacSha256,
  randomBytes,
  supportsAesGcm,
  timingSafeEqual,
  toBase64,
} from './crypto';

/**
 * Armazenamento local com proteção por plataforma.
 *
 * Dois níveis, para dois tipos de dado:
 *
 * - **Segredos** (tokens de sessão) → {@link setSecret}. No Android/iOS vão para o
 *   Keychain/Keystore via `expo-secure-store`, fora do alcance do resto do app e de
 *   qualquer inspeção comum do armazenamento. Na web, onde não existe equivalente,
 *   ficam cifrados com AES-256-GCM.
 * - **Dados de jogo** (time, lista de exploração) → {@link setProtected}. São maiores
 *   que o limite do Keychain, então vão para o AsyncStorage cifrados (web) ou com
 *   selo HMAC (nativo), o que torna qualquer adulteração detectável: um save editado
 *   à mão para injetar Pokémon ou trocar de usuário é simplesmente descartado.
 *
 * Limite honesto: na web nenhuma proteção puramente client-side resolve XSS — quem
 * executa script na página executa com os mesmos poderes do app. O que este módulo
 * entrega ali é ciframento em repouso e detecção de adulteração, não imunidade.
 */

const DEVICE_KEY_ID = 'poke.device.key.v1';
const useNativeSecureStore = Platform.OS !== 'web';

let deviceKeyCache: Uint8Array | null = null;
let deviceKeyPromise: Promise<Uint8Array> | null = null;

/**
 * Chave de 256 bits do dispositivo, criada no primeiro uso.
 *
 * Ela assina os tokens temporários e cifra o armazenamento local: como nunca sai do
 * aparelho, um save copiado para outro dispositivo não abre nem passa na verificação.
 */
export async function getDeviceKey(): Promise<Uint8Array> {
  if (deviceKeyCache) return deviceKeyCache;
  if (deviceKeyPromise) return deviceKeyPromise;

  deviceKeyPromise = (async () => {
    const stored = await readRaw(DEVICE_KEY_ID);
    if (stored) {
      const key = fromBase64(stored);
      if (key.length === 32) {
        deviceKeyCache = key;
        return key;
      }
    }

    const created = randomBytes(32);
    await writeRaw(DEVICE_KEY_ID, toBase64(created));
    deviceKeyCache = created;
    return created;
  })();

  try {
    return await deviceKeyPromise;
  } finally {
    deviceKeyPromise = null;
  }
}

/** Guarda um segredo curto (tokens). */
export async function setSecret(key: string, value: string): Promise<void> {
  if (useNativeSecureStore) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  if (!supportsAesGcm) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  const sealed = await aesGcmEncrypt(await getDeviceKey(), value);
  await AsyncStorage.setItem(key, JSON.stringify(sealed));
}

export async function getSecret(key: string): Promise<string | null> {
  if (useNativeSecureStore) {
    return SecureStore.getItemAsync(key);
  }

  const stored = await AsyncStorage.getItem(key);
  if (!stored) return null;
  if (!supportsAesGcm) return stored;

  try {
    return await aesGcmDecrypt(await getDeviceKey(), JSON.parse(stored));
  } catch {
    // Conteúdo adulterado ou chave do dispositivo trocada: trata como ausente.
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function deleteSecret(key: string): Promise<void> {
  if (useNativeSecureStore) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

type ProtectedRecord =
  | { v: 1; mode: 'aes-gcm'; iv: string; data: string }
  | { v: 1; mode: 'hmac'; mac: string; payload: string };

/** Grava um objeto de forma cifrada (web) ou selada por HMAC (nativo). */
export async function setProtected(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  const deviceKey = await getDeviceKey();

  const record: ProtectedRecord = supportsAesGcm
    ? { v: 1, mode: 'aes-gcm', ...(await aesGcmEncrypt(deviceKey, json)) }
    : {
        v: 1,
        mode: 'hmac',
        mac: toBase64(await hmacSha256(deviceKey, encodeUtf8(json))),
        payload: json,
      };

  await AsyncStorage.setItem(key, JSON.stringify(record));
}

/** Lê o que {@link setProtected} gravou. Devolve `null` se faltar, não abrir ou não conferir. */
export async function getProtected<T>(key: string): Promise<T | null> {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return null;

  try {
    const record = JSON.parse(stored) as ProtectedRecord;
    const deviceKey = await getDeviceKey();

    if (record.mode === 'aes-gcm') {
      return JSON.parse(await aesGcmDecrypt(deviceKey, record)) as T;
    }

    const expected = await hmacSha256(deviceKey, encodeUtf8(record.payload));
    if (!timingSafeEqual(expected, fromBase64(record.mac))) {
      throw new Error('Selo de integridade não confere');
    }
    return JSON.parse(record.payload) as T;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function removeProtected(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

async function readRaw(key: string): Promise<string | null> {
  if (useNativeSecureStore) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  }
  return AsyncStorage.getItem(key);
}

async function writeRaw(key: string, value: string): Promise<void> {
  if (useNativeSecureStore) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Keychain indisponível (emulador sem serviços): degrada para o AsyncStorage.
    }
  }
  await AsyncStorage.setItem(key, value);
}
