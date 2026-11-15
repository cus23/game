# ikeDay 🦮🐾

A minimal calendar for marking dates when Jake sent a Weverse DM.

## Features
- Preloaded attendance dates from May to October 2026 (69 dates supplied by the user).
- Only positive attendance is marked with 🐾; unmarked dates stay blank.
- A live 2026 monthly bar chart counts marked days.
- Import and export encrypted JSON backups.
- The SVG dog-and-paw icon is used as the browser favicon.

## Privacy
- GitHub Pages and source code are public.
- Records are encrypted locally using AES-GCM 256-bit and PBKDF2-HMAC-SHA-256.
- The password is not stored as plain text in source code. The supplied initial attendance dates are also encrypted in the source and merged into the local encrypted data on first unlock.
- JSON backups are encrypted and require the same password.
- Data stays in this browser's localStorage unless exported. There is no cloud sync or password recovery.

## Hosting
https://cus23.github.io/game/ikeDay/
