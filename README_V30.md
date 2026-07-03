# Ultimate 5-a-side Draft v30

This update uses the working v29 version as the base and only changes the local draft flow.

Files included:
- index.html
- app.js

Change included:
- After clicking **Accept**, the game automatically moves to the next user and randomises the next player.
- After clicking **Decline**, the game automatically randomises another player for the same user.
- The smoother older gameplay flow is restored.
- index.html references `app.js?v=30` for cache busting.

Install:
1. Replace only `index.html` and `app.js` in your project folder.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with `Ctrl + F5`.

Please test local mode first before testing online mode.
