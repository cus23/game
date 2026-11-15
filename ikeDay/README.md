# ikeDay 🦮🐾

A minimal attendance calendar for recording whether Jake sent a Weverse DM on a given date.

## Features
- Calendar from 2026-05-08 through today.
- Each date can be marked **有來 / 沒來 / 未標記**.
- No diary text, titles, message types, source links, or extra statistics.
- Import and export encrypted JSON backups.

## Privacy and password
- The GitHub Pages site and source code are public.
- Records are encrypted in the browser with AES-GCM 256-bit; the key is derived with PBKDF2-HMAC-SHA-256.
- The fixed unlock password is not stored as plain text in the source; the client contains a derived verifier. This only makes it less obvious, not secure authentication: anyone with the public source can attempt offline password guessing.
- JSON backups are encrypted and require the same password to import.
- Data stays in this browser's localStorage unless the user exports a backup. There is no cloud sync or password recovery.
- Clearing browser/site data may remove local records.

## Hosting
https://cus23.github.io/game/ikeDay/
