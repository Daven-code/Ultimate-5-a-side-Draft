# Ultimate 5-a-side Draft v42 - Local bid controls fix

Based on the uploaded v39 files.

Fix:
- In LOCAL bid mode, `Award highest bid` and `Skip player` now become clickable after a player is randomised.
- `Randomise player` is disabled while a candidate is waiting to be awarded/skipped.
- After awarding or skipping, `Randomise player` becomes clickable again.
- Online blind bidding behaviour from v39 has not intentionally been changed.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
