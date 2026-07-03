# Ultimate 5-a-side Draft v39

Based on v38. This update fixes a blind-bid input reset bug in ONLINE bid mode.

Fix:
- If one user submits their blind bid, other users' typed-but-unsubmitted bid values no longer reset to £0 when Firebase refreshes the page state.
- The local user's draft bid is held in browser localStorage for that room/user/player until they submit or the bid is revealed.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
5. Create a new online room when testing.
