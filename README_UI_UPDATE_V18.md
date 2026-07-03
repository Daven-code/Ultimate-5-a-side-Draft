# UI update v18 - online room capability

Replace this file in your existing folder:

```text
C:\Users\Daven.Argile\Documents\fifa-5aside-game
```

File to replace:

- `app.js`

Do **not** replace `players.json`.

## What this adds

- Adds Firebase Realtime Database online room capability.
- Adds a styled Online room panel dynamically on the setup page.
- Create a room, share the room link, and another device can join the same room.
- The host controls the game; joined devices update live.
- Local/offline play still works if Firebase is not configured.

## Firebase setup needed

In `app.js`, replace the placeholder `FIREBASE_CONFIG` values with your Firebase web app config.
Create a Firebase Realtime Database and use appropriate rules. For early testing only, you can use temporary permissive rules, but lock them down before public sharing.
