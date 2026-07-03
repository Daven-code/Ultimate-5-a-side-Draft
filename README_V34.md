# Ultimate 5-a-side Draft v34

Based on v33. This update only changes online turn ownership.

Updates:
- Host can still create and start an online room.
- Host can no longer accept, decline, or pick players on behalf of another user.
- Only the user whose name matches the current turn can control that turn.
- If it is not your turn, buttons are disabled and the game says who it is waiting for.
- index.html references `app.js?v=34` for cache busting.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
5. Create a new online room when testing.
