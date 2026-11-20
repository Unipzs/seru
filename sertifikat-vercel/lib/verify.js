// Verifikasi tanda tangan Ed25519 request Discord (wajib untuk Interactions Endpoint).
import { createPublicKey, verify } from 'node:crypto';

const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export function verifyDiscordSignature(rawBody, signature, timestamp, publicKeyHex) {
  try {
    if (!signature || !timestamp || !publicKeyHex) return false;
    const key = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]),
      format: 'der',
      type: 'spki',
    });
    return verify(null, Buffer.from(timestamp + rawBody), key, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
