// Panggilan REST ke Discord (tanpa library; tidak perlu bot yang online terus).
const API = 'https://discord.com/api/v10';

function pngForm(payload, png, filename) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ ...payload, attachments: [{ id: 0, filename }] }));
  form.append('files[0]', new Blob([png], { type: 'image/png' }), filename);
  return form;
}

async function check(res) {
  if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
  return res.json();
}

// kirim sertifikat ke channel (pakai token bot)
export async function sendChannelMessage(channelId, content, png, filename, allowedMentions) {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
    body: pngForm({ content, allowed_mentions: allowedMentions }, png, filename),
  });
  return check(res);
}

// isi balasan slash command yang tadi di-"defer" (pakai token interaksi, tidak butuh token bot)
export async function editOriginal(interaction, { content, png, filename }) {
  const url = `${API}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
  const allowed_mentions = { parse: [] };
  const res = png
    ? await fetch(url, { method: 'PATCH', body: pngForm({ content, allowed_mentions }, png, filename) })
    : await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, allowed_mentions }),
      });
  return check(res);
}

export async function registerCommands(commands) {
  const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN } = process.env;
  const url = GUILD_ID
    ? `${API}/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`
    : `${API}/applications/${CLIENT_ID}/commands`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bot ${DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  return check(res);
}
