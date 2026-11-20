// Penyimpanan data di Upstash Redis (gratis via Vercel Marketplace).
// Serverless tidak punya disk permanen, jadi semua data disimpan di sini.
import { Redis } from '@upstash/redis';

let client;
function r() {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Redis belum terhubung (env UPSTASH_REDIS_REST_URL / TOKEN kosong)');
    // deserialisasi dimatikan: ID Discord (18 digit) akan rusak kalau diparse jadi angka
    client = new Redis({ url, token, automaticDeserialization: false });
  }
  return client;
}

const getJSON = async (key) => {
  const raw = await r().get(key);
  return raw ? JSON.parse(raw) : null;
};

// ---- sertifikat (1 akun Roblox = 1 sertifikat) ----
export const getCert = (userId) => getJSON(`cert:${userId}`);

export async function findCertByUsername(username) {
  const id = await r().get(`uname:${String(username).toLowerCase()}`);
  return id ? getCert(id) : null;
}

export async function createCert({ userId, username, displayName }) {
  const existing = await getCert(userId);
  if (existing) return { cert: existing, created: false };

  const number = await r().incr('cert:counter');
  const cert = {
    userId,
    username,
    displayName,
    issuedAt: new Date().toISOString(),
    number,
    posted: false,
    messageId: null,
  };
  // NX = hanya tulis kalau belum ada (aman kalau dua request datang bersamaan)
  const ok = await r().set(`cert:${userId}`, JSON.stringify(cert), { nx: true });
  if (!ok) return { cert: await getCert(userId), created: false };

  await r().set(`uname:${username.toLowerCase()}`, String(userId));
  await r().sadd('cert:unposted', String(userId));
  return { cert, created: true };
}

export async function markPosted(userId, messageId) {
  const cert = await getCert(userId);
  if (!cert) return;
  await r().set(`cert:${userId}`, JSON.stringify({ ...cert, posted: true, messageId }));
  await r().srem('cert:unposted', String(userId));
}

export async function unpostedCerts() {
  const ids = await r().smembers('cert:unposted');
  const certs = await Promise.all(ids.map((id) => getCert(id)));
  return certs.filter(Boolean);
}

// ---- link Discord <-> Roblox ----
export async function getLink(discordId) {
  return r().get(`link:${discordId}`); // string userId atau null
}

export async function getDiscordByRoblox(userId) {
  return r().get(`linkrev:${userId}`); // string discordId atau null
}

export async function link(discordId, userId) {
  const oldUser = await r().get(`link:${discordId}`);
  if (oldUser && String(oldUser) !== String(userId)) await r().del(`linkrev:${oldUser}`);
  const oldOwner = await r().get(`linkrev:${userId}`);
  if (oldOwner && oldOwner !== discordId) await r().del(`link:${oldOwner}`);
  await r().set(`link:${discordId}`, String(userId));
  await r().set(`linkrev:${userId}`, String(discordId));
}

// ---- verifikasi sementara (otomatis hilang setelah 10 menit) ----
export const setPending = (discordId, data) =>
  r().set(`pending:${discordId}`, JSON.stringify(data), { ex: 600 });
export const getPending = (discordId) => getJSON(`pending:${discordId}`);
export const clearPending = (discordId) => r().del(`pending:${discordId}`);
