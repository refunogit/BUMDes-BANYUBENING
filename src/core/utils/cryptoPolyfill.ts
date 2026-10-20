/**
 * Web Crypto shim untuk Hermes: menyediakan global.crypto.getRandomValues
 * lewat expo-crypto (native, aman). Dibutuhkan oleh uuid v4 dan bcryptjs.
 * Impor modul ini sebagai side-effect sebelum membuat id/hash.
 */
import * as ExpoCrypto from 'expo-crypto';

type RandomSource = { getRandomValues?: <T extends ArrayBufferView>(array: T) => T };
type GlobalWithCrypto = { crypto?: RandomSource };

const holder = globalThis as unknown as GlobalWithCrypto;

if (!holder.crypto) {
  holder.crypto = {};
}

if (typeof holder.crypto.getRandomValues !== 'function') {
  holder.crypto.getRandomValues = function getRandomValues<T extends ArrayBufferView>(array: T): T {
    ExpoCrypto.getRandomValues(array as unknown as Uint8Array);
    return array;
  };
}

export {};
