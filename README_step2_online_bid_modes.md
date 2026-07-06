# Step 2 - Online bid mode options

Updated files:
- app.js
- index.html

Changes made:
- Online bid games now let the host choose between:
  1. Blind bidding - the existing mode.
  2. Live auction - visible highest bid, users can bid more or say no/pass.
- Live auction keeps the 3-skip rule before the first bid. If a user says no before any first bid has been made, they lose one skip. Once they have used all 3 skips, they must make a first bid above £0m when eligible.
- Step 1 reset-button behaviour is preserved.

No local game logic has been changed.
