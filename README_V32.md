# Ultimate 5-a-side Draft v32

This update starts from the working v30 local version and fixes the v31 recursion bug.

Files included:
- index.html
- app.js

What changed:
- Removed the v31 delegation approach that caused `Maximum call stack size exceeded`.
- Local mode uses explicit working v30 behaviour:
  - Accept automatically moves to the next user and picks the next player.
  - Decline automatically picks another player for the same user.
- Online mode has separate explicit behaviour:
  - Accept adds the player, moves to the next user, draws the next candidate, and saves to Firebase.
  - Decline records the decline, draws another candidate for the same user, and saves to Firebase.
- index.html references `app.js?v=32` for cache busting.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with `Ctrl + F5`.
5. Test local mode first, then create a new online room for online testing.
