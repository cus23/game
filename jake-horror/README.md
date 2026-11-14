# AFTERIMAGE — Jake's Phone

A mobile-first psychological horror game presented as a simulated iPhone. The phone interface is the game: unlock it, explore the installed apps, inspect evidence, and message the characters.

## Play

https://cus23.github.io/game/jake-horror/

## Unlock

- Tap either lock-screen notification or swipe upward.
- Enter **1115**.
- The game opens to the iPhone-style home screen.

## Explore the phone

- **訊息** — switch between Jake and Mina, send your own text, and receive context-aware scripted replies.
- **電話** — inspect recent calls and play Jake's voicemail.
- **照片** — inspect images and their suspicious metadata.
- **備忘錄** — uncover a note you do not remember writing.
- **Safari** — search fictional web results for clues.
- **尋找** — inspect the location-sharing map and device details.
- **檔案** — review the current objective, collected evidence, and ending.
- **語音備忘錄** — play a suspicious recording and read its transcript.
- **相機** — take a photo, switch cameras, or record a short simulated clip.
- **設定** — save or reset the game.

## Story and saves

The story advances through actions inside the phone. Clues, chat history, choices, trust/fear values, and the current chapter are saved automatically in the browser's localStorage. Returning to the page on the same browser resumes from the saved game. The Settings app also has a manual save and reset option.

The chat is an offline, rule-based simulation with free-text input and contextual scripted responses. It does not call an external AI service or require an API key. Responses are authored game dialogue, not a live AI model.

## Project structure

- index.html — lock screen, home screen, and app containers.
- styles.css — full-screen iPhone UI and app styling.
- game.js — story progression, app interactions, simulated chat, calls, evidence, endings, and local saves.
- manifest.json / icon.svg — web-app metadata and icon.

No build step, package installation, server-side database, or paid service is required. GitHub Pages hosts the static game.

This is a fictional fan-made work. Characters and events are fictional and are not affiliated with or endorsed by any real person.
