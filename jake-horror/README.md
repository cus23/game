# STAY WITH ME — Jake Route

A mobile-first, interactive psychological-thriller game built with plain HTML, CSS, and JavaScript. No framework, package install, API key, or paid service is required.

## Play

Open the GitHub Pages site:

https://cus23.github.io/game/jake-horror/

## Unlock sequence

1. Tap either Jake notification on the iOS-style lock screen, or swipe upward.
2. The passcode overlay appears above the lock screen.
3. Enter **1115** to unlock.
4. Start the story from the home screen.

The passcode view is implemented as a regular HTML overlay rather than the native `<dialog>` API, to keep the interaction predictable on iOS Safari and embedded mobile browsers.

## Game features

- Eight story scenes with three choices per scene.
- Trust and anxiety values affected by player choices.
- Three different ending paths.
- In-game chat with selectable replies.
- Incoming call overlay with answer and decline actions.
- Notes, clues, and relationship-state meters.
- Local progress saving through `localStorage`.
- Responsive iPhone layout and standalone web-app manifest.

## Project structure

- `index.html` — app structure and screen markup.
- `styles.css` — responsive layout, lock screen, passcode screen, chat, and call UI.
- `game.js` — story data, state, interaction handlers, save/load, and endings.
- `manifest.json` — installable web-app metadata.
- `icon.svg` — app icon.

## Run locally

Serve this folder with any static web server, or open `index.html` in a modern browser. GitHub Pages serves the same static files.

## Notes

This is a fictional fan-made work. Jake and all events/dialogue in the game are fictional and are not affiliated with or endorsed by any real person or organization.
