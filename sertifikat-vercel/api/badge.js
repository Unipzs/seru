// Dipanggil oleh game Roblox (ClassicExit) setelah pemain dapat badge.
import { waitUntil } from '@vercel/functions';
import { createCert } from '../lib/store.js';
import { postCertificate } from '../lib/post.js';
import { safeEqual } from '../lib/util.js';

export async function POST(request) {
  const secret = request.headers.get('x-api-secret') || '';
  if (!process.env.API_SECRET || !safeEqual(secret, process.env.API_SECRET)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 });
  }

  const { userId, username, displayName } = body || {};
  if (!Number.isInteger(userId) || userId <= 0 ||
      typeof username !== 'string' || !username || username.length > 40 ||
      typeof displayName !== 'string' || displayName.length > 60) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const { cert, created } = await createCert({ userId, username, displayName });

  // balas cepat ke Roblox; render + kirim ke Discord lanjut di belakang layar
  if (created) {
    waitUntil(
      postCertificate(cert).catch((e) =>
        console.error('Gagal kirim sertifikat (bisa diulang lewat /api/retry):', e)),
    );
  }
  return Response.json({ ok: true, duplicate: !created });
}
