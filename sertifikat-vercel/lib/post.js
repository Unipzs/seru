// Render sertifikat lalu kirim ke channel #sertifikat.
import { getDiscordByRoblox, markPosted } from './store.js';
import { sendChannelMessage } from './discord.js';
import { esc, GAME_NAME } from './util.js';

export async function postCertificate(cert) {
  const { renderCertificate } = await import('./certificate.js'); // lazy: canvas berat
  const png = await renderCertificate(cert);

  const discordId = await getDiscordByRoblox(cert.userId); // kalau sudah /verify, di-mention
  const who = discordId ? `<@${discordId}>` : `**${esc(cert.displayName)}**`;
  const msg = await sendChannelMessage(
    process.env.CERT_CHANNEL_ID,
    `🎉 Selamat ${who} (@${esc(cert.username)}) telah menyelesaikan **${esc(GAME_NAME())}**!`,
    png,
    `sertifikat-${cert.userId}.png`,
    { parse: [], users: discordId ? [discordId] : [] },
  );
  await markPosted(cert.userId, msg.id);
}
