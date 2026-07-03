# Ultimate 5-a-side Draft v38

Based on v37. This update changes ONLINE bid mode to blind parallel bidding.

Online bid mode changes:
- A random eligible player is shown to everyone.
- Eligible users submit their bids privately in parallel.
- Everyone can see who has submitted a bid, but not the bid value.
- Once all eligible users have submitted, all bids are revealed together.
- Highest valid bid wins the player and the winning amount is deducted from their budget.
- Tied highest bids are resolved randomly between the tied users.
- After a short reveal period, the next player is drawn automatically.
- When all teams are complete, any joined user can reveal final results.

Local bid mode is not intended to be changed by this update.

Install:
1. Replace only `index.html` and `app.js`.
2. Do not replace `styles.css` or `players.json`.
3. Commit and push.
4. Hard refresh with Ctrl+F5.
5. Create a new online room when testing.
