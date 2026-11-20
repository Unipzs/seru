// Endpoint slash command Discord (Interactions Endpoint URL).
import { waitUntil } from '@vercel/functions';
import crypto from 'node:crypto';
import * as store from '../lib/store.js';
import * as roblox from '../lib/roblox.js';
import { editOriginal } from '../lib/discord.js';
import { verifyDiscordSignature } from '../lib/verify.js';
import { esc, GAME_NAME } from '../lib/util.js';

const EPHEMERAL = 64;
const reply = (content) => Response.json({ type: 4, data: { content, flags: EPHEMERAL } });
const defer = (ephemeral) =>
  Response.json({ type: 5, data: ephemeral ? { flags: EPHEMERAL } : {} });

// jalankan di belakang layar setelah "defer"; error apa pun dibalas sopan
function background(interaction, job) {
  waitUntil(
    (async () => {
      try {
        await job();
      } catch (e) {
        console.error(e);
        await editOriginal(interaction, { content: 'Ada error, coba lagi sebentar lagi ya.' }).catch(() => {});
      }
    })(),
  );
}

async function sertif(i, discordId) {
  const opts = i.data.options || [];
  const uname = opts.find((o) => o.name === 'username')?.value?.trim();
  let cert;

  if (uname) {
    cert = await store.findCertByUsername(uname);
    if (!cert) return reply(`Belum ada sertifikat untuk **${esc(uname)}**.`);
  } else {
    const rid = await store.getLink(discordId);
    if (!rid) {
      return reply('Akun Discord-mu belum terhubung ke Roblox. Pakai `/verify mulai`, atau lihat sertifikat dengan `/sertif username:<username Roblox>`.');
    }
    cert = await store.getCert(rid);
    if (!cert) {
      return reply(`Kamu belum punya sertifikat. Selesaikan **${esc(GAME_NAME())}** dulu sampai dapat badge-nya!`);
    }
  }

  background(i, async () => {
    const { renderCertificate } = await import('../lib/certificate.js'); // lazy: canvas berat
    const png = await renderCertificate(cert);
    await editOriginal(i, {
      content: `📜 Sertifikat **${esc(cert.displayName)}** (@${esc(cert.username)})`,
      png,
      filename: `sertifikat-${cert.userId}.png`,
    });
  });
  return defer(false);
}

function verify(i, discordId) {
  const sub = (i.data.options || [])[0];
  if (!sub) return reply('Perintah tidak dikenal.');

  if (sub.name === 'mulai') {
    const username = sub.options?.find((o) => o.name === 'username')?.value?.trim();
    background(i, async () => {
      const u = await roblox.resolveUsername(username);
      if (!u) return editOriginal(i, { content: 'Username Roblox tidak ditemukan.' });

      const owner = await store.getDiscordByRoblox(u.id);
      if (owner && owner !== discordId) {
        return editOriginal(i, { content: 'Akun Roblox itu sudah terhubung ke akun Discord lain.' });
      }

      const code = 'SERTIF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      await store.setPending(discordId, { userId: u.id, username: u.name, code, expires: Date.now() + 10 * 60 * 1000 });
      await editOriginal(i, {
        content:
          `Verifikasi akun **${esc(u.name)}**:\n` +
          `1. Buka profil Roblox-mu, lalu edit bagian **About / Deskripsi**.\n` +
          `2. Tempel kode ini (boleh di mana saja): \`${code}\`\n` +
          `3. Simpan, lalu jalankan \`/verify cek\` (berlaku 10 menit).\n\n` +
          `Setelah berhasil, kode itu boleh kamu hapus.`,
      });
    });
    return defer(true);
  }

  if (sub.name === 'cek') {
    background(i, async () => {
      const p = await store.getPending(discordId);
      if (!p || Date.now() > p.expires) {
        await store.clearPending(discordId);
        return editOriginal(i, { content: 'Tidak ada verifikasi yang aktif atau sudah kedaluwarsa. Mulai lagi dengan `/verify mulai`.' });
      }
      const info = await roblox.getUser(p.userId);
      if (!String(info.description || '').includes(p.code)) {
        return editOriginal(i, { content: 'Kode belum ditemukan di profil. Pastikan sudah disimpan (kadang butuh ±1 menit), lalu coba `/verify cek` lagi.' });
      }
      await store.link(discordId, p.userId);
      await store.clearPending(discordId);
      const hasCert = !!(await store.getCert(p.userId));
      await editOriginal(i, {
        content:
          `✅ Terhubung ke **${esc(info.name)}**!` +
          (hasCert ? ' Ketik `/sertif` untuk melihat sertifikatmu.' : ` Selesaikan **${esc(GAME_NAME())}** untuk mendapat sertifikat.`),
      });
    });
    return defer(true);
  }

  return reply('Perintah tidak dikenal.');
}

export async function POST(request) {
  const raw = await request.text(); // body mentah dibutuhkan untuk cek tanda tangan
  const valid = verifyDiscordSignature(
    raw,
    request.headers.get('x-signature-ed25519'),
    request.headers.get('x-signature-timestamp'),
    process.env.DISCORD_PUBLIC_KEY,
  );
  if (!valid) return new Response('invalid request signature', { status: 401 });

  const i = JSON.parse(raw);
  if (i.type === 1) return Response.json({ type: 1 }); // PING dari Discord

  if (i.type === 2) {
    const discordId = i.member?.user?.id || i.user?.id;
    if (i.data.name === 'sertif') return sertif(i, discordId);
    if (i.data.name === 'verify') return verify(i, discordId);
  }
  return new Response('unknown interaction', { status: 400 });
}
