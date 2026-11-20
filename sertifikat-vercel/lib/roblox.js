// Helper API publik Roblox (tanpa API key).
export async function resolveUsername(username) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
  });
  if (!res.ok) throw new Error('Roblox users API ' + res.status);
  const json = await res.json();
  return json.data && json.data[0] ? json.data[0] : null; // { id, name, displayName }
}

export async function getUser(userId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
  if (!res.ok) throw new Error('Roblox users API ' + res.status);
  return res.json(); // { description, name, displayName, ... }
}
