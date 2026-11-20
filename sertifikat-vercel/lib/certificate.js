// Bikin gambar sertifikat (PNG). Nama = DisplayName pemain.
// Modul ini berat (canvas native), jadi hanya di-import saat benar-benar mau render.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

const here = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = [path.join(here, '..', 'fonts'), path.join(process.cwd(), 'fonts')]
  .find((d) => fs.existsSync(d));

// Ganti file di folder fonts/ (Title.ttf, Body.ttf, BodyItalic.ttf) kalau mau font lain.
function register(file, alias) {
  if (FONT_DIR) {
    const p = path.join(FONT_DIR, file);
    if (fs.existsSync(p)) {
      GlobalFonts.registerFromPath(p, alias);
      return alias;
    }
  }
  return 'sans-serif';
}
const TITLE = register('Title.ttf', 'CertTitle');
const BODY = register('Body.ttf', 'CertBody');
const BODY_ITALIC = register('BodyItalic.ttf', 'CertBodyItalic');

const W = 1754;
const H = 1240;
const GOLD = '#b8892b';
const INK = '#2b2417';

// buang emoji / karakter yang tidak bisa dirender font; kalau kosong pakai username
export function cleanName(displayName, username) {
  const cleaned = String(displayName)
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u200B-\u200F\u202A-\u202E]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return cleaned || username;
}

function fitFont(ctx, text, family, startSize, maxWidth) {
  let size = startSize;
  do {
    ctx.font = `${size}px "${family}"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  } while (size > 28);
  return size;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
}

function diamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

export async function renderCertificate(cert) {
  const gameName = process.env.GAME_NAME || 'Classic Mode';
  const name = cleanName(cert.displayName, cert.username);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fffaf0');
  bg.addColorStop(1, '#f3e8cc');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 3;
  ctx.strokeRect(70, 70, W - 140, H - 140);

  ctx.fillStyle = GOLD;
  for (const [x, y] of [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]]) diamond(ctx, x, y, 22);

  ctx.fillStyle = GOLD;
  ctx.font = `104px "${TITLE}"`;
  ctx.fillText('SERTIFIKAT', W / 2, 290);
  ctx.fillStyle = INK;
  ctx.font = `36px "${BODY}"`;
  ctx.fillText('P E N Y E L E S A I A N', W / 2, 355);

  ctx.fillStyle = GOLD;
  ctx.fillRect(W / 2 - 160, 395, 320, 4);
  diamond(ctx, W / 2, 397, 11);

  ctx.fillStyle = INK;
  ctx.font = `38px "${BODY_ITALIC}"`;
  ctx.fillText('Dengan bangga diberikan kepada', W / 2, 500);

  // NAMA (DisplayName)
  ctx.fillStyle = INK;
  fitFont(ctx, name, TITLE, 130, W - 360);
  ctx.fillText(name, W / 2, 680);
  const nameWidth = Math.min(ctx.measureText(name).width + 80, W - 300);
  ctx.fillStyle = GOLD;
  ctx.fillRect(W / 2 - nameWidth / 2, 720, nameWidth, 4);

  ctx.fillStyle = '#6b5d3f';
  ctx.font = `32px "${BODY}"`;
  ctx.fillText(`@${cert.username}`, W / 2, 775);

  ctx.fillStyle = INK;
  ctx.font = `40px "${BODY}"`;
  ctx.fillText('atas keberhasilannya menyelesaikan', W / 2, 870);
  fitFont(ctx, gameName, TITLE, 64, W - 400);
  ctx.fillStyle = GOLD;
  ctx.fillText(gameName, W / 2, 950);

  const footY = 1075;
  ctx.fillStyle = INK;
  ctx.font = `28px "${BODY}"`;

  ctx.fillRect(230, footY - 45, 360, 2);
  ctx.fillText(formatDate(cert.issuedAt), 410, footY);

  ctx.fillRect(W / 2 - 180, footY - 45, 360, 2);
  ctx.fillText(`Tim ${gameName}`, W / 2, footY);

  ctx.fillRect(W - 590, footY - 45, 360, 2);
  ctx.fillText(`No. ${String(cert.number).padStart(4, '0')}`, W - 410, footY);

  return canvas.toBuffer('image/png');
}
