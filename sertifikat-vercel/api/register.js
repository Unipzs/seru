// Buka SEKALI di browser setelah deploy:  https://DOMAINMU/api/register?key=API_SECRET_KAMU
// untuk mendaftarkan slash command ke Discord.
import { COMMANDS } from '../lib/commands.js';
import { registerCommands } from '../lib/discord.js';
import { safeEqual } from '../lib/util.js';

export async function GET(request) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!process.env.API_SECRET || !safeEqual(key, process.env.API_SECRET)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await registerCommands(COMMANDS);
    return Response.json({ ok: true, registered: result.map((c) => c.name) });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
