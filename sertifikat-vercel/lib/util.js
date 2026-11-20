import { timingSafeEqual } from 'node:crypto';

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// escape karakter markdown Discord supaya nama pemain tidak merusak format pesan
export function esc(s) {
  return String(s).replace(/([\\`*_~|>])/g, '\\$1');
}

export const GAME_NAME = () => process.env.GAME_NAME || 'Classic Mode';
