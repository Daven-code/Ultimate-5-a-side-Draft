# Ultimate 5-a-side Draft v43 - Local bid skip lives restored

Based on v42.

Local bid mode changes:
- Each eligible user now has 3 skip/zero-bid lives again.
- If an eligible user bids £0m, they lose one skip.
- If everyone eligible bids £0m, the player is skipped and every eligible user loses one skip.
- Clicking Skip player also makes every eligible user lose one skip.
- If an eligible user has used all 3 skips, they must bid above £0m; Award/Skip will show a message instead of allowing another zero/skip.
- Bid rows and team cards now show skip count.

Online blind bidding is not intentionally changed.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
