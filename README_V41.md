# Ultimate 5-a-side Draft v41

Based on v39, not v40. This removes the over-designed online bid page and returns to a simpler layout.

Changes:
- Online blind bid layout simplified into clear sections:
  - Player up for bid
  - Your bid / waiting message
  - Submission status
- Preserves the working v39 blind bid behaviour and unsubmitted-bid value preservation.
- Adds an online room code banner at the top of the game screen, with copy-code and copy-link buttons, so users can re-join if they leave.
- Keeps the room banner visible on the final results page as long as the online session is active.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
5. Create a new online room when testing.
