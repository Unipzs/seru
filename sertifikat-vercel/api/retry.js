// Kirim ulang sertifikat yang dulu gagal terkirim ke Discord (mis. bot belum diundang saat itu).
// Buka: https://DOMAINMU/api/retry?key=API_SECRET_KAMU
import { unpostedCerts } from '../lib/store.js';
import { postCertificate } from '../lib/post.js';
import { safeEqual } from '../lib/util.js';

export async function GET(request) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!process.env.API_SECRET || !safeEqual(key, process.env.API_SECRET)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const certs = await unpostedCerts();
  let sent = 0;
  const failed = [];
  for (const cert of certs) {
    try {
      await postCertificate(cert);
      sent += 1;
    } catch (e) {
      failed.push({ username: cert.username, error: String(e.message || e) });
    }
  }
  return Response.json({ ok: true, pending: certs.length, sent, failed });
}
