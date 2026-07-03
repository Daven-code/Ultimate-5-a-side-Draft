# Online mode v22

Replace only this file in your project:

```text
C:\Users\Daven.Argile\Documents\fifa-5aside-game\app.js
```

Do not replace `players.json`.

## Fixes in v22

- Fixed the problem where the host could click “Pick player” but nothing happened when it was not technically the host's turn.
- In online Draft mode, the named current player can act from their own device.
- The host can now also act as a fallback to keep the game moving.
- Improved the online turn message so it is clear who should act.
- Forced the remote game panel to display/repaint on joined devices, so the 5-a-side pitch and teams render more reliably.
- Lobby wording now makes clear that joined names are used automatically.
