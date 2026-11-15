# ikeDay — Jake's DM Days

A private daybook for recording dates when Jake (Sim Jaeyun of ENHYPEN) sends Weverse DM updates.

## Privacy
- The GitHub Pages site and source code are public.
- Entries are encrypted in the browser using AES-GCM 256-bit.
- Password-derived key: PBKDF2-HMAC-SHA-256, 310,000 iterations, random salt.
- Password is never embedded in source or sent to GitHub.
- Only ciphertext is stored in this browser's localStorage.
- Export/import encrypted JSON backups to move between browsers.
- There is no password recovery. Losing the password means losing access.
- This first version does not sync between devices. Export backups regularly.
- The site itself is public; the encrypted records are what is protected.

## Verified date
2026-05-08 is the official ENHYPEN Weverse DM launch date: https://weverse.io/enhypen/notice/35462
No individual Jake message dates are pre-filled. Public repost dates can be ambiguous, so only add dates that can be verified.

## Hosting
GitHub Pages: https://cus23.github.io/game/ikeDay/
Web Crypto requires HTTPS or localhost.