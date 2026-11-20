// Definisi slash command (type 1 = CHAT_INPUT, option type 1 = SUB_COMMAND, 3 = STRING)
export const COMMANDS = [
  {
    name: 'sertif',
    type: 1,
    description: 'Tampilkan sertifikat Classic Mode',
    options: [
      {
        type: 3,
        name: 'username',
        description: 'Username Roblox (kosongkan untuk sertifikatmu sendiri)',
        required: false,
      },
    ],
  },
  {
    name: 'verify',
    type: 1,
    description: 'Hubungkan akun Discord ke akun Roblox',
    options: [
      {
        type: 1,
        name: 'mulai',
        description: 'Mulai verifikasi',
        options: [{ type: 3, name: 'username', description: 'Username Roblox kamu', required: true }],
      },
      { type: 1, name: 'cek', description: 'Cek kode di profil Roblox & selesaikan verifikasi' },
    ],
  },
];
