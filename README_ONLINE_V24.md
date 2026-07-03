# Online mode v24

Replace only this file in your project:

```text
C:\Users\Daven.Argile\Documents\fifa-5aside-game\app.js
```

Do not replace `players.json`.

## Fixes in v24

- Online “Pick player” now waits for `players.json` to load before trying to draw a player.
- If players are not ready, it shows a clear message instead of silently doing nothing.
- After selecting a player online, the app waits for Firebase to save the candidate before continuing.
- Joined devices force a re-render of the team pitches after every remote game update.
- The host can still act as fallback, but named players can control their own turn.
