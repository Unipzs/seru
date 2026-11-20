# Sertifikat Classic Mode (Vercel, tanpa server)

Roblox (dapat badge) -> POST /api/badge -> sertifikat PNG dibuat -> dikirim ke #sertifikat.
Slash command (/sertif, /verify) lewat Interactions Endpoint, bot tidak perlu online terus.

## Variabel (Vercel -> Project Settings -> Environment Variables)
DISCORD_TOKEN, DISCORD_PUBLIC_KEY, CLIENT_ID, GUILD_ID, CERT_CHANNEL_ID, API_SECRET, GAME_NAME
+ Redis: tambah "Upstash Redis" dari Vercel Marketplace (Storage), env-nya terisi otomatis.

## Setelah deploy
1. Buka  https://DOMAINMU/api/register?key=API_SECRET   (sekali saja) -> slash command terdaftar.
2. Discord Developer Portal -> General Information -> "Interactions Endpoint URL" =
   https://DOMAINMU/api/interactions   -> Save.
3. Roblox: BACKEND_URL = https://DOMAINMU/api/badge, API_SECRET sama persis.
4. Kalau ada sertifikat yang gagal terkirim: buka https://DOMAINMU/api/retry?key=API_SECRET

## Tes tanpa main game
curl -X POST https://DOMAINMU/api/badge -H "Content-Type: application/json" \
  -H "x-api-secret: SECRET_KAMU" -d '{"userId":1,"username":"Roblox","displayName":"Nama Tes"}'
