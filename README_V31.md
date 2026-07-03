# Ultimate 5-a-side Draft v31

This update uses v30 as the base and only changes the online draft flow.

Files included:
- index.html
- app.js

What changed:
- Local mode is preserved by delegating to the working v30 local Accept/Decline functions.
- In online mode, after a user accepts a player, the game moves to the next user and automatically randomises the next candidate.
- In online mode, after a user declines a player, the same user automatically gets another random candidate.
- The candidate is saved to Firebase so all joined devices see the same next player.
- index.html references `app.js?v=31` for cache busting.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with `Ctrl + F5`.
5. Create a new online room when testing.
