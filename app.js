// ============================================================
// Ultimate 5-a-side main application
// Clean rebuild: duplicate legacy function patches removed, grouped sections added, behaviour retained.
// ============================================================

// ----- Game constants and Firebase configuration -----
const DECLINES_ALLOWED = 3;
const AUCTION_BUDGET = 100;
const BID_SKIPS_ALLOWED = 3;
const TEAM_SHAPE = ["GK", "DEF", "MID", "MID", "FWD"];

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAcqef5WtEuICYihdza6l_gcad7UUjIjS0",
  authDomain: "ultimate-5-a-side-draft.firebaseapp.com",
  databaseURL: "https://ultimate-5-a-side-draft-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ultimate-5-a-side-draft",
  storageBucket: "ultimate-5-a-side-draft.firebasestorage.app",
  messagingSenderId: "947937131392",
  appId: "1:947937131392:web:c2a228b6697cf397439f65",
  measurementId: "G-22516PSZD7"
};


// ----- Shared runtime state -----
let players = [];
let playersPromise = null;
let selectedGameMode = "draft";
let state = null;
let currentCandidate = null;
let ratingsRevealed = false;
let applyingRemote = false;

const online = {
  enabled: false,
  isHost: false,
  roomId: null,
  ref: null,
  myName: "",
  loaded: false,
  subscribed: false
};


// ----- Emergency fallback players if players.json cannot be loaded -----
const samplePlayers = [
  {
    Player: "Lionel Messi",
    Game_Year: 2012,
    Rating_OVR: 94,
    Position: "CF",
    Main_Position: "FWD",
    Club: "FC Barcelona",
    Nation: "Argentina"
  },
  {
    Player: "Cristiano Ronaldo",
    Game_Year: 2012,
    Rating_OVR: 92,
    Position: "LW",
    Main_Position: "FWD",
    Club: "Real Madrid",
    Nation: "Portugal"
  },
  {
    Player: "Gianluigi Buffon",
    Game_Year: 2005,
    Rating_OVR: 97,
    Position: "GK",
    Main_Position: "GK",
    Club: "Juventus",
    Nation: "Italy"
  },
  {
    Player: "Sergio Ramos",
    Game_Year: 2015,
    Rating_OVR: 87,
    Position: "CB",
    Main_Position: "DEF",
    Club: "Real Madrid",
    Nation: "Spain"
  },
  {
    Player: "Xavi",
    Game_Year: 2012,
    Rating_OVR: 92,
    Position: "CM",
    Main_Position: "MID",
    Club: "FC Barcelona",
    Nation: "Spain"
  },
  {
    Player: "Kevin De Bruyne",
    Game_Year: 2021,
    Rating_OVR: 91,
    Position: "CM",
    Main_Position: "MID",
    Club: "Manchester City",
    Nation: "Belgium"
  },
  {
    Player: "Thierry Henry",
    Game_Year: 2005,
    Rating_OVR: 97,
    Position: "ST",
    Main_Position: "FWD",
    Club: "Arsenal",
    Nation: "France"
  }
];


// ----- DOM helpers and fixed page element lookups -----
const $ = id => document.getElementById(id);

const els = {
  setupPanel: $("setupPanel"),
  gamePanel: $("gamePanel"),
  resultsPanel: $("resultsPanel"),
  gameModeCards: $("gameModeCards"),
  gameModeDescription: $("gameModeDescription"),
  userCount: $("userCount"),
  userNameFields: $("userNameFields"),
  excludeDeclines: $("excludeDeclines"),
  excludeDeclinesLabel: $("excludeDeclinesLabel"),
  startBtn: $("startBtn"),
  resetBtn: $("resetBtn"),
  pickBtn: $("pickBtn"),
  acceptBtn: $("acceptBtn"),
  declineBtn: $("declineBtn"),
  revealBtn: $("revealBtn"),
  shareSummaryBtn: $("shareSummaryBtn"),
  saveSummaryBtn: $("saveSummaryBtn"),
  draftControls: $("draftControls"),
  bidControls: $("bidControls"),
  bidPickBtn: $("bidPickBtn"),
  awardBidBtn: $("awardBidBtn"),
  skipBidBtn: $("skipBidBtn"),
  bidInputs: $("bidInputs"),
  bidOrderDisplay: $("bidOrderDisplay"),
  turnEyebrow: $("turnEyebrow"),
  currentUserLabel: $("currentUserLabel"),
  declinesPill: $("declinesPill"),
  declinesLeft: $("declinesLeft"),
  budgetPill: $("budgetPill"),
  currentBudgetLeft: $("currentBudgetLeft"),
  candidateCard: $("candidateCard"),
  message: $("message"),
  teamsContainer: $("teamsContainer"),
  resultsContainer: $("resultsContainer"),
  loadStatus: $("loadStatus")
};

// Wraps event handlers so errors show as on-page messages rather than breaking the app.
function safe(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(err);
      setMessage(err?.message || String(err));
    }
  };
}

// Updates the main status/message area.
function setMessage(text) {
  if (els.message) {
    els.message.textContent = text || "";
  }
}

// Escapes text before inserting it into HTML templates.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[ch]));
}

// Creates Firebase-safe keys from player/user names.
function safeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.#$\/[\]]/g, "_");
}

// Converts detailed positions into GK/DEF/MID/FWD buckets.
function normalisePosition(pos, rawPosition = "") {
  const p = String(pos || rawPosition || "").toUpperCase();

  if (p.includes("GK")) return "GK";

  if (["CB", "LB", "RB", "LWB", "RWB", "DEF"].some(x => p.includes(x))) {
    return "DEF";
  }

  if (["CM", "CDM", "CAM", "LM", "RM", "MID"].some(x => p.includes(x))) {
    return "MID";
  }

  return "FWD";
}

// Converts raw JSON rows into the compact player shape used by the game.
function normalisePlayers(data) {
  const rows = Array.isArray(data) ? data : [];

  return rows.map((p, idx) => {
    const position = p.Position ?? p.position ?? p.POS ?? p.pos ?? "";
    const main = p.Main_Position ?? p.mainPosition ?? p.MainPosition ?? p.main_position ?? "";

    return {
      id: idx + 1,
      player: String(p.Player ?? p.player ?? p.Name ?? p.name ?? "").trim(),
      year: Number(p.Game_Year ?? p.year ?? p.Year ?? p.gameYear ?? 0),
      rating: Number(p.Rating_OVR ?? p.rating ?? p.OVR ?? p.ovr ?? p.Rating ?? 0),
      position: String(position || main || "").trim(),
      mainPosition: normalisePosition(main, position),
      club: String(p.Club ?? p.club ?? "").trim(),
      nation: String(p.Nation ?? p.nation ?? "").trim()
    };
  }).filter(p => p.player && p.rating > 0 && TEAM_SHAPE.includes(p.mainPosition));
}

// Loads the main player pool and falls back to sample data if needed.
async function loadPlayers() {
  if (playersPromise) return playersPromise;

  playersPromise = (async () => {
    try {
      const response = await fetch("players.json", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Could not load players.json - HTTP ${response.status}`);
      }

      players = normalisePlayers(await response.json());

      if (!players.length) {
        throw new Error("players.json loaded but no valid players were found.");
      }

      if (els.loadStatus) {
        els.loadStatus.style.display = "none";
      }
    } catch (err) {
      console.warn(err);
      players = normalisePlayers(samplePlayers);

      if (els.loadStatus) {
        els.loadStatus.textContent = "Using fallback sample players. Check players.json if this appears online.";
        els.loadStatus.style.display = "block";
      }
    }

    console.log(`Loaded ${players.length} players`);
    return players;
  })();

  return playersPromise;
}

// Ensures a player pool is available before starting actions.
async function ensurePlayersReady() {
  await loadPlayers();
  return Array.isArray(players) && players.length > 0;
}

// Adds dynamic styles used by online/local entry screens.
function injectStyles() {
  if ($("onlineLocalStyles")) return;

  const style = document.createElement("style");
  style.id = "onlineLocalStyles";
  style.textContent = `
    .game-entry-panel {
      max-width: 980px;
      margin: 28px auto;
    }

    .game-entry-heading {
      text-align: center;
      margin-bottom: 18px;
    }

    .game-entry-heading h2 {
      margin: 0 0 6px;
      color: #fff;
      font-size: clamp(1.8rem, 4vw, 2.8rem);
    }

    .game-entry-heading p {
      margin: 0;
      color: rgba(255,255,255,.82);
      font-weight: 800;
    }

    .game-entry-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .entry-card {
      background: rgba(255,255,255,.95);
      border: 1px solid rgba(255,255,255,.4);
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 24px 70px rgba(15,23,42,.22);
    }

    .entry-card h3 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 1.35rem;
    }

    .entry-card p {
      margin: 0 0 14px;
      color: #475569;
      font-weight: 750;
      line-height: 1.4;
    }

    .local-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 265px;
    }

    .online-room-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 14px;
      display: grid;
      gap: 10px;
    }

    .online-room-actions {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
    }

    .online-room-status {
      margin: 2px 0 0;
      color: #475569;
      font-weight: 800;
      font-size: .88rem;
      line-height: 1.35;
    }

    .online-room-link {
      margin: 0;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
      border-radius: 12px;
      padding: 9px 10px;
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    .lobby-card {
      max-width: 820px;
      margin: 42px auto;
      text-align: center;
    }

    .lobby-code {
      display: inline-block;
      margin: 10px 0;
      padding: 10px 16px;
      background: #0f172a;
      color: #fff;
      border-radius: 14px;
      font-size: 1.4rem;
      letter-spacing: .12em;
      font-weight: 950;
    }

    .lobby-link {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 14px;
      padding: 12px;
      overflow-wrap: anywhere;
      color: #1e3a8a;
      font-weight: 850;
    }

    .joined-list {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 0;
    }

    .joined-pill {
      background: #dcfce7;
      color: #166534;
      border-radius: 999px;
      padding: 7px 11px;
      font-weight: 900;
    }

    .lobby-setup {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      background: #f8fafc;
      text-align: left;
    }

    .lobby-mode-cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .lobby-mode-card {
      border: 2px solid #e2e8f0;
      background: #fff;
      border-radius: 16px;
      padding: 12px;
      text-align: left;
      cursor: pointer;
      font-weight: 900;
      color: #0f172a;
    }

    .lobby-mode-card span {
      display: block;
      margin-top: 4px;
      color: #64748b;
      font-size: .82rem;
      font-weight: 750;
      line-height: 1.25;
    }

    .lobby-mode-card.selected {
      border-color: #22c55e;
      background: #f0fdf4;
      box-shadow: 0 10px 24px rgba(34,197,94,.12);
    }

    .lobby-checkbox {
      display: flex;
      gap: 8px;
      align-items: center;
      color: #334155;
      font-weight: 850;
      margin: 10px 0 14px;
    }

    .turn-lock-note {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #9a3412;
      border-radius: 14px;
      padding: 10px;
      font-weight: 900;
      margin-top: 10px;
    }

    @media (max-width: 720px) {
      .game-entry-grid,
      .online-room-actions,
      .lobby-mode-cards {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

// Shows or hides a panel using the hidden class.
function show(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

function hideEntryPanel() {
  show($("gameEntryPanel"), false);
}

// Builds the home entry screen for online, local and challenge modes.
function injectEntryPanel() {
  injectStyles();

  if ($("gameEntryPanel")) return;

  const shell = document.querySelector(".app-shell") || document.body;

  const entry = document.createElement("section");
  entry.id = "gameEntryPanel";
  entry.className = "game-entry-panel";

  entry.innerHTML = `
    <div class="game-entry-heading">
      <h2>Choose Game Mode</h2>
      <p>Start a quick local game, or create/join an online room with friends.</p>
    </div>

    <div class="game-entry-grid">
      <article class="entry-card online-card">
        <h3>Online Game</h3>
        <p>Create a room and share the link, or join using a room code.</p>

        <div class="online-room-box">
          <div class="online-room-actions">
            <input id="onlineRoomName" type="text" placeholder="Your name" />
            <button id="createOnlineRoomBtn" type="button" class="btn btn-secondary">Create online room</button>
          </div>

          <div class="online-room-actions">
            <input id="joinRoomCode" type="text" placeholder="Room code" />
            <button id="joinOnlineRoomBtn" type="button" class="btn btn-secondary">Join room</button>
          </div>

          <p id="onlineRoomStatus" class="online-room-status">Online games use joined player names automatically.</p>
          <p id="onlineRoomLink" class="online-room-link hidden"></p>
        </div>
      </article>

      <article class="entry-card local-card">
        <div>
          <h3>Local game</h3>
          <p>Play on this device using the normal local setup options.</p>
        </div>

        <button id="startLocalGameBtn" type="button" class="btn btn-primary">Set up local game</button>
      </article>
    </div>


    <div class="popular-challenges-v2">
      <h3>🔥 Popular Challenges</h3>
      <div class="challenge-grid-v2">

        <button class="challenge-card-v2 active-challenge" data-challenge="ultimate">
          <span class="challenge-badge">LIVE</span>
          <h4>⭐ Ultimate Solo Mode</h4>
          <p>Full player database. No year filters. No league filters.</p>
          <span class="challenge-action">Play Now →</span>
        </button>

        <button class="challenge-card-v2 active-challenge" data-challenge="easy">
          <span class="challenge-badge">LIVE</span>
          <h4>🎯 Easy Solo Challenge</h4>
          <p>Top players only. Keep year selection but use a simplified player pool.</p>
          <span class="challenge-action">Play Now →</span>
        </button>

        <div class="challenge-card-v2 coming-soon">
          <span class="challenge-badge coming">COMING SOON</span>
          <h4>📅 Monthly Challenges</h4>
          <p>July 2026: World Cup 2026</p>
          <small>Future archive: August, September, October...</small>
        </div>


      </div>
    </div>


    <div class="landing-how-play-inline">
      <h3>⚽ How to Play</h3>
      <div class="landing-how-inline-row">
        <div class="inline-step"><span>🎮</span><strong>Choose Mode</strong><small>Solo Challenge or Online Play</small></div>
        <div class="inline-arrow">→</div>
        <div class="inline-step"><span>👤</span><strong>Pick Players</strong><small>Accept, decline or bid</small></div>
        <div class="inline-arrow">→</div>
        <div class="inline-step"><span>⚽</span><strong>Build Team</strong><small>Fill all 5 positions</small></div>
        <div class="inline-arrow">→</div>
        <div class="inline-step"><span>🏆</span><strong>Reveal Ratings</strong><small>Highest score wins</small></div>
      </div>
    </div>


  `;

  shell.insertBefore(entry, els.setupPanel || shell.firstChild);

  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, false);

  $("createOnlineRoomBtn")?.addEventListener("click", safe(createOnlineRoom));

  $("joinOnlineRoomBtn")?.addEventListener("click", safe(() => {
    const code = $("joinRoomCode")?.value.trim().toUpperCase();
    return joinOnlineRoom(code);
  }));

  $("startLocalGameBtn")?.addEventListener("click", () => {
    online.enabled = false;
    hideEntryPanel();
    show(els.setupPanel, true);
    updateSetupForMode();
  });

  const params = new URLSearchParams(location.search);
  const room = params.get("room");

  if (room) {
    if ($("joinRoomCode")) {
      $("joinRoomCode").value = room.toUpperCase();
    }

    setOnlineStatus(`Room code detected: ${room.toUpperCase()}. Type your player name, then click Join room.`);
  }
}

function setOnlineStatus(text) {
  const el = $("onlineRoomStatus");

  if (el) {
    el.textContent = text;
  }
}

function setOnlineLink(text) {
  const el = $("onlineRoomLink");

  if (!el) return;

  el.textContent = text || "";
  el.classList.toggle("hidden", !text);
}

function firebaseConfigured() {
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL);
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));

    document.head.appendChild(script);
  });
}

// Loads Firebase scripts and initialises the realtime database.
async function ensureFirebase() {
  if (!firebaseConfigured()) {
    throw new Error("Firebase is not configured.");
  }

  if (online.loaded) return;

  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js");

  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  online.loaded = true;
}

function randomRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}


function validateUsername(name) {
  name = (name || "").trim();
  if (name.length < 3 || name.length > 18) return false;
  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) return false;
  const blocked = ["admin","administrator","moderator","support","official"];
  return !blocked.includes(name.toLowerCase());
}

async function submitLeaderboardScore(username, score, gameMode) {
  if (!validateUsername(username)) {
    throw new Error("Invalid username");
  }
  await ensureFirebase();
  await firebase.database().ref("leaderboard").push({
    username,
    score,
    gameMode,
    timestamp: Date.now()
  });
}

// Creates a hosted online room in Firebase.
async function createOnlineRoom() {
  const name = $("onlineRoomName")?.value.trim();

  if (!name) {
    throw new Error("Type your name first.");
  }

  await ensurePlayersReady();
  await ensureFirebase();

  online.enabled = true;
  online.isHost = true;
  online.myName = name;
  online.roomId = randomRoomId();
  online.subscribed = false;
  online.ref = firebase.database().ref(`rooms/${online.roomId}`);

  const invite = `${location.origin}${location.pathname}?room=${online.roomId}`;

  await online.ref.set({
    createdAt: Date.now(),
    participants: {
      [safeKey(name)]: name
    },
    state: null,
    currentCandidate: null,
    ratingsRevealed: false,
    message: "Room created. Waiting for players."
  });

  subscribeToRoom();

  setOnlineStatus(`Room created: ${online.roomId}`);
  setOnlineLink(`Share this link: ${invite}`);

  showLobby("host", [name], invite);
}

// Joins an existing online room and registers the participant.
async function joinOnlineRoom(code) {
  const name = $("onlineRoomName")?.value.trim();

  if (!name) {
    throw new Error("Type your player name first.");
  }

  if (!code) {
    throw new Error("Enter a room code first.");
  }

  await ensurePlayersReady();
  await ensureFirebase();

  online.enabled = true;
  online.isHost = false;
  online.myName = name;
  online.roomId = code;
  online.subscribed = false;
  online.ref = firebase.database().ref(`rooms/${online.roomId}`);

  await online.ref.child(`participants/${safeKey(name)}`).set(name);

  subscribeToRoom();

  showLobby("player", [name], "");
}

// Listens for room changes and applies remote state.
function subscribeToRoom() {
  if (!online.ref || online.subscribed) return;

  online.subscribed = true;

  online.ref.on("value", snapshot => {
    if (applyingRemote) return;

    const data = snapshot.val();

    if (!data) return;

    const participants = Object.values(data.participants || {});

    if (!data.state) {
      showLobby(
        online.isHost ? "host" : "player",
        participants,
        `${location.origin}${location.pathname}?room=${online.roomId}`
      );

      return;
    }

    applyRemoteData(data);
  });
}

function ensureLobby() {
  let lobby = $("onlineLobbyPanel");

  if (lobby) return lobby;

  const shell = document.querySelector(".app-shell") || document.body;

  lobby = document.createElement("section");
  lobby.id = "onlineLobbyPanel";
  lobby.className = "card lobby-card hidden";

  shell.insertBefore(lobby, els.gamePanel || shell.firstChild);

  return lobby;
}

// Renders the online waiting room for host or player.
function showLobby(mode, participants = [], invite = "") {
  injectStyles();
  hideEntryPanel();

  const lobby = ensureLobby();

  const joined = participants.length
    ? participants
    : online.myName
      ? [online.myName]
      : [];

  if (mode === "host") {
    lobby.innerHTML = `
      <p class="eyebrow">Online room created</p>
      <h2>Waiting for players to join</h2>
      <p class="muted">Joined players appear below. When everyone is in, choose the game and start.</p>

      <div class="lobby-code">${escapeHtml(online.roomId)}</div>
      <p class="lobby-link">${escapeHtml(invite)}</p>

      <button id="copyInviteBtn" class="btn btn-secondary" type="button">Copy invite link</button>

      <div class="joined-list">
        ${joined.map(n => `<span class="joined-pill">${escapeHtml(n)}</span>`).join("")}
      </div>

      <div class="lobby-setup">
        <p class="lobby-setup-title"><strong>Start online game</strong></p>

        <div id="lobbyModeCards" class="lobby-mode-cards">
          <button type="button" class="lobby-mode-card ${selectedGameMode === "draft" ? "selected" : ""}" data-mode="draft">
            Ultimate Draft 5-a-side
            <span>Players control their own turns. Host can step in.</span>
          </button>

          <button type="button" class="lobby-mode-card ${selectedGameMode === "bid" ? "selected" : ""}" data-mode="bid">
            Bid for your Ultimate 5-a-side Team
            <span>Host-assisted. All devices update live.</span>
          </button>
        </div>

        <label id="lobbyExcludeDeclinesLabel" class="lobby-checkbox ${selectedGameMode === "bid" ? "hidden" : ""}">
          <input id="lobbyExcludeDeclines" type="checkbox" checked />
          Exclude declined players
        </label>

        <button id="startOnlineGameBtn" class="btn btn-primary" type="button">Start online game</button>
      </div>
    `;

    $("copyInviteBtn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(invite);
    });

    $("lobbyModeCards")?.addEventListener("click", event => {
      const card = event.target.closest(".lobby-mode-card");

      if (!card) return;

      selectedGameMode = card.dataset.mode;

      showLobby("host", joined, invite);
    });

    $("startOnlineGameBtn")?.addEventListener("click", safe(startOnlineGameFromLobby));
  } else {
    lobby.innerHTML = `
      <p class="eyebrow">Online room joined</p>
      <h2>Waiting for the host</h2>
      <p class="muted">You joined as <strong>${escapeHtml(online.myName)}</strong>. Keep this page open.</p>

      <div class="lobby-code">${escapeHtml(online.roomId)}</div>

      <div class="joined-list">
        ${joined.map(n => `<span class="joined-pill">${escapeHtml(n)}</span>`).join("")}
      </div>
    `;
  }

  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, false);
  show(lobby, true);
}

function participantNamesFromObject(obj) {
  const unique = [];

  Object.values(obj || {}).forEach(name => {
    const clean = String(name || "").trim();

    if (clean && !unique.some(existing => safeKey(existing) === safeKey(clean))) {
      unique.push(clean);
    }
  });

  return unique;
}


// Writes the current game state to Firebase.
async function saveOnlineState(messageOverride = null) {
  if (!online.enabled || !online.ref || applyingRemote) return;

  await online.ref.update({
    updatedAt: Date.now(),
    state: serialiseState(),
    currentCandidate,
    ratingsRevealed,
    message: messageOverride ?? els.message?.textContent ?? ""
  });
}


// Refreshes local setup controls when the game type changes.
function updateSetupForMode() {
  if (!els.userCount || !els.userNameFields) return;

  document.querySelectorAll(".game-mode-card").forEach(card => {
    card.classList.toggle("selected", card.dataset.mode === selectedGameMode);
  });

  els.userCount.innerHTML = "";

  const minUsers = selectedGameMode === "bid" ? 2 : 1;

  for (let i = minUsers; i <= 4; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i} user${i > 1 ? "s" : ""}`;
    els.userCount.appendChild(opt);
  }

  if (els.gameModeDescription) {
    els.gameModeDescription.textContent = selectedGameMode === "bid"
      ? "Each user starts with £100m. Bid for random players and complete a GK, DEF, MID, MID and FWD."
      : "Classic draft mode. Accept or decline random players to complete your team.";
  }

  if (els.excludeDeclinesLabel) {
    els.excludeDeclinesLabel.classList.toggle("hidden", selectedGameMode === "bid");
  }

  renderUserNameInputs();
}

function renderUserNameInputs() {
  const count = Number(els.userCount?.value || 1);

  if (!els.userNameFields) return;

  els.userNameFields.innerHTML = Array.from({ length: count }, (_, i) => `
    <div>
      <label for="userName${i}">User ${i + 1} name</label>
      <input id="userName${i}" type="text" value="User ${i + 1}" placeholder="User ${i + 1}" />
    </div>
  `).join("");
}

function getLocalUserNames() {
  const count = Number(els.userCount?.value || 1);

  return Array.from({ length: count }, (_, i) => {
    return $(`userName${i}`)?.value.trim() || `User ${i + 1}`;
  });
}

// Starts a local game after players are loaded.
async function startGame() {
  await ensurePlayersReady();

  online.enabled = false;

  startNewGame(selectedGameMode, getLocalUserNames(), false);
}

// Creates a fresh game state for draft or bidding modes.
function startNewGame(gameMode, names, isOnlineGame) {
  ratingsRevealed = false;
  currentCandidate = null;

  state = {
    gameMode,
    userCount: names.length,
    currentUserIndex: 0,
    excludeDeclines: gameMode === "draft" && (
      isOnlineGame
        ? !!$("lobbyExcludeDeclines")?.checked
        : !!els.excludeDeclines?.checked
    ),
    users: names.map(name => ({
      name,
      team: [],
      declines: 0,
      declinedNames: new Set(),
      budget: AUCTION_BUDGET,
      spent: 0,
      bidSkips: 0
    })),
    acceptedPlayerNames: new Set(),
    history: [],
    bidOrder: [],
    bidRoundIndex: 0
  };

  if (gameMode === "draft") {
    state.users = shuffleArray(state.users);
    state.currentUserIndex = 0;
  } else {
    state.bidOrder = shuffleArray([...Array(names.length).keys()]);
    state.currentUserIndex = state.bidOrder[0];
  }

  hideEntryPanel();

  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, true);
  show(els.resultsPanel, false);

  if (els.revealBtn) {
    els.revealBtn.classList.add("hidden");
  }

  updateGameControls();

  clearCandidate(gameMode === "bid"
    ? "Click Randomise player to start the auction."
    : "Click Pick player to begin.");

  render();
}


function shuffleArray(array) {
  const a = [...array];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function currentUser() {
  return state?.users?.[state.currentUserIndex];
}


function moveToNextUser() {
  if (!state || !Array.isArray(state.users)) return;

  for (let offset = 1; offset <= state.userCount; offset++) {
    const next = (state.currentUserIndex + offset) % state.userCount;

    if (getNeededPositions(state.users[next]).length) {
      state.currentUserIndex = next;
      return;
    }
  }
}


function updateGameControls() {
  if (!state) return;

  const isBid = state.gameMode === "bid";

  if (els.turnEyebrow) {
    els.turnEyebrow.textContent = isBid ? "Current nominator" : "Current turn";
  }

  show(els.draftControls, !isBid);
  show(els.bidControls, isBid);
  show(els.declinesPill, !isBid);
  show(els.budgetPill, isBid);
}


function clearCandidate(text) {
  if (!els.candidateCard) return;

  els.candidateCard.classList.add("blank");
  els.candidateCard.innerHTML = `<p class="muted">${escapeHtml(text)}</p>`;

  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
}

function renderCandidate(p) {
  if (!els.candidateCard) return;

  els.candidateCard.classList.remove("blank");

  els.candidateCard.innerHTML = `
    <p class="eyebrow">Random candidate</p>
    <h3 class="player-name">${escapeHtml(p.player)}</h3>

    <div class="badge-row">
      <span class="badge dark">${p.mainPosition}</span>
      <span class="badge">${escapeHtml(p.position)}</span>
      <span class="badge">${p.year || ""}</span>
    </div>

    <div class="detail-grid">
      <div class="detail">
        <span>Club</span>
        ${escapeHtml(p.club)}
      </div>
      <div class="detail">
        <span>Nation</span>
        ${escapeHtml(p.nation)}
      </div>
    </div>
  `;
}


function shortenName(name, max = 22) {
  if (!name || name.length <= max) return name || "";

  const parts = name.split(" ");

  if (parts.length > 1) {
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`.slice(0, max);
  }

  return name.slice(0, max - 1) + "…";
}

function shortenClub(club) {
  const map = {
    "Manchester City": "Man City",
    "Manchester United": "Man United",
    "FC Barcelona": "Barcelona",
    "Paris Saint-Germain": "PSG",
    "Tottenham Hotspur": "Spurs",
    "Bayern München": "Bayern",
    "Bayern Munich": "Bayern"
  };

  const out = map[club] || club || "";

  return out.length > 18 ? out.slice(0, 17) + "…" : out;
}

function renderPitchPlayer(slot, cls) {
  if (!slot.player) {
    return `
      <div class="pitch-player ${cls} empty-slot">
        <span class="pos">${slot.label}</span>
        <span class="name">Empty</span>
      </div>
    `;
  }

  const p = slot.player;

  const rating = ratingsRevealed
    ? `<span class="rating">OVR ${p.rating}</span>`
    : "";

  const price = p.price
    ? `<span class="price">£${p.price}m</span>`
    : "";

  return `
    <div class="pitch-player ${cls}">
      <span class="pos">${slot.label}</span>
      <span class="name">${escapeHtml(shortenName(p.player))}</span>
      <span class="club">${escapeHtml(shortenClub(p.club))}</span>
      <span class="year">${p.year || ""}</span>
      ${rating}
      ${price}
    </div>
  `;
}

function renderPitch(slots) {
  const classMap = ["gk", "def", "mid1", "mid2", "fwd"];

  return `
    <div class="pitch" aria-label="5-a-side pitch">
      <div class="penalty-box top"></div>
      <div class="penalty-box bottom"></div>
      ${slots.map((slot, i) => renderPitchPlayer(slot, classMap[i])).join("")}
    </div>
  `;
}


// Basic host-assisted bid mode retained.


function getBid(index) {
  const input = $(`bidUser${index}`);
  return Number(input?.value || 0);
}


function rotateBidNominator() {
  if (!state?.bidOrder?.length) return;

  for (let i = 0; i < state.userCount; i++) {
    state.bidRoundIndex = (state.bidRoundIndex + 1) % state.userCount;

    const ix = state.bidOrder[state.bidRoundIndex];

    if (getNeededPositions(state.users[ix]).length) {
      state.currentUserIndex = ix;
      return;
    }
  }
}


async function saveSummaryImage() {
  if (!state || !ratingsRevealed) {
    alert("Reveal the scores first.");
    return;
  }

  const link = document.createElement("a");
  link.download = "5-a-side-results.png";
  link.href = createSummaryCanvas().toDataURL("image/png");
  link.click();
}

async function shareSummaryImage() {
  if (!state || !ratingsRevealed) {
    alert("Reveal the scores first.");
    return;
  }

  const canvas = createSummaryCanvas();

  const blob = await new Promise(resolve => {
    canvas.toBlob(resolve, "image/png", 0.95);
  });

  const file = new File([blob], "5-a-side-results.png", {
    type: "image/png"
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "5-a-side Results"
    });
  } else {
    saveSummaryImage();
  }
}

// Attaches core button and setup event listeners.
function wireEvents() {
  els.startBtn?.addEventListener("click", safe(startGame));
  els.resetBtn?.addEventListener("click", resetGame);
  els.pickBtn?.addEventListener("click", safe(pickRandomPlayer));
  els.acceptBtn?.addEventListener("click", safe(acceptPlayer));
  els.declineBtn?.addEventListener("click", safe(declinePlayer));
  els.revealBtn?.addEventListener("click", safe(revealScores));
  els.bidPickBtn?.addEventListener("click", safe(bidRandomPlayer));
  els.awardBidBtn?.addEventListener("click", safe(awardHighestBid));
  els.skipBidBtn?.addEventListener("click", safe(skipBidPlayer));
  els.saveSummaryBtn?.addEventListener("click", safe(saveSummaryImage));
  els.shareSummaryBtn?.addEventListener("click", safe(shareSummaryImage));

  els.userCount?.addEventListener("change", renderUserNameInputs);

  els.gameModeCards?.addEventListener("click", event => {
    const card = event.target.closest(".game-mode-card");

    if (!card) return;

    selectedGameMode = card.dataset.mode;

    updateSetupForMode();
  });
}


// ----- Compatibility patches and recent targeted fixes -----
// --- v29 targeted local draft fix and safe state overrides ---
// These override earlier functions while preserving the existing visual layout and app structure.

// ----- Final active helper implementations retained from later patches -----
function v29Array(value) {
  return Array.isArray(value) ? value : [];
}

function v29Set(value) {
  return value instanceof Set ? value : new Set(v29Array(value));
}

function v29NormalisePlayer(p, idx = 0) {
  if (!p) return null;
  const position = p.Position ?? p.position ?? p.POS ?? p.pos ?? "";
  const main = p.Main_Position ?? p.mainPosition ?? p.MainPosition ?? p.main_position ?? "";
  const player = String(p.Player ?? p.player ?? p.Name ?? p.name ?? "").trim();
  if (!player) return null;
  return {
    id: p.id ?? idx + 1,
    player,
    year: Number(p.Game_Year ?? p.year ?? p.Year ?? p.gameYear ?? 0),
    rating: Number(p.Rating_OVR ?? p.rating ?? p.OVR ?? p.ovr ?? p.Rating ?? 0),
    position: String(position || main || "").trim(),
    mainPosition: normalisePosition(main, position),
    club: String(p.Club ?? p.club ?? "").trim(),
    nation: String(p.Nation ?? p.nation ?? "").trim(),
    ...(p.price !== undefined ? { price: Number(p.price) } : {})
  };
}

function v29SafeUser(user, index = 0) {
  const team = v29Array(user?.team).map((p, i) => v29NormalisePlayer(p, i)).filter(Boolean);
  return {
    name: user?.name || `User ${index + 1}`,
    team,
    declines: Number(user?.declines || 0),
    declinedNames: v29Set(user?.declinedNames),
    budget: Number(user?.budget ?? AUCTION_BUDGET),
    spent: Number(user?.spent || 0),
    bidSkips: Number(user?.bidSkips || 0)
  };
}

function v29SafeState() {
  if (!state) return;
  state.users = v29Array(state.users).map((user, index) => v29SafeUser(user, index));
  state.userCount = state.users.length;
  state.currentUserIndex = state.users.length
    ? Math.min(Math.max(Number(state.currentUserIndex || 0), 0), state.users.length - 1)
    : 0;
  state.acceptedPlayerNames = v29Set(state.acceptedPlayerNames);
  state.history = v29Array(state.history);
  state.bidOrder = v29Array(state.bidOrder);
  state.bidRoundIndex = Number(state.bidRoundIndex || 0);
}

// Converts in-memory Sets into arrays for Firebase storage.
function serialiseState() {
  if (!state) return null;
  v29SafeState();
  return {
    ...state,
    acceptedPlayerNames: [...state.acceptedPlayerNames],
    users: state.users.map((user, index) => {
      const safeUser = v29SafeUser(user, index);
      return {
        ...safeUser,
        declinedNames: [...safeUser.declinedNames]
      };
    })
  };
}

// Rebuilds saved Firebase state back into safe runtime objects.
function restoreState(raw) {
  if (!raw) return null;
  const users = v29Array(raw.users).map((user, index) => v29SafeUser(user, index));
  const safeIndex = users.length
    ? Math.min(Math.max(Number(raw.currentUserIndex || 0), 0), users.length - 1)
    : 0;
  return {
    ...raw,
    users,
    userCount: users.length,
    currentUserIndex: safeIndex,
    acceptedPlayerNames: new Set(v29Array(raw.acceptedPlayerNames)),
    history: v29Array(raw.history),
    bidOrder: v29Array(raw.bidOrder),
    bidRoundIndex: Number(raw.bidRoundIndex || 0)
  };
}

function getNeededPositions(user) {
  const safeUser = v29SafeUser(user || {}, 0);
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  safeUser.team.forEach(player => {
    const p = normalisePosition(player.mainPosition || player.position);
    if (counts[p] !== undefined) counts[p] += 1;
  });
  const needed = [];
  TEAM_SHAPE.forEach(pos => {
    if (counts[pos] > 0) counts[pos] -= 1;
    else needed.push(pos);
  });
  return needed;
}

function isGameComplete() {
  v29SafeState();
  return !!state && state.users.every(user => getNeededPositions(user).length === 0);
}

function setDraftActionButtons() {
  if (!state || state.gameMode !== "draft") return;
  const canAct = !online.enabled || currentPlayerCanAct();
  const user = currentUser();
  if (els.pickBtn) els.pickBtn.disabled = !canAct || !!currentCandidate || isGameComplete();
  if (els.acceptBtn) els.acceptBtn.disabled = !canAct || !currentCandidate;
  if (els.declineBtn) els.declineBtn.disabled = !canAct || !currentCandidate || (user?.declines || 0) >= DECLINES_ALLOWED;
}

// Draws a random eligible draft player for the current user.
async function pickRandomPlayer() {
  await ensurePlayersReady();
  if (!state || state.gameMode !== "draft") return;
  v29SafeState();

  if (isGameComplete()) {
    completeGame();
    return;
  }

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  if (currentCandidate) {
    setMessage("Please accept or decline the current player before picking another.");
    setDraftActionButtons();
    return;
  }

  const user = currentUser();
  if (!user) {
    setMessage("No current user found.");
    return;
  }

  const needs = getNeededPositions(user);
  if (!needs.length) {
    moveToNextUser();
    await pickRandomPlayer();
    return;
  }

  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    if (state.excludeDeclines && user.declinedNames.has(p.player)) return false;
    return true;
  });

  if (!pool.length) {
    clearCandidate(`No available player found for ${user.name}. They need: ${needs.join(", ")}.`);
    await saveOnlineState();
    setDraftActionButtons();
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  setMessage(`${user.name} needs: ${needs.join(", ")}`);
  render();
  setDraftActionButtons();
  await saveOnlineState();
}


function buildSlots(user) {
  const safeUser = v29SafeUser(user || {}, 0);
  const mids = safeUser.team.filter(p => p.mainPosition === "MID");
  return [
    { label: "GK", player: safeUser.team.find(p => p.mainPosition === "GK") },
    { label: "DEF", player: safeUser.team.find(p => p.mainPosition === "DEF") },
    { label: "MID", player: mids[0] },
    { label: "MID", player: mids[1] },
    { label: "FWD", player: safeUser.team.find(p => p.mainPosition === "FWD") }
  ];
}


function getFinalScores() {
  if (!state || !Array.isArray(state.users)) return [];
  v29SafeState();
  return state.users
    .map((user, index) => {
      const safeUser = v29SafeUser(user, index);
      return {
        user: safeUser,
        total: safeUser.team.reduce((sum, p) => sum + Number(p.rating || 0), 0)
      };
    })
    .sort((a, b) => b.total - a.total);
}


// --- v30 smoother local draft flow overrides ---
// After Accept or Decline, immediately randomise the next eligible player so the game flows smoothly.


// --- v32 explicit local + online draft flow overrides ---
// This fixes the v31 recursion bug. No delegation/cached function references are used.
function onlineDrawCandidateForCurrentTurnV32(messagePrefix = null) {
  if (!online.enabled || !state || state.gameMode !== "draft") return false;
  v29SafeState();

  if (isGameComplete()) {
    completeGame();
    return false;
  }

  const user = currentUser();
  if (!user) {
    setMessage("No current user found.");
    return false;
  }

  const needs = getNeededPositions(user);
  if (!needs.length) {
    moveToNextUser();
    return onlineDrawCandidateForCurrentTurnV32(messagePrefix);
  }

  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    if (state.excludeDeclines && user.declinedNames.has(p.player)) return false;
    return true;
  });

  if (!pool.length) {
    currentCandidate = null;
    clearCandidate(`No available player found for ${user.name}. They need: ${needs.join(", ")}.`);
    return false;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  setMessage(messagePrefix || `${user.name} needs: ${needs.join(", ")}`);
  render();
  applyOnlinePermissions();
  return true;
}

// Accepts the current player into the active team.
async function acceptPlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  const picked = v29NormalisePlayer(currentCandidate);
  if (!picked) return;

  user.team.push(picked);
  state.acceptedPlayerNames.add(picked.player);
  state.history.push({ user: user.name, decision: "ACCEPT", player: picked });
  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
    render();
    await saveOnlineState("Game complete. Reveal ratings to see the winner.");
    return;
  }

  moveToNextUser();

  if (online.enabled) {
    onlineDrawCandidateForCurrentTurnV32();
    await saveOnlineState();
  } else {
    // Preserve the working v30 local behaviour: automatically pick the next player.
    render();
    setDraftActionButtons();
    await saveOnlineState();
    await pickRandomPlayer();
  }
}

// Declines the current player and tracks decline limits.
async function declinePlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;
  v29SafeState();

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();
  if (!user) return;

  if (user.declines >= DECLINES_ALLOWED) {
    setMessage(`${user.name} has no declines left and must accept this player.`);
    if (online.enabled) applyOnlinePermissions();
    else setDraftActionButtons();
    return;
  }

  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;

  if (online.enabled) {
    onlineDrawCandidateForCurrentTurnV32();
    await saveOnlineState();
  } else {
    // Preserve the working v30 local behaviour: automatically pick another player for the same user.
    render();
    setDraftActionButtons();
    await saveOnlineState();
    await pickRandomPlayer();
  }
}


// --- v33 finished-results page and improved share/save image overrides ---

// ----- Finished results page rendering and share image styling -----
function injectFinishedStylesV33() {
  if ($("finishedResultsStylesV33")) return;
  const style = document.createElement("style");
  style.id = "finishedResultsStylesV33";
  style.textContent = `
    .results-card.finished-results-page {
      max-width: 1180px;
      margin: 24px auto;
      animation: finishedPop .35s ease-out;
    }
    @keyframes finishedPop {
      from { transform: translateY(10px); opacity: .3; }
      to { transform: translateY(0); opacity: 1; }
    }
    .finished-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
      padding: 18px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(34,197,94,.16), rgba(14,165,233,.14));
      border: 1px solid rgba(255,255,255,.35);
      margin-bottom: 18px;
    }
    .finished-hero h2 {
      margin: 4px 0 6px;
      font-size: clamp(2rem, 5vw, 3.4rem);
    }
    .winner-badge-large {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 999px;
      background: #fef3c7;
      color: #92400e;
      font-weight: 950;
      box-shadow: 0 12px 28px rgba(146,64,14,.18);
      white-space: nowrap;
    }
    .finished-results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .finished-team-card {
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(226,232,240,.95);
      border-radius: 22px;
      padding: 16px;
      box-shadow: 0 18px 48px rgba(15,23,42,.12);
    }
    .finished-team-card.winner {
      border-color: #f59e0b;
      box-shadow: 0 18px 52px rgba(245,158,11,.22);
    }
    .finished-team-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .finished-rank {
      font-weight: 950;
      color: #64748b;
      font-size: .86rem;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .finished-score {
      font-weight: 950;
      font-size: 2rem;
      line-height: 1;
      color: #0f172a;
    }
    .finished-player-list {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }
    .finished-player-row {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 8px 10px;
    }
    .finished-pos {
      font-weight: 950;
      color: #166534;
      background: #dcfce7;
      border-radius: 999px;
      text-align: center;
      padding: 4px 0;
      font-size: .78rem;
    }
    .finished-player-name {
      font-weight: 900;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .finished-player-meta {
      font-size: .78rem;
      color: #64748b;
      font-weight: 750;
    }
    .finished-player-rating {
      font-weight: 950;
      color: #1d4ed8;
    }
    .finished-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    @media (max-width: 720px) {
      .finished-hero { grid-template-columns: 1fr; }
      .finished-actions { justify-content: stretch; }
      .finished-actions .btn { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

function removeTurnLockNoteV33() {
  const note = $("turnLockNote");
  if (note) note.remove();
}

function playerRoleForFinishedV33(player) {
  return player?.mainPosition || player?.position || "";
}


// Renders final scorecards once ratings are revealed.
function renderResults() {
  if (!els.resultsContainer || !state) return;
  const scored = getFinalScores();
  const top = scored[0]?.total ?? 0;
  const winnerNames = scored.filter(row => row.total === top).map(row => row.user.name).join(" & ");

  const header = document.querySelector("#resultsPanel .section-title-row");
  if (header) {
    header.innerHTML = `
      <div class="finished-hero">
        <div>
          <p class="eyebrow">Full time</p>
          <h2>Final results</h2>
          <p class="muted">The draft is complete. Ratings are now revealed and the winner is confirmed.</p>
          <div class="winner-badge-large">🏆 Winner: ${escapeHtml(winnerNames || "TBC")} (${top})</div>
        </div>
        <div class="finished-actions">
          <button id="shareSummaryBtn" class="btn btn-primary">Share summary</button>
          <button id="saveSummaryBtn" class="btn btn-secondary">Save picture</button>
          <button id="resetBtnResults" class="btn btn-secondary">New game</button>
        </div>
      </div>
    `;
    $("shareSummaryBtn")?.addEventListener("click", safe(shareSummaryImage));
    $("saveSummaryBtn")?.addEventListener("click", safe(saveSummaryImage));
    $("resetBtnResults")?.addEventListener("click", resetGame);
  }

  els.resultsContainer.className = "finished-results-grid";
  els.resultsContainer.innerHTML = scored.map((row, index) => {
    const isWinner = row.total === top;
    const team = Array.isArray(row.user.team) ? row.user.team : [];
    return `
      <article class="finished-team-card ${isWinner ? "winner" : ""}">
        <div class="finished-team-top">
          <div>
            <div class="finished-rank">${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} place ${isWinner ? "🏆" : ""}</div>
            <h3>${escapeHtml(row.user.name)}</h3>
          </div>
          <div class="finished-score">${row.total}</div>
        </div>
        ${renderPitch(buildSlots(row.user))}
        <div class="finished-player-list">
          ${team.map(player => `
            <div class="finished-player-row">
              <span class="finished-pos">${escapeHtml(playerRoleForFinishedV33(player))}</span>
              <span>
                <span class="finished-player-name">${escapeHtml(player.player)}</span>
                <span class="finished-player-meta">${escapeHtml(shortenClub(player.club))}${player.year ? ` • ${player.year}` : ""}</span>
              </span>
              <span class="finished-player-rating">${player.rating}</span>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

// Reveals ratings and final results.
async function revealScores() {
  ratingsRevealed = true;
  currentCandidate = null;
  showFinishedResultsPageV33();
  await saveOnlineState("Scores revealed.");
}


function fitTextV33(ctx, text, x, y, maxWidth, font, color = "#0f172a") {
  ctx.font = font;
  ctx.fillStyle = color;
  let output = String(text || "");
  while (output.length > 3 && ctx.measureText(output).width > maxWidth) {
    output = output.slice(0, -2) + "…";
  }
  ctx.fillText(output, x, y);
}

function roundRectV33(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Builds the share/save image canvas.
function createSummaryCanvas() {
  const scored = getFinalScores();
  const teamCount = Math.max(scored.length, 1);
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = Math.max(980, 290 + teamCount * 220);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#052e16");
  bg.addColorStop(.48, "#0f172a");
  bg.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.arc(120 + i * 110, 90 + (i % 3) * 60, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 64px Arial";
  ctx.fillText("Ultimate 5-a-side Draft", 70, 90);
  ctx.font = "800 34px Arial";
  ctx.fillStyle = "#d1fae5";
  ctx.fillText("Final results", 72, 138);

  const winner = scored[0];
  if (winner) {
    ctx.fillStyle = "#fef3c7";
    roundRectV33(ctx, 70, 165, 1460, 82, 26);
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.font = "900 38px Arial";
    ctx.fillText(`🏆 Winner: ${winner.user.name}  •  ${winner.total} points`, 105, 218);
  }

  const x = 70;
  let y = 285;
  const cardW = 1460;
  const cardH = 190;
  const topScore = winner?.total ?? 0;

  scored.forEach((row, idx) => {
    const isWinner = row.total === topScore;
    ctx.fillStyle = isWinner ? "rgba(254,243,199,0.98)" : "rgba(255,255,255,0.94)";
    roundRectV33(ctx, x, y, cardW, cardH, 28);
    ctx.fill();

    ctx.strokeStyle = isWinner ? "#f59e0b" : "rgba(226,232,240,.95)";
    ctx.lineWidth = isWinner ? 6 : 2;
    ctx.stroke();

    ctx.fillStyle = isWinner ? "#92400e" : "#475569";
    ctx.font = "900 28px Arial";
    ctx.fillText(`#${idx + 1}`, x + 32, y + 50);

    fitTextV33(ctx, row.user.name, x + 105, y + 52, 470, "900 38px Arial", "#0f172a");

    ctx.fillStyle = "#1d4ed8";
    ctx.font = "900 52px Arial";
    ctx.fillText(String(row.total), x + cardW - 145, y + 60);
    ctx.font = "800 20px Arial";
    ctx.fillStyle = "#64748b";
    ctx.fillText("TOTAL", x + cardW - 145, y + 88);

    const team = Array.isArray(row.user.team) ? row.user.team : [];
    const startX = x + 30;
    const rowY = y + 104;
    const slotW = 270;
    team.slice(0, 5).forEach((p, i) => {
      const px = startX + i * (slotW + 12);
      ctx.fillStyle = "#f8fafc";
      roundRectV33(ctx, px, rowY, slotW, 62, 16);
      ctx.fill();
      ctx.strokeStyle = "#dbeafe";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#166534";
      roundRectV33(ctx, px + 10, rowY + 11, 46, 40, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 16px Arial";
      ctx.fillText(playerRoleForFinishedV33(p).slice(0, 3), px + 16, rowY + 37);

      fitTextV33(ctx, p.player, px + 66, rowY + 31, 150, "900 18px Arial", "#0f172a");
      fitTextV33(ctx, `${shortenClub(p.club)}${p.year ? " • " + p.year : ""}`, px + 66, rowY + 52, 150, "700 14px Arial", "#64748b");
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "900 24px Arial";
      ctx.fillText(String(p.rating || ""), px + 224, rowY + 38);
    });

    y += cardH + 28;
  });

  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = "700 22px Arial";
  ctx.fillText("Generated from Ultimate 5-a-side Draft", 70, canvas.height - 45);

  return canvas;
}


// --- v34 online turn ownership override ---
// Host can still create/start the room, but cannot accept/decline/pick on behalf of another user.
// Only the player whose name matches the current turn can control that turn.
function currentPlayerCanAct() {
  if (!online.enabled) return true;
  const user = currentUser();
  return !!(user && safeKey(user.name) === safeKey(online.myName));
}

function applyOnlinePermissions() {
  if (!online.enabled || !state) return;

  const user = currentUser();
  const canAct = currentPlayerCanAct();

  let note = $("turnLockNote");

  if (!note && els.message) {
    note = document.createElement("div");
    note.id = "turnLockNote";
    note.className = "turn-lock-note";
    els.message.insertAdjacentElement("afterend", note);
  }

  if (note) {
    note.textContent = canAct
      ? `It is your turn, ${online.myName}.`
      : `Waiting for ${user?.name || "the current player"}. You joined as ${online.myName}.`;
  }

  if (state.gameMode === "draft") {
    if (els.pickBtn) els.pickBtn.disabled = !canAct || !!currentCandidate || isGameComplete();
    if (els.acceptBtn) els.acceptBtn.disabled = !canAct || !currentCandidate;
    if (els.declineBtn) els.declineBtn.disabled = !canAct || !currentCandidate || (currentUser()?.declines || 0) >= DECLINES_ALLOWED;
  }
}


// --- v35 full reset-to-front-page override ---
// This reset fully exits online/local game state and returns to the initial front page.
function resetGame() {
  try {
    if (online.ref && online.subscribed && typeof online.ref.off === "function") {
      online.ref.off();
    }
  } catch (err) {
    console.warn("Could not detach Firebase listener during reset", err);
  }

  state = null;
  currentCandidate = null;
  ratingsRevealed = false;
  applyingRemote = false;

  online.enabled = false;
  online.isHost = false;
  online.roomId = null;
  online.ref = null;
  online.myName = "";
  online.subscribed = false;

  const turnNote = $("turnLockNote");
  if (turnNote) turnNote.remove();

  if (els.message) els.message.textContent = "";
  if (els.candidateCard) clearCandidate("Click “Pick player” to begin.");
  if (els.teamsContainer) els.teamsContainer.innerHTML = "";
  if (els.resultsContainer) els.resultsContainer.innerHTML = "";
  if (els.resultsPanel) els.resultsPanel.classList.remove("finished-results-page");

  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, false);

  injectEntryPanel();
  show($("gameEntryPanel"), true);

  const onlineName = $("onlineRoomName");
  const roomCode = $("joinRoomCode");
  const onlineStatus = $("onlineRoomStatus");
  const onlineLink = $("onlineRoomLink");
  if (onlineName) onlineName.value = "";
  if (roomCode) roomCode.value = "";
  if (onlineStatus) onlineStatus.textContent = "Online games use joined player names automatically.";
  if (onlineLink) {
    onlineLink.textContent = "";
    onlineLink.classList.add("hidden");
  }

  if (els.revealBtn) els.revealBtn.classList.add("hidden");
  if (els.pickBtn) els.pickBtn.disabled = false;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  if (els.bidPickBtn) els.bidPickBtn.disabled = false;
  if (els.awardBidBtn) els.awardBidBtn.disabled = true;
  if (els.skipBidBtn) els.skipBidBtn.disabled = true;

  // If the user arrived via an online room link, remove ?room=... so reset feels like a true new start.
  try {
    if (window.history && window.location.search) {
      window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
    }
  } catch (err) {
    console.warn("Could not clear room URL during reset", err);
  }

  selectedGameMode = "draft";
  updateSetupForMode();
}


// --- v36 improved 4-player results layout override ---
// Keeps the v35 behaviour but makes the finished results page use a roomier 2-column layout on desktop.

// ----- Results layout refinements -----
function injectResultsLayoutStylesV36() {
  if ($("finishedResultsLayoutStylesV36")) return;
  const style = document.createElement("style");
  style.id = "finishedResultsLayoutStylesV36";
  style.textContent = `
    .results-card.finished-results-page {
      max-width: 1320px !important;
      width: min(1320px, calc(100vw - 32px));
    }

    .finished-results-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(420px, 1fr)) !important;
      gap: 24px !important;
      align-items: start;
    }

    .finished-team-card {
      min-width: 0;
      padding: 20px !important;
    }

    .finished-team-card .pitch {
      min-height: 360px;
    }

    .finished-player-list {
      gap: 10px !important;
    }

    .finished-player-row {
      grid-template-columns: 52px minmax(0, 1fr) 44px !important;
      min-width: 0;
    }

    .finished-player-name,
    .finished-player-meta {
      display: block;
      min-width: 0;
    }

    @media (max-width: 980px) {
      .finished-results-grid {
        grid-template-columns: 1fr !important;
      }

      .results-card.finished-results-page {
        width: min(760px, calc(100vw - 24px));
      }
    }
  `;
  document.head.appendChild(style);
}

function showFinishedResultsPageV33() {
  if (!state) return;
  injectFinishedStylesV33();
  injectResultsLayoutStylesV36();
  ratingsRevealed = true;
  currentCandidate = null;
  removeTurnLockNoteV33();
  setMessage("");

  show($("gameEntryPanel"), false);
  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, false);
  show(els.resultsPanel, true);

  if (els.resultsPanel) els.resultsPanel.classList.add("finished-results-page");
  if (els.revealBtn) els.revealBtn.classList.add("hidden");
  if (els.pickBtn) els.pickBtn.disabled = true;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  if (els.bidPickBtn) els.bidPickBtn.disabled = true;
  if (els.awardBidBtn) els.awardBidBtn.disabled = true;
  if (els.skipBidBtn) els.skipBidBtn.disabled = true;

  renderResults();
  setTimeout(() => els.resultsPanel?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}


// --- v37 allow any online user to reveal final results ---
// Once all teams are complete, every joined online user sees and can click Reveal ratings.
function syncRevealButtonV37() {
  if (!state || !els.revealBtn) return;
  if (ratingsRevealed) {
    els.revealBtn.classList.add("hidden");
    els.revealBtn.disabled = true;
    return;
  }
  const complete = isGameComplete();
  els.revealBtn.classList.toggle("hidden", !complete);
  els.revealBtn.disabled = !complete;
}


// Locks drafting and enables the reveal button.
function completeGame() {
  currentCandidate = null;
  clearCandidate("Game complete. Reveal ratings to see the winner.");
  syncRevealButtonV37();
  if (els.pickBtn) els.pickBtn.disabled = true;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;
  saveOnlineState("Game complete. Reveal ratings to see the winner.");
}


// --- v38 online blind bidding mode override ---
// Online bid mode only: all eligible users submit bids in parallel, then bids are revealed together.

// ----- Online blind bidding helpers -----
function userNeedsPositionV38(user, position) {
  return getNeededPositions(user).includes(position);
}

function eligibleBidUsersV38(candidate = currentCandidate) {
  if (!state || !candidate) return [];
  v29SafeState();
  return state.users.filter(user => {
    return getNeededPositions(user).length > 0 && userNeedsPositionV38(user, candidate.mainPosition) && Number(user.budget || 0) > 0;
  });
}

function allOnlineBidUsersV38() {
  if (!state) return [];
  v29SafeState();
  return state.users.filter(user => getNeededPositions(user).length > 0);
}

function currentOnlineUserV38() {
  if (!online.enabled || !state) return null;
  v29SafeState();
  return state.users.find(user => safeKey(user.name) === safeKey(online.myName)) || null;
}

function initialiseBlindBidStateV38() {
  if (!state) return;
  if (!state.blindBids || typeof state.blindBids !== "object" || Array.isArray(state.blindBids)) state.blindBids = {};
  state.bidOutcome = state.bidOutcome || null;
  state.bidSubmittingLocked = !!state.bidSubmittingLocked;
}

async function drawOnlineBlindBidCandidateV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  await ensurePlayersReady();
  v29SafeState();

  if (isGameComplete()) {
    completeGame();
    render();
    await saveOnlineState("Game complete. Reveal ratings to see the winner.");
    return;
  }

  const neededPositions = new Set();
  allOnlineBidUsersV38().forEach(user => getNeededPositions(user).forEach(pos => neededPositions.add(pos)));

  const pool = players.filter(p => {
    return neededPositions.has(p.mainPosition) && !state.acceptedPlayerNames.has(p.player);
  });

  if (!pool.length) {
    completeGame();
    render();
    await saveOnlineState("No more eligible players. Reveal ratings to see the winner.");
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  state.blindBids = {};
  state.bidOutcome = null;
  state.bidSubmittingLocked = false;

  renderCandidate(currentCandidate);
  renderOnlineBidControlsV38();
  setMessage(`Blind bidding open for ${currentCandidate.player}.`);
  await saveOnlineState(`Blind bidding open for ${currentCandidate.player}.`);
}


// Starts an online game from the lobby participant list.
async function startOnlineGameFromLobby() {
  if (!online.enabled || !online.isHost || !online.ref) return;

  await ensurePlayersReady();

  const snapshot = await online.ref.child("participants").once("value");
  const names = participantNamesFromObject(snapshot.val());

  const minUsers = selectedGameMode === "bid" ? 2 : 1;

  if (names.length < minUsers) {
    throw new Error(selectedGameMode === "bid"
      ? "Bid mode needs at least 2 players."
      : "At least 1 player is needed.");
  }

  startNewGame(selectedGameMode, names.slice(0, 4), true);

  if (selectedGameMode === "bid") {
    state.blindBids = {};
    state.bidOutcome = null;
    state.bidSubmittingLocked = false;
    await drawOnlineBlindBidCandidateV38();
  } else {
    await saveOnlineState("Online game started.");
  }
}


// Applies Firebase data to the local UI.
function applyRemoteData(data) {
  applyingRemote = true;
  state = restoreState(data.state);
  currentCandidate = data.currentCandidate || null;
  ratingsRevealed = !!data.ratingsRevealed;

  if (ratingsRevealed) {
    applyingRemote = false;
    showFinishedResultsPageV33();
    return;
  }

  hideEntryPanel();
  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, true);
  show(els.resultsPanel, false);
  updateGameControls();
  render();
  if (currentCandidate) renderCandidate(currentCandidate);
  else clearCandidate(data.message || (isGameComplete() ? "Game complete. Reveal ratings to see the winner." : "Waiting for the next action..."));
  renderTeams();
  if (online.enabled && state?.gameMode === "bid") renderOnlineBidControlsV38();
  setMessage(data.message || "");
  applyingRemote = false;
  applyOnlinePermissions();
  syncRevealButtonV37();
}


// --- v39 preserve unsubmitted blind bid input during remote updates ---
// Fixes: When another online user submits, Firebase refresh re-renders the controls. Any typed-but-unsubmitted bid now persists locally.

// ----- Local draft persistence for blind-bid entries -----
function blindBidDraftKeyV39() {
  const playerKey = currentCandidate?.player ? safeKey(currentCandidate.player) : "no_player";
  const roomKey = online.roomId || "local_room";
  const userKey = safeKey(online.myName || "anon");
  return `ultimate5aside_blind_bid_draft_${roomKey}_${userKey}_${playerKey}`;
}

function getBlindBidDraftV39(defaultValue = "0") {
  try {
    return localStorage.getItem(blindBidDraftKeyV39()) ?? defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function setBlindBidDraftV39(value) {
  try {
    localStorage.setItem(blindBidDraftKeyV39(), String(value ?? "0"));
  } catch (err) {
    // localStorage can be blocked in some privacy modes. If so, the game still works; only the draft preservation is skipped.
  }
}

function clearBlindBidDraftV39() {
  try {
    localStorage.removeItem(blindBidDraftKeyV39());
  } catch (err) {
    // Ignore.
  }
}


// --- v42 local bid controls fix ---
// Fixes local bid mode where Award highest bid and Skip player stayed disabled.
// Online blind bidding from v39 is deliberately left unchanged.

function clearLocalBidInputsV42(message = "") {
  if (!online.enabled && state?.gameMode === "bid" && els.bidInputs) {
    els.bidInputs.innerHTML = message ? `<p class="muted">${escapeHtml(message)}</p>` : "";
  }
}


// Draws a candidate for local blind bidding.
async function bidRandomPlayer() {
  if (online.enabled && state?.gameMode === "bid") {
    await drawOnlineBlindBidCandidateV38();
    return;
  }

  await ensurePlayersReady();
  if (!state || state.gameMode !== "bid") return;
  v29SafeState();

  if (currentCandidate) {
    setMessage("Award or skip the current player before randomising another.");
    setBidActionButtonsV42();
    return;
  }

  if (isGameComplete()) {
    completeGame();
    render();
    return;
  }

  const user = currentUser();
  if (!user) return;

  const needs = getNeededPositions(user);
  const pool = players.filter(p => {
    return needs.includes(p.mainPosition) && !state.acceptedPlayerNames.has(p.player);
  });

  if (!pool.length) {
    setMessage(`No available player for ${user.name}.`);
    setBidActionButtonsV42();
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  renderBidInputs();
  setMessage(`${user.name} nominated ${currentCandidate.player}. Enter bids, then award or skip.`);
  renderTeams();
  setBidActionButtonsV42();
  await saveOnlineState();
}


// Refreshes the main game panels.
function render() {
  if (!state) return;
  v29SafeState();
  updateGameControls();

  const user = currentUser();
  if (els.currentUserLabel) els.currentUserLabel.textContent = user?.name || "";

  if (state.gameMode === "draft" && els.declinesLeft) {
    els.declinesLeft.textContent = DECLINES_ALLOWED - (user?.declines || 0);
  }

  if (state.gameMode === "bid" && els.currentBudgetLeft) {
    els.currentBudgetLeft.textContent = `£${user?.budget || 0}m`;
  }

  renderTeams();

  if (online.enabled && state.gameMode === "bid") {
    renderOnlineBidControlsV38();
  } else if (state.gameMode === "bid") {
    setBidActionButtonsV42();
  } else {
    setDraftActionButtons();
  }

  applyOnlinePermissions();
  syncRevealButtonV37();
}


// --- v43 restore local bid skip lives ---
// Local bid mode only. Online blind bidding remains unchanged.
// Rule: each eligible user has 3 zero-bid/skip lives. If they bid £0m or the player is skipped, they lose one life.
// Once a user has used 3 skips, they must bid above £0m for eligible players.
function localEligibleBidUsersV43(candidate = currentCandidate) {
  if (!state || !candidate) return [];
  v29SafeState();
  return state.users.filter(user => {
    return getNeededPositions(user).includes(candidate.mainPosition);
  });
}

function localBidSkipsUsedV43(user) {
  return Math.max(0, Number(user?.bidSkips || 0));
}

function localBidSkipsLeftV43(user) {
  return Math.max(0, BID_SKIPS_ALLOWED - localBidSkipsUsedV43(user));
}

function localZeroBidUsersV43(eligibleUsers) {
  return eligibleUsers.filter((user) => {
    const index = state.users.findIndex(u => safeKey(u.name) === safeKey(user.name));
    return getBid(index) <= 0;
  });
}

function localUsersWithNoSkipsLeftV43(users) {
  return users.filter(user => localBidSkipsUsedV43(user) >= BID_SKIPS_ALLOWED);
}

function localIncrementSkipsV43(users) {
  users.forEach(user => {
    user.bidSkips = Math.min(BID_SKIPS_ALLOWED, localBidSkipsUsedV43(user) + 1);
  });
}


// ----- Local bidding controls and skip logic -----
function setBidActionButtonsV42() {
  if (!state || state.gameMode !== "bid") return;
  if (online.enabled) return;

  const hasCandidate = !!currentCandidate;
  const complete = isGameComplete();
  const eligibleUsers = localEligibleBidUsersV43();
  const everyoneCanStillSkip = eligibleUsers.length > 0 && localUsersWithNoSkipsLeftV43(eligibleUsers).length === 0;

  if (els.bidPickBtn) {
    els.bidPickBtn.classList.remove("hidden");
    els.bidPickBtn.disabled = hasCandidate || complete;
  }

  if (els.awardBidBtn) {
    els.awardBidBtn.classList.remove("hidden");
    els.awardBidBtn.disabled = !hasCandidate || complete;
  }

  if (els.skipBidBtn) {
    els.skipBidBtn.classList.remove("hidden");
    // If any eligible user has no skips left, the group cannot skip the player outright.
    els.skipBidBtn.disabled = !hasCandidate || complete || !everyoneCanStillSkip;
    els.skipBidBtn.title = hasCandidate && !everyoneCanStillSkip
      ? "At least one eligible user has no skips left and must bid above £0m."
      : "";
  }
}

function renderBidInputs() {
  if (!els.bidInputs || !state || state.gameMode !== "bid") return;

  if (!currentCandidate) {
    clearLocalBidInputsV42("Randomise a player to enter bids.");
    setBidActionButtonsV42();
    return;
  }

  const eligibleKeys = new Set(localEligibleBidUsersV43().map(user => safeKey(user.name)));

  els.bidInputs.innerHTML = state.users.map((u, i) => {
    const eligible = eligibleKeys.has(safeKey(u.name));
    const skipsLeft = localBidSkipsLeftV43(u);
    const mustBid = eligible && skipsLeft <= 0;
    return `
      <div class="bid-row">
        <label for="bidUser${i}">
          ${escapeHtml(u.name)}
          <span class="bid-help">
            Budget left: £${u.budget}m • Skips left: ${skipsLeft}/${BID_SKIPS_ALLOWED}${mustBid ? " • must bid above £0m" : ""}
          </span>
        </label>
        <input id="bidUser${i}" type="number" min="0" max="${u.budget}" step="1" value="0" ${eligible ? "" : "disabled"} />
        ${eligible ? "" : `<p class="muted" style="margin:6px 0 0;">Not eligible for ${escapeHtml(currentCandidate.mainPosition)}.</p>`}
      </div>
    `;
  }).join("");

  setBidActionButtonsV42();
}

// Awards the candidate to the highest valid local bid.
async function awardHighestBid() {
  // Keep online mode completely separate.
  if (online.enabled) return;
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  v29SafeState();

  const eligibleUsers = localEligibleBidUsersV43();
  if (!eligibleUsers.length) {
    setMessage("No eligible users can bid for this player. Skip or randomise again.");
    setBidActionButtonsV42();
    return;
  }

  const zeroBidUsers = localZeroBidUsersV43(eligibleUsers);
  const zeroBiddersWithNoSkipsLeft = localUsersWithNoSkipsLeftV43(zeroBidUsers);

  if (zeroBiddersWithNoSkipsLeft.length) {
    setMessage(`${zeroBiddersWithNoSkipsLeft.map(u => u.name).join(" and ")} ${zeroBiddersWithNoSkipsLeft.length === 1 ? "has" : "have"} no skips left and must bid above £0m.`);
    setBidActionButtonsV42();
    return;
  }

  let best = null;

  eligibleUsers.forEach((u) => {
    const i = state.users.findIndex(user => safeKey(user.name) === safeKey(u.name));
    const bid = getBid(i);
    if (bid > 0 && bid <= u.budget && (!best || bid > best.bid)) {
      best = { user: u, index: i, bid };
    }
  });

  // If everyone eligible bid zero, everyone eligible loses a skip and the player is skipped.
  if (!best) {
    localIncrementSkipsV43(eligibleUsers);
    const skippedName = currentCandidate.player;
    currentCandidate = null;
    rotateBidNominator();
    clearCandidate("Everyone bid £0m. Player skipped. Click Randomise player to continue.");
    clearLocalBidInputsV42("Randomise the next player to enter bids.");
    setMessage(`${skippedName} was skipped. ${eligibleUsers.map(u => u.name).join(", ")} ${eligibleUsers.length === 1 ? "loses" : "lose"} one skip.`);
    render();
    setBidActionButtonsV42();
    await saveOnlineState();
    return;
  }

  // Any eligible user who bid £0m also loses a skip, even if another user wins the player.
  localIncrementSkipsV43(zeroBidUsers);

  const awardedPlayer = v29NormalisePlayer(currentCandidate);
  if (!awardedPlayer) return;

  best.user.team.push({
    ...awardedPlayer,
    price: best.bid
  });

  best.user.budget = Math.max(0, Number(best.user.budget || 0) - best.bid);
  best.user.spent = Number(best.user.spent || 0) + best.bid;
  state.acceptedPlayerNames.add(awardedPlayer.player);

  const winnerName = best.user.name;
  const playerName = awardedPlayer.player;
  const zeroPenaltyText = zeroBidUsers.length
    ? ` ${zeroBidUsers.map(u => u.name).join(", ")} ${zeroBidUsers.length === 1 ? "loses" : "lose"} one skip for bidding £0m.`
    : "";

  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
    clearLocalBidInputsV42("Bidding complete. Reveal ratings to see the winner.");
  } else {
    rotateBidNominator();
    clearCandidate("Click Randomise player to continue.");
    clearLocalBidInputsV42("Randomise the next player to enter bids.");
    setMessage(`${winnerName} won ${playerName} for £${best.bid}m.${zeroPenaltyText}`);
  }

  render();
  setBidActionButtonsV42();
  await saveOnlineState();
}

// Skips the current local bid candidate.
async function skipBidPlayer() {
  // Keep online mode completely separate.
  if (online.enabled) return;
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;
  v29SafeState();

  const eligibleUsers = localEligibleBidUsersV43();
  const usersWithNoSkipsLeft = localUsersWithNoSkipsLeftV43(eligibleUsers);

  if (usersWithNoSkipsLeft.length) {
    setMessage(`${usersWithNoSkipsLeft.map(u => u.name).join(" and ")} ${usersWithNoSkipsLeft.length === 1 ? "has" : "have"} no skips left and must bid above £0m.`);
    setBidActionButtonsV42();
    return;
  }

  localIncrementSkipsV43(eligibleUsers);

  const skippedName = currentCandidate.player;
  currentCandidate = null;

  rotateBidNominator();
  clearCandidate("Player skipped. Click Randomise player to continue.");
  clearLocalBidInputsV42("Randomise the next player to enter bids.");
  setMessage(`${skippedName} was skipped. ${eligibleUsers.map(u => u.name).join(", ")} ${eligibleUsers.length === 1 ? "loses" : "lose"} one skip.`);

  render();
  setBidActionButtonsV42();
  await saveOnlineState();
}

// Renders all teams and pitch layouts.
function renderTeams() {
  if (!els.teamsContainer || !state || !Array.isArray(state.users)) return;
  v29SafeState();
  els.teamsContainer.innerHTML = state.users.map((user, index) => {
    const safeUser = v29SafeUser(user, index);
    state.users[index] = safeUser;
    const total = safeUser.team.reduce((sum, p) => sum + Number(p.rating || 0), 0);
    const needs = getNeededPositions(safeUser);
    return `
      <article class="team-card">
        <div class="team-top-row">
          <div>
            <h3>${escapeHtml(safeUser.name)}</h3>
            <div class="team-meta">${needs.length ? `Needs ${needs.join(", ")}` : "Complete"}</div>
          </div>
          <div class="score">${ratingsRevealed ? total : "Hidden"}</div>
        </div>
        ${renderPitch(buildSlots(safeUser))}
        ${state.gameMode === "draft"
          ? `<div class="score">Declines used: ${safeUser.declines}/${DECLINES_ALLOWED}</div>`
          : `<div class="score">Skips used: ${localBidSkipsUsedV43(safeUser)}/${BID_SKIPS_ALLOWED}</div>`}
      </article>
    `;
  }).join("");
}


// --- v44 online blind bid skip lives ---
// Extends the v43 3-skip rule to ONLINE blind bidding.
// If an eligible online user submits £0m, they lose one skip. If they have used all 3 skips, they must bid above £0m.

// ----- Online bidding skip/reserve rules -----
function onlineBidSkipsUsedV44(user) {
  return Math.max(0, Number(user?.bidSkips || 0));
}

function onlineBidSkipsLeftV44(user) {
  return Math.max(0, BID_SKIPS_ALLOWED - onlineBidSkipsUsedV44(user));
}

function onlineIncrementSkipV44(user) {
  if (!user) return;
  user.bidSkips = Math.min(BID_SKIPS_ALLOWED, onlineBidSkipsUsedV44(user) + 1);
}


// --- v45 online blind bid reserve budget rule ---
// Online bid mode only.
// A user must keep at least £1m for every remaining empty squad slot after winning the current player.
// Example: if they have £50m left and would still need 1 more player after this bid, max bid is £49m.
function onlineMinimumReserveAfterWinV45(user, candidate = currentCandidate) {
  if (!user || !candidate) return 0;
  const needs = getNeededPositions(user);
  if (!needs.includes(candidate.mainPosition)) return 0;
  // Winning this candidate fills exactly one of the needed slots.
  const remainingSlotsAfterWin = Math.max(0, needs.length - 1);
  return remainingSlotsAfterWin;
}
function onlineMaxBidForCandidateV45(user, candidate = currentCandidate) {
  const budget = Math.max(0, Math.floor(Number(user?.budget || 0)));
  const reserve = onlineMinimumReserveAfterWinV45(user, candidate);
  return Math.max(0, budget - reserve);
}
function onlineBidReserveHelpTextV45(user, candidate = currentCandidate) {
  const reserve = onlineMinimumReserveAfterWinV45(user, candidate);
  const maxBid = onlineMaxBidForCandidateV45(user, candidate);
  if (reserve > 0) {
    return `Max bid: £${maxBid}m • Keeps £${reserve}m for ${reserve} remaining player${reserve === 1 ? "" : "s"}`;
  }
  return `Max bid: £${maxBid}m`;
}
function renderOnlineBidControlsV38() {
  if (!online.enabled || !state || state.gameMode !== "bid") return;
  initialiseBlindBidStateV38();
  v29SafeState();
  show(els.draftControls, false);
  show(els.bidControls, true);
  show(els.declinesPill, false);
  show(els.budgetPill, false);
  if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
  if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
  if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");
  const me = currentOnlineUserV38();
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(online.myName);
  const myBid = state.blindBids?.[myKey];
  const submittedCount = eligible.filter(user => state.blindBids?.[safeKey(user.name)]?.submitted).length;
  const totalCount = eligible.length;
  const outcome = state.bidOutcome;
  if (els.bidOrderDisplay) {
    els.bidOrderDisplay.innerHTML = `
      <div class="bid-status-summary">
        <strong>Blind bidding</strong>
        <span>${submittedCount}/${totalCount} eligible bids submitted</span>
      </div>
    `;
  }
  if (!els.bidInputs) return;
  if (!currentCandidate && isGameComplete()) {
    els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
    syncRevealButtonV37?.();
    return;
  }
  if (!currentCandidate && !outcome) {
    els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
    return;
  }
  const statusRows = state.users.map(user => {
    const key = safeKey(user.name);
    const isEligible = eligibleKeys.has(key);
    const submitted = !!state.blindBids?.[key]?.submitted;
    const budget = Number(user.budget || 0);
    const skipsLeft = onlineBidSkipsLeftV44(user);
    const maxBid = isEligible && currentCandidate ? onlineMaxBidForCandidateV45(user, currentCandidate) : 0;
    return `
      <div class="bid-row">
        <label>
          ${escapeHtml(user.name)}
          <span class="bid-help">Budget left: £${budget}m • Skips left: ${skipsLeft}/${BID_SKIPS_ALLOWED}${isEligible ? ` • Max bid: £${maxBid}m` : ""}</span>
        </label>
        <div class="bid-submit-status ${submitted ? "submitted" : "waiting"}">
          ${isEligible ? (submitted ? "Bid submitted ✅" : (skipsLeft <= 0 ? "Must bid above £0m" : "Waiting for bid")) : "Not eligible for this position"}
        </div>
      </div>
    `;
  }).join("");
  if (outcome) {
    clearBlindBidDraftV39();
    const bidRevealRows = outcome.bids.map(row => `
      <div class="bid-row">
        <label>${escapeHtml(row.name)}</label>
        <div class="bid-submit-status submitted">£${Number(row.bid || 0)}m</div>
      </div>
    `).join("");
    els.bidInputs.innerHTML = `
      <div class="bid-order-card">
        <p class="eyebrow">Bids revealed</p>
        <h3>${escapeHtml(outcome.player?.player || "Player")}</h3>
        <p class="message">
          ${outcome.winnerName
            ? `${escapeHtml(outcome.winnerName)} wins ${escapeHtml(outcome.player?.player || "the player")} for £${outcome.winningBid}m${outcome.tie ? " after a tied highest bid" : ""}.`
            : `No valid bids above £0m. ${escapeHtml(outcome.player?.player || "The player")} was skipped.`}
        </p>
        ${bidRevealRows}
        ${outcome.zeroBidNames?.length ? `<p class="muted">${escapeHtml(outcome.zeroBidNames.join(", "))} ${outcome.zeroBidNames.length === 1 ? "loses" : "lose"} one skip for bidding £0m.</p>` : ""}
        ${outcome.invalidReserveNames?.length ? `<p class="muted">${escapeHtml(outcome.invalidReserveNames.join(", "))} had bids rejected because they did not leave £1m for each remaining squad slot.</p>` : ""}
        <p class="muted">Next player loading...</p>
      </div>
    `;
    return;
  }
  const canSubmit = !!me && eligibleKeys.has(myKey) && !myBid?.submitted && !state.bidSubmittingLocked;
  const myBudget = Number(me?.budget || 0);
  const mySkipsLeft = onlineBidSkipsLeftV44(me);
  const myMaxBid = me && currentCandidate ? onlineMaxBidForCandidateV45(me, currentCandidate) : 0;
  const reserveHelp = me && currentCandidate ? onlineBidReserveHelpTextV45(me, currentCandidate) : "";
  const draftValue = getBlindBidDraftV39("0");
  const submitBox = canSubmit ? `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <h3>${escapeHtml(currentCandidate.player)}</h3>
      <p class="muted">Enter your bid privately. You must leave at least £1m for each remaining empty squad slot after this player.</p>
      <div class="bid-row">
        <label for="onlineBlindBidInput">
          Your bid
          <span class="bid-help">Budget left: £${myBudget}m • ${escapeHtml(reserveHelp)} • Skips left: ${mySkipsLeft}/${BID_SKIPS_ALLOWED}${mySkipsLeft <= 0 ? " • must bid above £0m" : ""}</span>
        </label>
        <input id="onlineBlindBidInput" type="number" min="0" max="${myMaxBid}" step="1" value="${escapeHtml(draftValue)}" />
      </div>
      <button id="submitBlindBidBtn" class="btn btn-primary" type="button">Submit blind bid</button>
    </div>
  ` : `
    <div class="bid-order-card">
      <p class="eyebrow">Your blind bid</p>
      <p class="muted">
        ${myBid?.submitted
          ? "Your bid has been submitted. Waiting for everyone else."
          : eligibleKeys.has(myKey)
            ? "Bidding is locked while results are being calculated."
            : "You are not eligible for this player because your team does not need this position, or you have no budget left."}
      </p>
    </div>
  `;
  els.bidInputs.innerHTML = submitBox + `<div class="bid-order-card"><p class="eyebrow">Submission status</p>${statusRows}</div>`;
  const bidInput = $("onlineBlindBidInput");
  if (bidInput) {
    bidInput.addEventListener("input", event => setBlindBidDraftV39(event.target.value));
    bidInput.addEventListener("change", event => setBlindBidDraftV39(event.target.value));
  }
  $("submitBlindBidBtn")?.addEventListener("click", safe(submitOnlineBlindBidV38));
}
async function submitOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();
  const me = currentOnlineUserV38();
  if (!me) throw new Error("You are not listed in this online game.");
  const eligible = eligibleBidUsersV38();
  const eligibleKeys = new Set(eligible.map(user => safeKey(user.name)));
  const myKey = safeKey(me.name);
  if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
  if (state.blindBids?.[myKey]?.submitted) return;
  const input = $("onlineBlindBidInput");
  const rawValue = input?.value ?? getBlindBidDraftV39("0");
  const rawBid = Number(rawValue || 0);
  const bid = Math.max(0, Math.floor(rawBid));
  if (!Number.isFinite(bid)) throw new Error("Enter a valid bid.");
  if (bid > Number(me.budget || 0)) throw new Error(`Your bid cannot exceed your remaining budget of £${me.budget}m.`);
  const maxBid = onlineMaxBidForCandidateV45(me, currentCandidate);
  const reserve = onlineMinimumReserveAfterWinV45(me, currentCandidate);
  if (bid > maxBid) {
    throw new Error(`Your maximum bid is £${maxBid}m because you must keep £${reserve}m for your remaining squad slot${reserve === 1 ? "" : "s"}.`);
  }
  if (bid <= 0 && onlineBidSkipsLeftV44(me) <= 0) throw new Error("You have used all 3 skips and must bid above £0m.");
  state.blindBids[myKey] = {
    name: me.name,
    bid,
    submitted: true,
    submittedAt: Date.now()
  };
  clearBlindBidDraftV39();
  const allSubmitted = eligible.every(user => state.blindBids?.[safeKey(user.name)]?.submitted);
  if (allSubmitted) {
    await resolveOnlineBlindBidV38();
  } else {
    renderOnlineBidControlsV38();
    await saveOnlineState(`${me.name} submitted a blind bid.`);
  }
}
async function resolveOnlineBlindBidV38() {
  if (!online.enabled || !state || state.gameMode !== "bid" || !currentCandidate) return;
  initialiseBlindBidStateV38();
  v29SafeState();
  state.bidSubmittingLocked = true;
  const candidate = v29NormalisePlayer(currentCandidate);
  const eligible = eligibleBidUsersV38(candidate);
  const bids = eligible.map(user => {
    const entry = state.blindBids?.[safeKey(user.name)] || { name: user.name, bid: 0, submitted: false };
    return {
      name: user.name,
      bid: Math.max(0, Math.floor(Number(entry.bid || 0))),
      budget: Number(user.budget || 0),
      maxBid: onlineMaxBidForCandidateV45(user, candidate)
    };
  });
  const zeroBidNames = [];
  bids.forEach(row => {
    if (row.bid <= 0) {
      const user = state.users.find(u => safeKey(u.name) === safeKey(row.name));
      if (user) {
        onlineIncrementSkipV44(user);
        zeroBidNames.push(user.name);
      }
    }
  });
  const invalidReserveNames = bids
    .filter(row => row.bid > 0 && row.bid > row.maxBid)
    .map(row => row.name);
  let validBids = bids.filter(row => row.bid > 0 && row.bid <= row.budget && row.bid <= row.maxBid);
  validBids.sort((a, b) => b.bid - a.bid || a.name.localeCompare(b.name));
  let winnerName = null;
  let winningBid = 0;
  let tie = false;
  if (validBids.length) {
    const highest = validBids[0].bid;
    const tied = validBids.filter(row => row.bid === highest);
    tie = tied.length > 1;
    const winnerRow = tied[Math.floor(Math.random() * tied.length)];
    winnerName = winnerRow.name;
    winningBid = winnerRow.bid;
    const winner = state.users.find(user => safeKey(user.name) === safeKey(winnerName));
    if (winner && candidate) {
      winner.team.push({ ...candidate, price: winningBid });
      winner.budget = Math.max(0, Number(winner.budget || 0) - winningBid);
      winner.spent = Number(winner.spent || 0) + winningBid;
      state.acceptedPlayerNames.add(candidate.player);
    }
  }
  state.bidOutcome = {
    player: candidate,
    bids,
    winnerName,
    winningBid,
    tie,
    zeroBidNames,
    invalidReserveNames,
    resolvedAt: Date.now()
  };
  currentCandidate = null;
  renderOnlineBidControlsV38();
  renderTeams();
  const zeroText = zeroBidNames.length ? ` ${zeroBidNames.join(", ")} ${zeroBidNames.length === 1 ? "loses" : "lose"} one skip.` : "";
  const reserveText = invalidReserveNames.length ? ` ${invalidReserveNames.join(", ")} had bids rejected for not leaving enough money to finish their team.` : "";
  await saveOnlineState(winnerName ? `${winnerName} won ${candidate.player} for £${winningBid}m.${zeroText}${reserveText}` : `${candidate.player} was skipped.${zeroText}${reserveText}`);
  if (isGameComplete()) {
    setTimeout(async () => {
      completeGame();
      render();
      await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
    }, 3500);
  } else {
    setTimeout(async () => {
      await drawOnlineBlindBidCandidateV38();
    }, 3500);
  }
}


// ----- Application startup wiring -----
function init() {
  injectEntryPanel();
  wireEvents();
  updateSetupForMode();
  loadPlayers();
}

init();

// --- step2 online bid mode selector and live auction ---
// Online bid mode now has two options:
// 1) Blind bidding - existing behaviour retained.
// 2) Live auction - visible highest bid, users can bid higher or pass/no.
// Live auction skip rule: before any first bid is made for a player, pressing No/Pass uses one of that user's 3 skips.
(function () {
  let selectedOnlineBidModeStep2 = "blind";

  const blindRenderOnlineBidControlsStep2 = renderOnlineBidControlsV38;
  const blindDrawOnlineBidCandidateStep2 = drawOnlineBlindBidCandidateV38;

  function userKeyStep2(userOrName) {
    return safeKey(typeof userOrName === "string" ? userOrName : userOrName?.name);
  }

  function getLiveAuctionStep2() {
    if (!state.liveAuction || typeof state.liveAuction !== "object" || Array.isArray(state.liveAuction)) {
      state.liveAuction = {};
    }
    if (!state.liveAuction.passedKeys || typeof state.liveAuction.passedKeys !== "object") {
      state.liveAuction.passedKeys = {};
    }
    if (!state.liveAuction.noFirstBidKeys || typeof state.liveAuction.noFirstBidKeys !== "object") {
      state.liveAuction.noFirstBidKeys = {};
    }
    state.liveAuction.highestKey = state.liveAuction.highestKey || "";
    state.liveAuction.highestName = state.liveAuction.highestName || "";
    state.liveAuction.highestBid = Number(state.liveAuction.highestBid || 0);
    state.liveAuction.outcome = state.liveAuction.outcome || null;
    return state.liveAuction;
  }

  function resetLiveAuctionStep2() {
    state.liveAuction = {
      passedKeys: {},
      noFirstBidKeys: {},
      highestKey: "",
      highestName: "",
      highestBid: 0,
      outcome: null,
      openedAt: Date.now()
    };
    return state.liveAuction;
  }

  function onlineLiveEligibleUsersStep2(candidate = currentCandidate) {
    if (!state || !candidate) return [];
    v29SafeState();
    return state.users.filter(user => {
      const maxBid = onlineMaxBidForCandidateV45(user, candidate);
      return getNeededPositions(user).includes(candidate.mainPosition) && maxBid > 0;
    });
  }

  function currentOnlineUserStep2() {
    if (!online.enabled || !state) return null;
    v29SafeState();
    return state.users.find(user => userKeyStep2(user) === safeKey(online.myName)) || null;
  }

  function liveAuctionAllDoneStep2(eligible, auction) {
    if (!eligible.length) return true;
    if (auction.highestBid > 0) {
      return eligible.every(user => {
        const key = userKeyStep2(user);
        return key === auction.highestKey || !!auction.passedKeys[key];
      });
    }
    return eligible.every(user => !!auction.passedKeys[userKeyStep2(user)]);
  }

  function livePassedNamesStep2(auction) {
    if (!state?.users) return [];
    return state.users
      .filter(user => auction.passedKeys?.[userKeyStep2(user)])
      .map(user => user.name);
  }

  function liveNoFirstBidNamesStep2(auction) {
    if (!state?.users) return [];
    return state.users
      .filter(user => auction.noFirstBidKeys?.[userKeyStep2(user)])
      .map(user => user.name);
  }

  function injectOnlineBidModeStylesStep2() {
    if ($("onlineBidModeStylesStep2")) return;
    const style = document.createElement("style");
    style.id = "onlineBidModeStylesStep2";
    style.textContent = `
      .online-bid-mode-step2 {
        margin: 12px 0 14px;
        padding: 12px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
      }
      .online-bid-mode-step2.hidden { display: none !important; }
      .online-bid-mode-title-step2 {
        margin: 0 0 8px;
        color: #0f172a;
        font-weight: 950;
      }
      .online-bid-mode-grid-step2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .online-bid-mode-card-step2 {
        border: 2px solid #e2e8f0;
        border-radius: 14px;
        background: #f8fafc;
        padding: 11px;
        cursor: pointer;
        text-align: left;
        color: #0f172a;
        font-weight: 950;
      }
      .online-bid-mode-card-step2 span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: .8rem;
        line-height: 1.25;
        font-weight: 750;
      }
      .online-bid-mode-card-step2.selected {
        border-color: #2563eb;
        background: #eff6ff;
        box-shadow: 0 10px 24px rgba(37,99,235,.12);
      }
      .live-auction-panel-step2 {
        display: grid;
        gap: 12px;
      }
      .live-auction-top-step2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 14px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 18px;
      }
      .live-auction-top-step2 h3 { margin: 2px 0 4px; }
      .live-highest-step2 {
        text-align: right;
        font-weight: 950;
        color: #1d4ed8;
        font-size: 1.2rem;
      }
      .live-auction-actions-step2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 10px;
        align-items: end;
      }
      .live-status-list-step2 {
        display: grid;
        gap: 8px;
      }
      .live-status-row-step2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 9px 10px;
      }
      .live-status-pill-step2 {
        border-radius: 999px;
        padding: 5px 9px;
        font-weight: 950;
        font-size: .82rem;
        white-space: nowrap;
        background: #e2e8f0;
        color: #334155;
      }
      .live-status-pill-step2.highest { background: #dbeafe; color: #1d4ed8; }
      .live-status-pill-step2.passed { background: #fee2e2; color: #991b1b; }
      .live-status-pill-step2.ready { background: #dcfce7; color: #166534; }
      @media (max-width: 720px) {
        .online-bid-mode-grid-step2,
        .live-auction-top-step2,
        .live-auction-actions-step2,
        .live-status-row-step2 {
          grid-template-columns: 1fr;
        }
        .live-highest-step2 { text-align: left; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectOnlineBidModeSelectorStep2() {
    injectOnlineBidModeStylesStep2();
    const lobbySetup = document.querySelector("#onlineLobbyPanel .lobby-setup");
    if (!lobbySetup || $("onlineBidModeSelectorStep2")) return;
    const holder = document.createElement("div");
    holder.id = "onlineBidModeSelectorStep2";
    holder.className = `online-bid-mode-step2 ${selectedGameMode === "bid" ? "" : "hidden"}`;
    holder.innerHTML = `
      <p class="online-bid-mode-title-step2">Online bidding style</p>
      <div class="online-bid-mode-grid-step2">
        <button type="button" class="online-bid-mode-card-step2 ${selectedOnlineBidModeStep2 === "blind" ? "selected" : ""}" data-online-bid-mode="blind">
          Blind bidding
          <span>Everyone submits privately, then bids are revealed together.</span>
        </button>
        <button type="button" class="online-bid-mode-card-step2 ${selectedOnlineBidModeStep2 === "live" ? "selected" : ""}" data-online-bid-mode="live">
          Live auction
          <span>Bids are visible. Users can bid higher or say no until a winner is left.</span>
        </button>
      </div>
    `;
    const exclude = $("lobbyExcludeDeclinesLabel");
    if (exclude && exclude.parentNode === lobbySetup) {
      lobbySetup.insertBefore(holder, exclude);
    } else {
      const start = $("startOnlineGameBtn");
      if (start && start.parentNode === lobbySetup) lobbySetup.insertBefore(holder, start);
      else lobbySetup.appendChild(holder);
    }
    holder.addEventListener("click", event => {
      const card = event.target.closest(".online-bid-mode-card-step2");
      if (!card) return;
      selectedOnlineBidModeStep2 = card.dataset.onlineBidMode === "live" ? "live" : "blind";
      holder.querySelectorAll(".online-bid-mode-card-step2").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.onlineBidMode === selectedOnlineBidModeStep2);
      });
    });
  }

  const originalShowLobbyStep2 = showLobby;
  showLobby = function (...args) {
    const result = originalShowLobbyStep2.apply(this, args);
    const mode = args[0];
    if (mode === "host") {
      injectOnlineBidModeSelectorStep2();
    }
    return result;
  };

  async function startOnlineGameFromLobbyStep2() {
    if (!online.enabled || !online.isHost || !online.ref) return;
    await ensurePlayersReady();
    const snapshot = await online.ref.child("participants").once("value");
    const names = participantNamesFromObject(snapshot.val());
    const minUsers = selectedGameMode === "bid" ? 2 : 1;
    if (names.length < minUsers) {
      throw new Error(selectedGameMode === "bid"
        ? "Bid mode needs at least 2 players."
        : "At least 1 player is needed.");
    }
    startNewGame(selectedGameMode, names.slice(0, 4), true);
    if (selectedGameMode === "bid") {
      state.onlineBidMode = selectedOnlineBidModeStep2 === "live" ? "live" : "blind";
      if (state.onlineBidMode === "live") {
        resetLiveAuctionStep2();
        await drawOnlineLiveBidCandidateStep2();
      } else {
        state.blindBids = {};
        state.bidOutcome = null;
        state.bidSubmittingLocked = false;
        await blindDrawOnlineBidCandidateStep2();
      }
    } else {
      await saveOnlineState("Online game started.");
    }
  }
  startOnlineGameFromLobby = startOnlineGameFromLobbyStep2;

  async function drawOnlineLiveBidCandidateStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid") return;
    await ensurePlayersReady();
    v29SafeState();
    state.onlineBidMode = "live";
    if (isGameComplete()) {
      completeGame();
      render();
      await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
      return;
    }
    const neededPositions = new Set();
    allOnlineBidUsersV38().forEach(user => getNeededPositions(user).forEach(pos => neededPositions.add(pos)));
    const accepted = state.acceptedPlayerNames instanceof Set ? state.acceptedPlayerNames : new Set();
    const pool = players.filter(p => neededPositions.has(p.mainPosition) && !accepted.has(p.player));
    if (!pool.length) {
      completeGame();
      render();
      await saveOnlineState("No more eligible players. Reveal ratings to see the winner.");
      return;
    }
    currentCandidate = pool[Math.floor(Math.random() * pool.length)];
    resetLiveAuctionStep2();
    renderCandidate(currentCandidate);
    renderOnlineLiveBidControlsStep2();
    setMessage(`Live auction open for ${currentCandidate.player}.`);
    await saveOnlineState(`Live auction open for ${currentCandidate.player}.`);
  }

  drawOnlineBlindBidCandidateV38 = async function () {
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      await drawOnlineLiveBidCandidateStep2();
      return;
    }
    await blindDrawOnlineBidCandidateStep2();
  };

  function renderOnlineLiveBidControlsStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live") return;
    const auction = getLiveAuctionStep2();
    show(els.draftControls, false);
    show(els.bidControls, true);
    show(els.declinesPill, false);
    show(els.budgetPill, false);
    if (els.bidPickBtn) els.bidPickBtn.classList.add("hidden");
    if (els.awardBidBtn) els.awardBidBtn.classList.add("hidden");
    if (els.skipBidBtn) els.skipBidBtn.classList.add("hidden");

    if (els.bidOrderDisplay) {
      els.bidOrderDisplay.innerHTML = `
        <div class="bid-status-summary">
          <strong>Live auction</strong>
          <span>${auction.highestBid > 0 ? `Highest bid: £${auction.highestBid}m by ${escapeHtml(auction.highestName)}` : "Waiting for the first bid"}</span>
        </div>
      `;
    }
    if (!els.bidInputs) return;

    if (!currentCandidate && isGameComplete()) {
      els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`;
      syncRevealButtonV37?.();
      return;
    }

    if (auction.outcome) {
      const noFirstNames = auction.outcome.noFirstBidNames || [];
      els.bidInputs.innerHTML = `
        <div class="bid-order-card">
          <p class="eyebrow">Auction result</p>
          <h3>${escapeHtml(auction.outcome.player?.player || "Player")}</h3>
          <p class="message">
            ${auction.outcome.type === "awarded"
              ? `${escapeHtml(auction.outcome.winnerName)} wins ${escapeHtml(auction.outcome.player?.player || "the player")} for £${auction.outcome.amount}m.`
              : `${escapeHtml(auction.outcome.player?.player || "The player")} was skipped.`}
          </p>
          ${noFirstNames.length ? `<p class="muted">${escapeHtml(noFirstNames.join(", "))} ${noFirstNames.length === 1 ? "loses" : "lose"} one skip for saying no before a first bid.</p>` : ""}
          <p class="muted">Next player loading...</p>
        </div>
      `;
      return;
    }

    if (!currentCandidate) {
      els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`;
      return;
    }

    const me = currentOnlineUserStep2();
    const myKey = safeKey(online.myName);
    const eligible = onlineLiveEligibleUsersStep2();
    const eligibleKeys = new Set(eligible.map(user => userKeyStep2(user)));
    const isEligible = eligibleKeys.has(myKey);
    const hasPassed = !!auction.passedKeys?.[myKey];
    const isHighest = auction.highestKey && auction.highestKey === myKey;
    const myBudget = Number(me?.budget || 0);
    const mySkipsLeft = onlineBidSkipsLeftV44(me);
    const myMaxBid = me ? onlineMaxBidForCandidateV45(me, currentCandidate) : 0;
    const minNextBid = Math.max(1, Number(auction.highestBid || 0) + 1);
    const canBid = !!me && isEligible && !hasPassed && !isHighest && myMaxBid >= minNextBid;
    const canPass = !!me && isEligible && !hasPassed && !isHighest && (auction.highestBid > 0 || mySkipsLeft > 0);

    const actionBox = canBid || canPass ? `
      <div class="bid-order-card live-auction-panel-step2">
        <div class="live-auction-top-step2">
          <div>
            <p class="eyebrow">Your action</p>
            <h3>${escapeHtml(currentCandidate.player)}</h3>
            <p class="muted">
              ${auction.highestBid > 0
                ? `Bid more than £${auction.highestBid}m or say no.`
                : `Make the first bid, or say no. Saying no before a first bid uses one skip.`}
            </p>
          </div>
          <div class="live-highest-step2">
            ${auction.highestBid > 0 ? `£${auction.highestBid}m<br><span class="muted">${escapeHtml(auction.highestName)}</span>` : "No bids yet"}
          </div>
        </div>
        <div class="live-auction-actions-step2">
          <div class="bid-row">
            <label for="onlineLiveBidInput">
              Your bid
              <span class="bid-help">Budget: £${myBudget}m • Max bid: £${myMaxBid}m • Skips left: ${mySkipsLeft}/${BID_SKIPS_ALLOWED}</span>
            </label>
            <input id="onlineLiveBidInput" type="number" min="${minNextBid}" max="${myMaxBid}" step="1" value="${Math.min(myMaxBid, minNextBid)}" ${canBid ? "" : "disabled"} />
          </div>
          <button id="submitLiveBidBtnStep2" class="btn btn-primary" type="button" ${canBid ? "" : "disabled"}>Bid</button>
          <button id="passLiveBidBtnStep2" class="btn btn-danger" type="button" ${canPass ? "" : "disabled"}>${auction.highestBid > 0 ? "No / Pass" : "No first bid"}</button>
        </div>
      </div>
    ` : `
      <div class="bid-order-card">
        <p class="eyebrow">Your action</p>
        <p class="muted">
          ${isHighest
            ? "You are currently the highest bidder. Waiting for the others to bid more or say no."
            : hasPassed
              ? "You have passed on this player. Waiting for the auction to finish."
              : isEligible
                ? "You cannot bid at the moment. You may have no valid budget left for this player, or you have no skips left before the first bid."
                : "You are not eligible for this player because your team does not need this position, or you have no available budget."}
        </p>
      </div>
    `;

    const statusRows = state.users.map(user => {
      const key = userKeyStep2(user);
      const userEligible = eligibleKeys.has(key);
      const userSkipsLeft = onlineBidSkipsLeftV44(user);
      const userMaxBid = currentCandidate ? onlineMaxBidForCandidateV45(user, currentCandidate) : 0;
      let status = "Not eligible";
      let cls = "";
      if (auction.highestKey === key) {
        status = `Highest £${auction.highestBid}m`;
        cls = "highest";
      } else if (auction.passedKeys?.[key]) {
        status = auction.noFirstBidKeys?.[key] ? "No first bid" : "Passed";
        cls = "passed";
      } else if (userEligible) {
        status = auction.highestBid > 0 ? "Can bid or pass" : (userSkipsLeft > 0 ? "Can first bid or no" : "Must first bid");
        cls = "ready";
      }
      return `
        <div class="live-status-row-step2">
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <div class="bid-help">Budget: £${Number(user.budget || 0)}m • Max: £${userMaxBid}m • Skips left: ${userSkipsLeft}/${BID_SKIPS_ALLOWED}</div>
          </div>
          <span class="live-status-pill-step2 ${cls}">${escapeHtml(status)}</span>
        </div>
      `;
    }).join("");

    els.bidInputs.innerHTML = actionBox + `<div class="bid-order-card"><p class="eyebrow">Auction status</p><div class="live-status-list-step2">${statusRows}</div></div>`;
    $("submitLiveBidBtnStep2")?.addEventListener("click", safe(submitOnlineLiveBidStep2));
    $("passLiveBidBtnStep2")?.addEventListener("click", safe(passOnlineLiveBidStep2));
  }

  async function submitOnlineLiveBidStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live" || !currentCandidate) return;
    v29SafeState();
    const auction = getLiveAuctionStep2();
    const me = currentOnlineUserStep2();
    if (!me) throw new Error("You are not listed in this online game.");
    const myKey = userKeyStep2(me);
    const eligibleKeys = new Set(onlineLiveEligibleUsersStep2().map(user => userKeyStep2(user)));
    if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible to bid for this player.");
    if (auction.passedKeys?.[myKey]) throw new Error("You have already passed on this player.");
    if (auction.highestKey === myKey) throw new Error("You are already the highest bidder.");
    const input = $("onlineLiveBidInput");
    const bid = Math.max(0, Math.floor(Number(input?.value || 0)));
    const minBid = Math.max(1, Number(auction.highestBid || 0) + 1);
    const maxBid = onlineMaxBidForCandidateV45(me, currentCandidate);
    if (!Number.isFinite(bid) || bid < minBid) throw new Error(`Your bid must be at least £${minBid}m.`);
    if (bid > maxBid) throw new Error(`Your maximum bid is £${maxBid}m because you must keep enough money to finish your team.`);
    auction.highestKey = myKey;
    auction.highestName = me.name;
    auction.highestBid = bid;
    renderOnlineLiveBidControlsStep2();
    await saveOnlineState(`${me.name} bid £${bid}m for ${currentCandidate.player}.`);
    await maybeResolveOnlineLiveAuctionStep2();
  }

  async function passOnlineLiveBidStep2() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live" || !currentCandidate) return;
    v29SafeState();
    const auction = getLiveAuctionStep2();
    const me = currentOnlineUserStep2();
    if (!me) throw new Error("You are not listed in this online game.");
    const myKey = userKeyStep2(me);
    const eligibleKeys = new Set(onlineLiveEligibleUsersStep2().map(user => userKeyStep2(user)));
    if (!eligibleKeys.has(myKey)) throw new Error("You are not eligible for this player.");
    if (auction.highestKey === myKey) throw new Error("You are currently winning. Wait for someone else to bid more or pass.");
    if (auction.passedKeys?.[myKey]) return;
    if (auction.highestBid <= 0) {
      if (onlineBidSkipsLeftV44(me) <= 0) {
        throw new Error("You have used all 3 skips and must make the first bid above £0m.");
      }
      me.bidSkips = Math.min(BID_SKIPS_ALLOWED, Number(me.bidSkips || 0) + 1);
      auction.noFirstBidKeys[myKey] = true;
    }
    auction.passedKeys[myKey] = true;
    renderOnlineLiveBidControlsStep2();
    await saveOnlineState(auction.highestBid > 0 ? `${me.name} passed on ${currentCandidate.player}.` : `${me.name} said no before a first bid and used one skip.`);
    await maybeResolveOnlineLiveAuctionStep2();
  }

  async function maybeResolveOnlineLiveAuctionStep2() {
    if (!state || state.onlineBidMode !== "live" || !currentCandidate) return;
    const auction = getLiveAuctionStep2();
    const eligible = onlineLiveEligibleUsersStep2();
    if (!liveAuctionAllDoneStep2(eligible, auction)) return;
    const candidate = v29NormalisePlayer(currentCandidate);
    if (!candidate) return;
    const noFirstBidNames = liveNoFirstBidNamesStep2(auction);
    if (auction.highestBid > 0 && auction.highestKey) {
      const winner = state.users.find(user => userKeyStep2(user) === auction.highestKey);
      if (winner) {
        winner.team.push({ ...candidate, price: auction.highestBid });
        winner.budget = Math.max(0, Number(winner.budget || 0) - auction.highestBid);
        winner.spent = Number(winner.spent || 0) + auction.highestBid;
        state.acceptedPlayerNames.add(candidate.player);
      }
      auction.outcome = {
        type: "awarded",
        player: candidate,
        winnerName: winner?.name || auction.highestName,
        amount: auction.highestBid,
        passedNames: livePassedNamesStep2(auction),
        noFirstBidNames,
        resolvedAt: Date.now()
      };
      currentCandidate = null;
      renderOnlineLiveBidControlsStep2();
      renderTeams();
      await saveOnlineState(`${auction.outcome.winnerName} won ${candidate.player} for £${auction.highestBid}m.`);
    } else {
      auction.outcome = {
        type: "skipped",
        player: candidate,
        passedNames: livePassedNamesStep2(auction),
        noFirstBidNames,
        resolvedAt: Date.now()
      };
      currentCandidate = null;
      renderOnlineLiveBidControlsStep2();
      renderTeams();
      await saveOnlineState(`${candidate.player} was skipped.`);
    }

    if (isGameComplete()) {
      setTimeout(async () => {
        completeGame();
        render();
        await saveOnlineState("Bidding complete. Reveal ratings to see the winner.");
      }, 3000);
    } else {
      setTimeout(async () => {
        await drawOnlineLiveBidCandidateStep2();
      }, 3000);
    }
  }

  renderOnlineBidControlsV38 = function () {
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      renderOnlineLiveBidControlsStep2();
      return;
    }
    blindRenderOnlineBidControlsStep2();
  };

  const originalRenderStep2 = render;
  render = function (...args) {
    const result = originalRenderStep2.apply(this, args);
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      renderOnlineLiveBidControlsStep2();
    }
    return result;
  };

  const originalApplyRemoteDataStep2 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = originalApplyRemoteDataStep2.apply(this, args);
    if (online.enabled && state?.gameMode === "bid" && state?.onlineBidMode === "live") {
      renderOnlineLiveBidControlsStep2();
    }
    return result;
  };
})();

// --- step3 reset button available after mode selection ---
// Reset button behaviour:
// - Hidden only on the very first front page.
// - Shown after choosing Local setup.
// - Shown in online room/lobby screens.
// - Shown throughout local and online games/results.
(function () {
  function hideResetButtonStep3() {
    if (els?.resetBtn) els.resetBtn.style.display = "none";
  }

  function showResetButtonStep3() {
    if (els?.resetBtn) els.resetBtn.style.display = "";
  }

  document.addEventListener('click', function (event) {
    if (event.target?.closest?.('#startLocalGameBtn')) {
      setTimeout(showResetButtonStep3, 0);
    }
    if (event.target?.closest?.('#createOnlineRoomBtn, #joinOnlineRoomBtn')) {
      setTimeout(showResetButtonStep3, 0);
    }
  }, true);

  const previousShowLobbyStep3 = showLobby;
  showLobby = function (...args) {
    const result = previousShowLobbyStep3.apply(this, args);
    showResetButtonStep3();
    return result;
  };

  const previousStartNewGameStep3 = startNewGame;
  startNewGame = function (...args) {
    const result = previousStartNewGameStep3.apply(this, args);
    showResetButtonStep3();
    return result;
  };

  const previousRenderStep3 = render;
  render = function (...args) {
    const result = previousRenderStep3.apply(this, args);
    if (state) showResetButtonStep3();
    return result;
  };

  const previousApplyRemoteDataStep3 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep3.apply(this, args);
    if (state || online.enabled) showResetButtonStep3();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === 'function') {
    const previousShowFinishedResultsPageStep3 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = previousShowFinishedResultsPageStep3.apply(this, args);
      showResetButtonStep3();
      return result;
    };
  }

  const previousResetGameStep3 = resetGame;
  resetGame = function (...args) {
    window.challengePreset = "standard";
    const result = previousResetGameStep3.apply(this, args);
    hideResetButtonStep3();
    return result;
  };

  if (!state) hideResetButtonStep3();
})();

// --- step4 year range slicer for player pool ---
// Adds a dynamic year-range slicer before every game starts.
// The selected range is locked into state.yearRange at game start and all random-player pools use it.
(function () {
  let selectedYearRangeStep4 = null;

  function availableYearsStep4() {
    const rows = Array.isArray(players) && players.length ? players : samplePlayers.map((p, i) => v29NormalisePlayer(p, i)).filter(Boolean);
    const years = [...new Set(rows.map(p => Number(p.year || p.Game_Year || 0)).filter(Boolean))].sort((a, b) => a - b);
    return years.length ? years : [2005, 2026];
  }

  function clampYearRangeStep4(start, end) {
    const years = availableYearsStep4();
    const min = years[0] || 2005;
    const max = years[years.length - 1] || 2026;
    let a = Number(start ?? min);
    let b = Number(end ?? max);
    if (!Number.isFinite(a)) a = min;
    if (!Number.isFinite(b)) b = max;
    a = Math.max(min, Math.min(max, Math.round(a)));
    b = Math.max(min, Math.min(max, Math.round(b)));
    if (a > b) [a, b] = [b, a];
    return { start: a, end: b, min, max };
  }

  function currentYearRangeStep4() {
    return selectedYearRangeStep4 || clampYearRangeStep4();
  }

  function getYearRangeFromInputsStep4(prefix) {
    return clampYearRangeStep4($(`${prefix}YearStartStep4`)?.value, $(`${prefix}YearEndStep4`)?.value);
  }

  function filteredPlayersForRangeStep4(range = state?.yearRange || currentYearRangeStep4()) {
    const r = clampYearRangeStep4(range.start, range.end);
    return (Array.isArray(players) ? players : []).filter(p => Number(p.year || 0) >= r.start && Number(p.year || 0) <= r.end);
  }

  function filteredCountTextStep4(range) {
    const count = filteredPlayersForRangeStep4(range).length;
    
  }

  function setSliderVisualStep4(prefix, range) {
    const fill = $(`${prefix}YearFillStep4`);
    if (!fill) return;
    const total = Math.max(1, range.max - range.min);
    const left = ((range.start - range.min) / total) * 100;
    const right = 100 - ((range.end - range.min) / total) * 100;
    fill.style.left = `${left}%`;
    fill.style.right = `${right}%`;
  }

  function updateYearSliderLabelsStep4(prefix, range) {
    const label = $(`${prefix}YearLabelStep4`);
    const count = $(`${prefix}YearCountStep4`);
    const start = $(`${prefix}YearStartValueStep4`);
    const end = $(`${prefix}YearEndValueStep4`);
    if (label) label.textContent = `${range.start} - ${range.end}`;
    if (count) count.textContent = filteredCountTextStep4(range);
    if (start) start.textContent = String(range.start);
    if (end) end.textContent = String(range.end);
    setSliderVisualStep4(prefix, range);
  }

  function yearSlicerHtmlStep4(prefix, title = "Player year range") {
    const r = currentYearRangeStep4();
    return `
      <div id="${prefix}YearSlicerStep4" class="year-slicer-step4">
        <div class="year-slicer-head-step4">
          <div>
            <label>${escapeHtml(title)}</label>
            <p class="muted year-slicer-help-step4">Choose the years which you want the players to be included from.</p>
          </div>
          <div class="year-slicer-summary-step4">
            <strong id="${prefix}YearLabelStep4">${r.start} - ${r.end}</strong>
            <span id="${prefix}YearCountStep4">${filteredCountTextStep4(r)}</span>
          </div>
        </div>
        <div class="year-slicer-values-step4">
          <span>From <strong id="${prefix}YearStartValueStep4">${r.start}</strong></span>
          <span>To <strong id="${prefix}YearEndValueStep4">${r.end}</strong></span>
        </div>
        <div class="year-slider-shell-step4">
          <div class="year-track-step4"></div>
          <div id="${prefix}YearFillStep4" class="year-fill-step4"></div>
          <input id="${prefix}YearStartStep4" class="year-range-step4" type="range" min="${r.min}" max="${r.max}" step="1" value="${r.start}" aria-label="Start year" />
          <input id="${prefix}YearEndStep4" class="year-range-step4" type="range" min="${r.min}" max="${r.max}" step="1" value="${r.end}" aria-label="End year" />
        </div>
      </div>
    `;
  }

  function wireYearSlicerStep4(prefix) {
    const start = $(`${prefix}YearStartStep4`);
    const end = $(`${prefix}YearEndStep4`);
    if (!start || !end) return;

    const apply = () => {
      const range = getYearRangeFromInputsStep4(prefix);
      selectedYearRangeStep4 = range;
      start.value = String(range.start);
      end.value = String(range.end);
      updateYearSliderLabelsStep4(prefix, range);
    };

    start.addEventListener("input", apply);
    end.addEventListener("input", apply);
    start.addEventListener("change", apply);
    end.addEventListener("change", apply);
    apply();
  }

  function injectYearSlicerStylesStep4() {
    if ($("yearSlicerStylesStep4")) return;
    const style = document.createElement("style");
    style.id = "yearSlicerStylesStep4";
    style.textContent = `
      .year-slicer-step4 {
        margin: 14px 0;
        padding: 15px;
        border: 1px solid #dbeafe;
        border-radius: 20px;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);
        box-shadow: 0 10px 28px rgba(15,23,42,.08);
      }
      .year-slicer-head-step4 {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        flex-wrap: wrap;
      }
      .year-slicer-head-step4 label {
        margin: 0;
        color: #0f172a;
        font-weight: 950;
      }
      .year-slicer-help-step4 {
        margin: 4px 0 0;
        font-size: .86rem;
      }
      .year-slicer-summary-step4 {
        display: grid;
        gap: 2px;
        text-align: right;
      }
      .year-slicer-summary-step4 strong {
        color: #1d4ed8;
        font-size: 1.08rem;
        font-weight: 950;
      }
      .year-slicer-summary-step4 span {
        color: #64748b;
        font-size: .82rem;
        font-weight: 850;
      }
      .year-slicer-values-step4 {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 12px 0 8px;
        color: #334155;
        font-weight: 850;
      }
      .year-slider-shell-step4 {
        position: relative;
        height: 36px;
      }
      .year-track-step4,
      .year-fill-step4 {
        position: absolute;
        left: 0;
        right: 0;
        top: 16px;
        height: 7px;
        border-radius: 999px;
      }
      .year-track-step4 { background: #cbd5e1; }
      .year-fill-step4 { background: linear-gradient(90deg, #22c55e, #2563eb); }
      .year-range-step4 {
        position: absolute;
        left: 0;
        top: 6px;
        width: 100%;
        height: 26px;
        background: transparent;
        pointer-events: none;
        appearance: none;
        -webkit-appearance: none;
      }
      .year-range-step4::-webkit-slider-thumb {
        pointer-events: auto;
        appearance: none;
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #ffffff;
        border: 3px solid #2563eb;
        box-shadow: 0 4px 12px rgba(15,23,42,.24);
        cursor: pointer;
      }
      .year-range-step4::-moz-range-thumb {
        pointer-events: auto;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ffffff;
        border: 3px solid #2563eb;
        box-shadow: 0 4px 12px rgba(15,23,42,.24);
        cursor: pointer;
      }
      @media (max-width: 720px) {
        .year-slicer-summary-step4 { text-align: left; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectLocalYearSlicerStep4() {
    injectYearSlicerStylesStep4();
    const panel = document.querySelector(".setup-panel-card");
    if (!panel) return;
    let holder = $("localYearSlicerHolderStep4");
    if (!holder) {
      holder = document.createElement("div");
      holder.id = "localYearSlicerHolderStep4";
      const before = els.userNameFields || els.excludeDeclinesLabel || els.startBtn;
      if (before && before.parentNode === panel) panel.insertBefore(holder, before);
      else panel.appendChild(holder);
    }
    holder.innerHTML = yearSlicerHtmlStep4("local", "Player year range");
    wireYearSlicerStep4("local");
  }

  function injectOnlineYearSlicerStep4() {
    injectYearSlicerStylesStep4();
    const lobbySetup = document.querySelector("#onlineLobbyPanel .lobby-setup");
    if (!lobbySetup) return;
    let holder = $("onlineYearSlicerHolderStep4");
    if (!holder) {
      holder = document.createElement("div");
      holder.id = "onlineYearSlicerHolderStep4";
      const bidSelector = $("onlineBidModeSelectorStep2");
      const startButton = $("startOnlineGameBtn");
      if (bidSelector && bidSelector.parentNode === lobbySetup) lobbySetup.insertBefore(holder, bidSelector);
      else if (startButton && startButton.parentNode === lobbySetup) lobbySetup.insertBefore(holder, startButton);
      else lobbySetup.appendChild(holder);
    }
    holder.innerHTML = yearSlicerHtmlStep4("online", "Player year range");
    wireYearSlicerStep4("online");
  }

  const previousLoadPlayersStep4 = loadPlayers;
  loadPlayers = async function (...args) {
    const result = await previousLoadPlayersStep4.apply(this, args);
    selectedYearRangeStep4 = selectedYearRangeStep4 || clampYearRangeStep4();
    if (!state) {
      injectLocalYearSlicerStep4();
      if (online.enabled && online.isHost) injectOnlineYearSlicerStep4();
    }
    return result;
  };

  const previousUpdateSetupForModeStep4 = updateSetupForMode;
  updateSetupForMode = function (...args) {
    const result = previousUpdateSetupForModeStep4.apply(this, args);
    if (!state) injectLocalYearSlicerStep4();
    return result;
  };

  const previousShowLobbyStep4 = showLobby;
  showLobby = function (...args) {
    const result = previousShowLobbyStep4.apply(this, args);
    const mode = args[0];
    if (mode === "host") injectOnlineYearSlicerStep4();
    return result;
  };

  function lockRangeBeforeStartStep4(isOnlineGame) {
    const range = isOnlineGame ? getYearRangeFromInputsStep4("online") : getYearRangeFromInputsStep4("local");
    selectedYearRangeStep4 = range;
    return { start: range.start, end: range.end };
  }

  const previousStartNewGameStep4 = startNewGame;
  startNewGame = function (gameMode, names, isOnlineGame) {
    const lockedRange = lockRangeBeforeStartStep4(isOnlineGame);
    const result = previousStartNewGameStep4(gameMode, names, isOnlineGame);
    if (state) state.yearRange = lockedRange;
    return result;
  };

  function withFilteredPlayersStep4(fn) {
    const originalPlayers = players;
    if (state?.yearRange) {
      const filtered = filteredPlayersForRangeStep4(state.yearRange);
      players = filtered.length ? filtered : [];
    }
    try {
      return fn();
    } finally {
      players = originalPlayers;
    }
  }

  const previousPickRandomPlayerStep4 = pickRandomPlayer;
  pickRandomPlayer = async function (...args) {
    return await withFilteredPlayersStep4(() => previousPickRandomPlayerStep4.apply(this, args));
  };

  const previousOnlineDrawCandidateStep4 = typeof onlineDrawCandidateForCurrentTurnV32 === "function" ? onlineDrawCandidateForCurrentTurnV32 : null;
  if (previousOnlineDrawCandidateStep4) {
    onlineDrawCandidateForCurrentTurnV32 = function (...args) {
      return withFilteredPlayersStep4(() => previousOnlineDrawCandidateStep4.apply(this, args));
    };
  }

  const previousBidRandomPlayerStep4 = bidRandomPlayer;
  bidRandomPlayer = async function (...args) {
    return await withFilteredPlayersStep4(() => previousBidRandomPlayerStep4.apply(this, args));
  };

  const previousDrawOnlineBlindBidCandidateStep4 = drawOnlineBlindBidCandidateV38;
  drawOnlineBlindBidCandidateV38 = async function (...args) {
    return await withFilteredPlayersStep4(() => previousDrawOnlineBlindBidCandidateStep4.apply(this, args));
  };

  const previousRenderCandidateStep4 = renderCandidate;
  renderCandidate = function (p) {
    previousRenderCandidateStep4(p);
    const r = state?.yearRange;
    if (r && els.candidateCard && p?.year) {
      const note = document.createElement("p");
      note.className = "muted";
      note.style.marginTop = "8px";
      note.textContent = `Pool: ${r.start} - ${r.end}`;
      els.candidateCard.appendChild(note);
    }
  };

  const previousSerialiseStateStep4 = serialiseState;
  serialiseState = function (...args) {
    const raw = previousSerialiseStateStep4.apply(this, args);
    if (raw && state?.yearRange) raw.yearRange = { start: state.yearRange.start, end: state.yearRange.end };
    return raw;
  };

  const previousRestoreStateStep4 = restoreState;
  restoreState = function (...args) {
    const restored = previousRestoreStateStep4.apply(this, args);
    if (restored?.yearRange) restored.yearRange = { start: Number(restored.yearRange.start), end: Number(restored.yearRange.end) };
    return restored;
  };

  const previousResetGameStep4 = resetGame;
  resetGame = function (...args) {
    const result = previousResetGameStep4.apply(this, args);
    selectedYearRangeStep4 = clampYearRangeStep4();
    setTimeout(() => {
      injectLocalYearSlicerStep4();
    }, 0);
    return result;
  };

  ensurePlayersReady().then(() => {
    selectedYearRangeStep4 = selectedYearRangeStep4 || clampYearRangeStep4();
    if (!state) injectLocalYearSlicerStep4();
  });
})();

// --- step5 async-safe year range filtering fix ---
// Fixes Step 4 issue where the slicer UI worked but async random-pick functions could see the full player list.
// This version filters through helper functions and async-safe wrappers so local/online pools respect state.yearRange.
(function () {
  function activeYearRangeStep5() {
    if (state?.yearRange) return state.yearRange;
    return null;
  }

  function playerInActiveYearRangeStep5(player) {
    const range = activeYearRangeStep5();
    if (!range) return true;
    const year = Number(player?.year || player?.Game_Year || 0);
    return year >= Number(range.start) && year <= Number(range.end);
  }

  function filteredPlayersStep5() {

    const filtered =
        (Array.isArray(players) ? players : [])
            .filter(playerInActiveYearRangeStep5);

    // Ultimate Solo Mode = all players
    if (window.challengePreset === "ultimate") {
        return filtered;
    }

    // Easy Solo Challenge
    // Top 5 rated players per position per year
    if (window.challengePreset === "easy") {

        const grouped = {};

        filtered.forEach(player => {

            const key =
                `${player.year}_${player.mainPosition}`;

            if (!grouped[key]) {
                grouped[key] = [];
            }

            grouped[key].push(player);

        });

        if (window.challengePreset === "easy") {

    const grouped = {};

    filtered.forEach(player => {

        const key =
            `${player.year}_${player.mainPosition}`;

        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push(player);

    });

    return Object.entries(grouped)
        .flatMap(([key, group]) => {

            const position =
                key.split("_")[1];

            const limit =
                position === "MID" ? 10 : 5;

            return group
                .sort((a, b) => b.rating - a.rating)
                .slice(0, limit);

        });
}
    }

    // Standard Solo Challenge
    return filtered;
}

  async function withFilteredPlayersAsyncStep5(fn) {
    const originalPlayers = players;
    if (state?.yearRange) {
      players = filteredPlayersStep5();
    }
    try {
      return await fn();
    } finally {
      players = originalPlayers;
    }
  }

  // Re-wrap the key async functions. These wrappers are intentionally placed after Step 4,
  // so they override the earlier non-async-safe wrappers.
  const previousPickRandomPlayerStep5 = pickRandomPlayer;
  pickRandomPlayer = async function (...args) {
    return await withFilteredPlayersAsyncStep5(() => previousPickRandomPlayerStep5.apply(this, args));
  };

  if (typeof onlineDrawCandidateForCurrentTurnV32 === "function") {
    const previousOnlineDrawCandidateStep5 = onlineDrawCandidateForCurrentTurnV32;
    onlineDrawCandidateForCurrentTurnV32 = function (...args) {
      const originalPlayers = players;
      if (state?.yearRange) players = filteredPlayersStep5();
      try {
        return previousOnlineDrawCandidateStep5.apply(this, args);
      } finally {
        players = originalPlayers;
      }
    };
  }

  const previousBidRandomPlayerStep5 = bidRandomPlayer;
  bidRandomPlayer = async function (...args) {
    return await withFilteredPlayersAsyncStep5(() => previousBidRandomPlayerStep5.apply(this, args));
  };

  const previousDrawOnlineBlindBidCandidateStep5 = drawOnlineBlindBidCandidateV38;
  drawOnlineBlindBidCandidateV38 = async function (...args) {
    return await withFilteredPlayersAsyncStep5(() => previousDrawOnlineBlindBidCandidateStep5.apply(this, args));
  };

  // If Step 2 live auction is present, it ultimately calls drawOnlineBlindBidCandidateV38 in some flows.
  // This helper also gives a direct, reliable filtered pool function for any later candidate draw code.
  window.getUltimate5AsideFilteredPlayersForCurrentGame = filteredPlayersStep5;

  // Add a small visible status in-game so it is obvious which pool is active.
  const previousRenderStep5 = render;
  render = function (...args) {
    const result = previousRenderStep5.apply(this, args);
    const range = state?.yearRange;
    if (range && els?.message) {
      let pill = document.getElementById("activeYearRangePillStep5");
      if (!pill) {
        pill = document.createElement("div");
        pill.id = "activeYearRangePillStep5";
        pill.className = "turn-lock-note";
        pill.style.background = "#eff6ff";
        pill.style.borderColor = "#bfdbfe";
        pill.style.color = "#1e3a8a";
        els.message.insertAdjacentElement("afterend", pill);
      }
      const count = filteredPlayersStep5().length;
      pill.textContent = `Active player pool: ${range.start} - ${range.end} (${count} players)`;
    }
    return result;
  };

  const previousResetGameStep5 = resetGame;
  resetGame = function (...args) {
    const result = previousResetGameStep5.apply(this, args);
    const pill = document.getElementById("activeYearRangePillStep5");
    if (pill) pill.remove();
    return result;
  };
})();

// --- step6 rebind first randomise buttons to filtered handlers ---
// Fixes the remaining first-pick issue.
// Reason: the original Pick player / Randomise player click listeners were wired during init()
// before the year-filter override functions were appended. The first click could therefore use
// the old unfiltered handler, while later auto-picks used the new filtered handler.
(function () {
  function bindFilteredClickStep6(button, handler) {
    if (!button || button.dataset.step6FilteredBound === "1") return;
    button.dataset.step6FilteredBound = "1";
    button.addEventListener("click", function (event) {
      // Capture phase: stop the original init-time listener and call the current filtered handler instead.
      event.preventDefault();
      event.stopImmediatePropagation();
      safe(handler)();
    }, true);
  }

  bindFilteredClickStep6(els.pickBtn, function () {
    return pickRandomPlayer();
  });

  bindFilteredClickStep6(els.bidPickBtn, function () {
    return bidRandomPlayer();
  });
})();

// --- step7 solo challenge local mode only ---
// Local play is now a single-player Solo Challenge only.
// Local bidding and local multi-user setup are removed from the UI/flow.
// Online modes are deliberately left unchanged: online draft, blind bidding and live auction remain available.
(function () {
  function injectSoloChallengeStylesStep7() {
    if ($("soloChallengeStylesStep7")) return;
    const style = document.createElement("style");
    style.id = "soloChallengeStylesStep7";
    style.textContent = `
      .solo-local-hidden-step7 { display: none !important; }
      .solo-setup-card-step7 {
        margin: 12px 0 14px;
        padding: 14px;
        background: linear-gradient(135deg, #ecfdf5, #eff6ff);
        border: 1px solid #bfdbfe;
        border-radius: 18px;
      }
      .solo-setup-card-step7 h3 {
        margin: 0 0 6px;
        color: #0f172a;
        font-size: 1.15rem;
      }
      .solo-setup-card-step7 p {
        margin: 0;
        color: #475569;
        font-weight: 800;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);
  }

  function adjustEntryPanelToSoloStep7() {
    injectSoloChallengeStylesStep7();
    const localCard = document.querySelector(".local-card");
    if (!localCard) return;
    const heading = localCard.querySelector("h3");
    const copy = localCard.querySelector("p");
    const button = $("startLocalGameBtn");
    if (heading)
    heading.textContent =
    "Solo Challenge";

    if (button)
    button.textContent =
    "Set up Solo Challenge";
    if (copy) copy.textContent = "Play a quick single-player draft on this device. Pick, accept or decline players and build your best 5-a-side team.";
  }

  function configureSoloSetupStep7() {
    injectSoloChallengeStylesStep7();
    selectedGameMode = "draft";

    const heroEyebrow = document.querySelector("#setupPanel .setup-copy .eyebrow");
    const heroTitle = document.querySelector("#setupPanel .setup-copy h2");
    const heroLead = document.querySelector("#setupPanel .setup-copy .setup-lead");
    if (window.challengePreset === "ultimate") {

    if (heroEyebrow)
        heroEyebrow.textContent =
            "⭐ Ultimate Solo Mode";

    if (heroTitle)
        heroTitle.textContent =
            "Ultimate Solo Mode";

    if (heroLead)
        heroLead.textContent =
            "Full player database unlocked. Every year is included, and the year range filter is ignored.";

    if (els.startBtn)
        els.startBtn.textContent =
            "Start Ultimate Solo Mode";

    setTimeout(() => {

    const yearCard =
        document.getElementById("localYearSlicerHolderStep4");

    const sliders =
        document.querySelectorAll('input[id*="Year"][type="range"]');

    if (yearCard) {
        yearCard.style.opacity = "0.4";
        yearCard.style.pointerEvents = "none";
    }

    sliders.forEach(slider => {
        slider.disabled = true;
    });

    const label =
        document.querySelector("#localYearSlicerHolderStep4 label");

    if (label) {
        label.textContent =
            "Player pool locked to all years";
    }

    const values =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-values-step4");

    if (values) {
        values.innerHTML =
            "<span style='width:100%;text-align:center;'>All years active</span>";
    }

    const help =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-help-step4");

    if (help) {
        help.textContent =
            "";
    }

    const soloIntro =
    document.getElementById("soloSetupIntroStep7");

    if (soloIntro) {
        soloIntro.style.display = "none";
    }

}, 0);

} else if (window.challengePreset === "easy") {

    if (heroEyebrow)
        heroEyebrow.textContent =
            "🎯 Easy Solo Challenge";

    if (heroTitle)
        heroTitle.textContent =
            "Easy Solo Challenge";

    if (heroLead)
        heroLead.textContent =
            "Only the elite players are available. Choose a year range and build your dream team.";

    if (els.startBtn)
        els.startBtn.textContent =
            "Start Easy Solo Challenge";

    setTimeout(() => {

    const yearCard =
        document.getElementById("localYearSlicerHolderStep4");

    const sliders =
        document.querySelectorAll('input[id*="Year"][type="range"]');

    if (yearCard) {
        yearCard.style.opacity = "";
        yearCard.style.pointerEvents = "";
    }

    sliders.forEach(slider => {
        slider.disabled = false;
    });

    const values =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-values-step4");

    if (values) {
        values.innerHTML = `
            <span>From <strong id="localYearStartValueStep4">2005</strong></span>
            <span>To <strong id="localYearEndValueStep4">2026</strong></span>
        `;
    }

    const soloIntro =
    document.getElementById("soloSetupIntroStep7");

    if (soloIntro) {
        soloIntro.style.display = "";
    }

}, 0);

} else {

    if (heroEyebrow)
        heroEyebrow.textContent =
            "Solo Challenge";

    if (heroTitle)
        heroTitle.textContent =
            "Choose your 5-a-side challenge";

    if (heroLead)
        heroLead.textContent =
            "Pick a game mode, add your players, then build the strongest five-a-side team from the top-rated players across the years.";

    if (els.startBtn)
        els.startBtn.textContent =
            "Start Solo Challenge";

    setTimeout(() => {

    const yearCard =
        document.getElementById("localYearSlicerHolderStep4");

    const sliders =
        document.querySelectorAll('input[id*="Year"][type="range"]');

    if (yearCard) {
        yearCard.style.opacity = "";
        yearCard.style.pointerEvents = "";
    }

    sliders.forEach(slider => {
        slider.disabled = false;
    });

    const values =
    document.querySelector("#localYearSlicerHolderStep4 .year-slicer-values-step4");

    if (values) {
        values.innerHTML = `
            <span>From <strong id="localYearStartValueStep4">2005</strong></span>
            <span>To <strong id="localYearEndValueStep4">2026</strong></span>
        `;
    }

    const soloIntro =
    document.getElementById("soloSetupIntroStep7");

    if (soloIntro) {
        soloIntro.style.display = "";
    }

}, 0);

}


    const setupPanelCard = document.querySelector(".setup-panel-card");
    if (setupPanelCard) {
      let soloIntro = $("soloSetupIntroStep7");
      if (!soloIntro) {
        soloIntro = document.createElement("div");
        soloIntro.id = "soloSetupIntroStep7";
        soloIntro.className = "solo-setup-card-step7";
        const firstLabel = setupPanelCard.querySelector("label");
        if (firstLabel) setupPanelCard.insertBefore(soloIntro, firstLabel);
        else setupPanelCard.prepend(soloIntro);
      }
      if (window.challengePreset === "ultimate") {

  soloIntro.innerHTML = `
    <h3>Ultimate Solo Mode</h3>
    <p>Full player database unlocked. All years are included and the year range filter is ignored.</p>
  `;

} else if (window.challengePreset === "easy") {

  soloIntro.innerHTML = `
    <h3>Easy Solo Challenge</h3>
    <p>Elite player pool. Choose a year range and build your dream 5-a-side team.</p>
  `;

} else {

  soloIntro.innerHTML = `
    <h3>Solo Challenge</h3>
    <p>Single-player draft mode. Complete a GK, DEF, MID, MID and FWD, then reveal your final rating.</p>
  `;

}
    }

    // Hide local-only multi-user / local-bidding controls.
    const chooseGameLabel = document.querySelector(".setup-panel-card > label");
    if (chooseGameLabel) chooseGameLabel.classList.add("solo-local-hidden-step7");
    if (els.gameModeCards) els.gameModeCards.classList.add("solo-local-hidden-step7");
    if (els.userCount) els.userCount.closest("div")?.classList.add("solo-local-hidden-step7");
    if (els.userNameFields) els.userNameFields.classList.add("solo-local-hidden-step7");

    // Keep the decline option available for the Solo Challenge because it belongs to draft mode.
    if (els.excludeDeclinesLabel) els.excludeDeclinesLabel.classList.remove("hidden", "solo-local-hidden-step7");
    if (els.excludeDeclines) els.excludeDeclines.checked = true;

    if (els.gameModeDescription) {

  if (window.challengePreset === "ultimate") {
    els.gameModeDescription.textContent =
      "Ultimate Solo Mode: the full player database is unlocked. The year range filter is ignored.";
  } else if (window.challengePreset === "easy") {
    els.gameModeDescription.textContent =
      "Easy Solo Challenge: only the top rated players in each position from every selected year are available.";
  } else {
    els.gameModeDescription.textContent =
      "Solo Challenge: accept or decline random players to complete your 5-a-side team.";
  }

}

if (els.startBtn) {

  if (window.challengePreset === "ultimate") {
    els.startBtn.textContent =
      "Start Ultimate Solo Mode";
  } else if (window.challengePreset === "easy") {
    els.startBtn.textContent =
      "Start Easy Solo Challenge";
  } else {
    els.startBtn.textContent =
      "Start Solo Challenge";
  }

}
}

  function startSoloChallengeStep7() {
    selectedGameMode = "draft";
    online.enabled = false;
    const soloName = "You";
    startNewGame("draft", [soloName], false);
  }

  const previousInjectEntryPanelStep7 = injectEntryPanel;
  injectEntryPanel = function (...args) {
    const result = previousInjectEntryPanelStep7.apply(this, args);
    adjustEntryPanelToSoloStep7();
    return result;
  };

  const previousUpdateSetupForModeStep7 = updateSetupForMode;
  updateSetupForMode = function (...args) {
    const result = previousUpdateSetupForModeStep7.apply(this, args);
    if (!online.enabled && !state && !els.setupPanel?.classList.contains("hidden")) {
      configureSoloSetupStep7();
    }
    return result;
  };

  document.addEventListener("click", function (event) {
    if (event.target?.closest?.("#startLocalGameBtn")) {
      setTimeout(configureSoloSetupStep7, 0);
    }

    if (event.target?.closest?.("#startBtn") && !online.enabled && !els.setupPanel?.classList.contains("hidden")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      safe(startSoloChallengeStep7)();
    }
  }, true);

  // If the page is already loaded when this patch runs, update the existing front panel now.
  adjustEntryPanelToSoloStep7();
})();

// --- step8 solo challenge setup cleanup and layout polish ---
// Cleans up duplicated Solo Challenge setup text and improves the in-game solo layout.
// Keeps the existing 5-a-side pitch graphics and player names, but gives the player-pick panel more space.
(function () {
  function injectSoloPolishStylesStep8() {
    if ($("soloPolishStylesStep8")) return;
    const style = document.createElement("style");
    style.id = "soloPolishStylesStep8";
    style.textContent = `
      body.solo-challenge-active-step8 #gamePanel.game-grid {
        max-width: 1320px;
        width: min(1320px, calc(100vw - 32px));
        margin-left: auto;
        margin-right: auto;
        grid-template-columns: minmax(0, 1.65fr) minmax(320px, .85fr) !important;
        gap: 22px;
        align-items: start;
      }

      body.solo-challenge-active-step8 .draft-card {
        min-width: 0;
        padding: 24px !important;
        border: 1px solid rgba(255,255,255,.42);
        box-shadow: 0 24px 70px rgba(15,23,42,.18);
      }

      body.solo-challenge-active-step8 .teams-card {
        min-width: 0;
        padding: 18px !important;
        background: rgba(255,255,255,.90);
        border: 1px solid rgba(226,232,240,.9);
        box-shadow: 0 20px 52px rgba(15,23,42,.13);
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row {
        margin-bottom: 10px;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row h2 {
        font-size: 1.45rem;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row .eyebrow {
        font-size: .72rem;
        letter-spacing: .08em;
      }

      body.solo-challenge-active-step8 #teamsContainer.teams-container {
        display: block;
      }

      body.solo-challenge-active-step8 .team-card {
        padding: 14px !important;
        border-radius: 20px !important;
        background: linear-gradient(180deg, rgba(248,250,252,.96), rgba(255,255,255,.98));
        border: 1px solid rgba(203,213,225,.85);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 12px 32px rgba(15,23,42,.10);
      }

      body.solo-challenge-active-step8 .team-card .team-top-row {
        margin-bottom: 10px;
      }

      body.solo-challenge-active-step8 .team-card h3 {
        font-size: 1.1rem;
        margin-bottom: 2px;
      }

      body.solo-challenge-active-step8 .team-meta {
        font-size: .78rem;
      }

      body.solo-challenge-active-step8 .team-card .score {
        font-size: .92rem;
      }

      body.solo-challenge-active-step8 .teams-card .pitch {
        min-height: 420px;
        border-radius: 24px;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player {
        transform: scale(.92);
        transform-origin: center;
      }

      body.solo-challenge-active-step8 .player-card {
        min-height: 340px;
        padding: 24px !important;
        border-radius: 28px !important;
      }

      body.solo-challenge-active-step8 .player-card .player-name {
        font-size: clamp(2rem, 4vw, 3.4rem);
        line-height: 1.02;
      }

      body.solo-challenge-active-step8 .detail-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      body.solo-challenge-active-step8 #draftControls.button-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      body.solo-challenge-active-step8 #draftControls .btn {
        min-height: 48px;
        font-size: 1rem;
      }

      body.solo-challenge-active-step8 .turn-row {
        margin-bottom: 16px;
      }

      body.solo-challenge-active-step8 .turn-row h2 {
        font-size: clamp(1.8rem, 3vw, 2.6rem);
      }

      body.solo-challenge-active-step8 #activeYearRangePillStep5 {
        margin-top: 12px;
      }

      @media (max-width: 980px) {
        body.solo-challenge-active-step8 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(760px, calc(100vw - 24px));
        }

        body.solo-challenge-active-step8 .teams-card {
          order: 2;
        }

        body.solo-challenge-active-step8 .draft-card {
          order: 1;
        }
      }

      @media (max-width: 640px) {
        body.solo-challenge-active-step8 #draftControls.button-row {
          grid-template-columns: 1fr;
        }
        body.solo-challenge-active-step8 .detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function cleanupSoloSetupCopyStep8() {
    // Remove the duplicated mode description text.
    if (els?.gameModeDescription) {
      els.gameModeDescription.textContent = "";
      els.gameModeDescription.classList.add("solo-local-hidden-step7");
    }

    // Remove the ratings-hidden tip box on Solo Challenge setup.
    const tipBox = document.querySelector("#setupPanel .setup-note-box");
    if (tipBox) tipBox.classList.add("solo-local-hidden-step7");

    // If the controls grid only exists for hidden user count + hidden tip, hide the shell too.
    const controlsGrid = document.querySelector("#setupPanel .setup-controls-grid");
    if (controlsGrid) controlsGrid.classList.add("solo-local-hidden-step7");
  }

  function isSoloChallengeStateStep8() {
    return !!state && !online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1;
  }

  function applySoloGameLayoutStep8() {
    injectSoloPolishStylesStep8();
    document.body.classList.toggle("solo-challenge-active-step8", isSoloChallengeStateStep8());

    if (isSoloChallengeStateStep8()) {
      if (els.turnEyebrow) els.turnEyebrow.textContent = "Solo Challenge";
      if (els.currentUserLabel) els.currentUserLabel.textContent = "Build your team";
      const teamsTitle = document.querySelector(".teams-card .section-title-row h2");
      const teamsEyebrow = document.querySelector(".teams-card .section-title-row .eyebrow");
      if (teamsTitle) teamsTitle.textContent = "Your team";
      if (teamsEyebrow) teamsEyebrow.textContent = "5-a-side pitch";
    }
  }

  const previousConfigureSoloSetupStep8 = typeof configureSoloSetupStep7 === "function" ? configureSoloSetupStep7 : null;
  if (previousConfigureSoloSetupStep8) {
    configureSoloSetupStep7 = function (...args) {
      const result = previousConfigureSoloSetupStep8.apply(this, args);
      cleanupSoloSetupCopyStep8();
      return result;
    };
  }

  const previousUpdateSetupForModeStep8 = updateSetupForMode;
  updateSetupForMode = function (...args) {
    const result = previousUpdateSetupForModeStep8.apply(this, args);
    if (!online.enabled && !state && !els.setupPanel?.classList.contains("hidden")) {
      cleanupSoloSetupCopyStep8();
    }
    return result;
  };

  document.addEventListener("click", function (event) {
    if (event.target?.closest?.("#startLocalGameBtn")) {
      setTimeout(cleanupSoloSetupCopyStep8, 0);
    }
  }, true);

  const previousRenderStep8 = render;
  render = function (...args) {
    const result = previousRenderStep8.apply(this, args);
    applySoloGameLayoutStep8();
    return result;
  };

  const previousStartNewGameStep8 = startNewGame;
  startNewGame = function (...args) {
    const result = previousStartNewGameStep8.apply(this, args);
    applySoloGameLayoutStep8();
    return result;
  };

  const previousResetGameStep8 = resetGame;
  resetGame = function (...args) {
    const result = previousResetGameStep8.apply(this, args);
    document.body.classList.remove("solo-challenge-active-step8");
    return result;
  };

  // Initial safety pass.
  injectSoloPolishStylesStep8();
  cleanupSoloSetupCopyStep8();
  applySoloGameLayoutStep8();
})();

// --- step9 solo layout rebalance and centred results ---
// Rebalances the Solo Challenge layout after Step 8:
// - Makes the pitch/draft board wider again so names sit correctly on the existing pitch graphic.
// - Restores the label to "Draft board".
// - Centres and polishes the solo results page.
(function () {
  function injectSoloRebalanceStylesStep9() {
    if ($("soloRebalanceStylesStep9")) return;
    const style = document.createElement("style");
    style.id = "soloRebalanceStylesStep9";
    style.textContent = `
      body.solo-challenge-active-step8 #gamePanel.game-grid {
        max-width: 1280px !important;
        width: min(1280px, calc(100vw - 32px)) !important;
        grid-template-columns: minmax(0, 1.18fr) minmax(440px, .92fr) !important;
        gap: 22px !important;
        align-items: start;
      }

      body.solo-challenge-active-step8 .draft-card {
        padding: 22px !important;
      }

      body.solo-challenge-active-step8 .teams-card {
        padding: 20px !important;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row h2 {
        font-size: 1.65rem !important;
      }

      body.solo-challenge-active-step8 .teams-card .section-title-row .eyebrow {
        font-size: .78rem !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch {
        min-height: 470px !important;
        border-radius: 24px;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player {
        transform: none !important;
        transform-origin: center;
      }

      body.solo-challenge-active-step8 .player-card {
        min-height: 315px !important;
      }

      body.solo-challenge-active-step8 .player-card .player-name {
        font-size: clamp(1.85rem, 3.4vw, 3rem) !important;
      }

      body.solo-challenge-active-step8 .team-card {
        padding: 16px !important;
      }

      body.solo-challenge-active-step8 .team-card h3 {
        font-size: 1.2rem !important;
      }

      body.solo-results-centred-step9 #resultsPanel.finished-results-page {
        max-width: 980px !important;
        width: min(980px, calc(100vw - 32px)) !important;
        margin-left: auto !important;
        margin-right: auto !important;
        text-align: center;
      }

      body.solo-results-centred-step9 .finished-hero {
        grid-template-columns: 1fr !important;
        justify-items: center;
        text-align: center;
      }

      body.solo-results-centred-step9 .winner-badge-large {
        margin-left: auto;
        margin-right: auto;
        justify-content: center;
      }

      body.solo-results-centred-step9 .finished-actions {
        justify-content: center !important;
      }

      body.solo-results-centred-step9 .finished-results-grid {
        grid-template-columns: minmax(320px, 620px) !important;
        justify-content: center !important;
        align-items: start;
      }

      body.solo-results-centred-step9 .finished-team-card {
        text-align: left;
      }

      body.solo-results-centred-step9 .finished-team-top {
        text-align: left;
      }

      body.solo-results-centred-step9 .finished-team-card .pitch {
        margin-left: auto;
        margin-right: auto;
      }

      @media (max-width: 1100px) {
        body.solo-challenge-active-step8 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(820px, calc(100vw - 24px)) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isSoloStep9() {
    return !!state && !online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1;
  }

  function restoreDraftBoardLabelsStep9() {
    if (!isSoloStep9()) return;
    const teamsTitle = document.querySelector(".teams-card .section-title-row h2");
    const teamsEyebrow = document.querySelector(".teams-card .section-title-row .eyebrow");
    if (teamsTitle) teamsTitle.textContent = "Draft board";
    if (teamsEyebrow) teamsEyebrow.textContent = "Your team";
  }

  function syncSoloResultClassStep9() {
    const showCentred = !!(ratingsRevealed && state && !online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1);
    document.body.classList.toggle("solo-results-centred-step9", showCentred);
  }

  const prevRenderStep9 = render;
  render = function (...args) {
    const result = prevRenderStep9.apply(this, args);
    injectSoloRebalanceStylesStep9();
    restoreDraftBoardLabelsStep9();
    syncSoloResultClassStep9();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const prevFinishedStep9 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = prevFinishedStep9.apply(this, args);
      injectSoloRebalanceStylesStep9();
      syncSoloResultClassStep9();
      return result;
    };
  }

  const prevRenderResultsStep9 = renderResults;
  renderResults = function (...args) {
    const result = prevRenderResultsStep9.apply(this, args);
    syncSoloResultClassStep9();
    return result;
  };

  const prevResetStep9 = resetGame;
  resetGame = function (...args) {
    const result = prevResetStep9.apply(this, args);
    document.body.classList.remove("solo-results-centred-step9");
    return result;
  };

  injectSoloRebalanceStylesStep9();
  restoreDraftBoardLabelsStep9();
  syncSoloResultClassStep9();
})();

// --- step10 solo pitch position fix ---
// Fixes Solo Challenge draft board player positions on the pitch.
// Step 9 widened the pitch, but the base pitch-positioning rules were still not ideal for the solo card size.
// These overrides keep the existing 5-a-side pitch graphic, but explicitly centre each slot inside the pitch.
(function () {
  function injectSoloPitchPositionStylesStep10() {
    if ($("soloPitchPositionStylesStep10")) return;
    const style = document.createElement("style");
    style.id = "soloPitchPositionStylesStep10";
    style.textContent = `
      body.solo-challenge-active-step8 .teams-card .pitch {
        position: relative;
        overflow: hidden;
        min-height: 470px !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player {
        position: absolute !important;
        width: min(124px, 28%) !important;
        min-width: 96px;
        max-width: 128px;
        box-sizing: border-box;
        text-align: center;
        transform: translate(-50%, -50%) !important;
        z-index: 3;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.gk {
        left: 50% !important;
        top: 88% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.def {
        left: 50% !important;
        top: 68% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.mid1 {
        left: 34% !important;
        top: 50% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.mid2 {
        left: 66% !important;
        top: 50% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player.fwd {
        left: 50% !important;
        top: 24% !important;
        bottom: auto !important;
        right: auto !important;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player .pos,
      body.solo-challenge-active-step8 .teams-card .pitch-player .name,
      body.solo-challenge-active-step8 .teams-card .pitch-player .club,
      body.solo-challenge-active-step8 .teams-card .pitch-player .year,
      body.solo-challenge-active-step8 .teams-card .pitch-player .rating,
      body.solo-challenge-active-step8 .teams-card .pitch-player .price {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      body.solo-challenge-active-step8 .teams-card .pitch-player .name {
        display: block;
        line-height: 1.1;
      }

      body.solo-results-centred-step9 .finished-team-card {
        max-width: 680px;
        margin-left: auto;
        margin-right: auto;
      }

      body.solo-results-centred-step9 .finished-team-card .pitch {
        max-width: 560px;
        width: 100%;
      }

      body.solo-results-centred-step9 .finished-player-list {
        max-width: 560px;
        margin-left: auto;
        margin-right: auto;
      }
    `;
    document.head.appendChild(style);
  }

  const prevRenderStep10 = render;
  render = function (...args) {
    const result = prevRenderStep10.apply(this, args);
    injectSoloPitchPositionStylesStep10();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const prevFinishedStep10 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = prevFinishedStep10.apply(this, args);
      injectSoloPitchPositionStylesStep10();
      return result;
    };
  }

  injectSoloPitchPositionStylesStep10();
})();

// --- step11 pitch centre line and solo results polish ---
// Tweaks requested after Step 10:
// - Extend the centre line to both pitch edges.
// - Remove active pool player count from the in-game range note.
// - Centre-align the top results hero.
// - Make the solo results pitch wider and less cramped on desktop and mobile.
(function () {
  function injectStep11Styles() {
    if ($("step11SoloPitchResultsStyles")) return;
    const style = document.createElement("style");
    style.id = "step11SoloPitchResultsStyles";
    style.textContent = `
      /* Extend the centre line fully to each pitch edge. */
      body.solo-challenge-active-step8 .pitch::before,
      body.solo-results-centred-step9 .pitch::before {
        left: 0 !important;
        right: 0 !important;
        width: auto !important;
      }

      /* Keep pitch markings inside the rounded pitch but allow the middle line to meet the border. */
      body.solo-challenge-active-step8 .pitch,
      body.solo-results-centred-step9 .pitch {
        overflow: hidden;
      }

      /* Stronger, cleaner top alignment on the solo results page. */
      body.solo-results-centred-step9 #resultsPanel.finished-results-page {
        max-width: 1120px !important;
        width: min(1120px, calc(100vw - 32px)) !important;
        text-align: center !important;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-hero {
        max-width: 760px;
        margin-left: auto !important;
        margin-right: auto !important;
        text-align: center !important;
        justify-items: center !important;
        align-items: center !important;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-hero > div {
        text-align: center !important;
        width: 100%;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-hero h2,
      body.solo-results-centred-step9 #resultsPanel .finished-hero p,
      body.solo-results-centred-step9 #resultsPanel .finished-hero .eyebrow {
        text-align: center !important;
      }

      body.solo-results-centred-step9 #resultsPanel .winner-badge-large {
        margin-left: auto !important;
        margin-right: auto !important;
      }

      body.solo-results-centred-step9 #resultsPanel .finished-actions {
        width: 100%;
        justify-content: center !important;
      }

      /* Wider, more professional solo result card and pitch. */
      body.solo-results-centred-step9 .finished-results-grid {
        grid-template-columns: minmax(360px, 780px) !important;
        justify-content: center !important;
      }

      body.solo-results-centred-step9 .finished-team-card {
        max-width: 780px !important;
        width: 100%;
        margin-left: auto !important;
        margin-right: auto !important;
        padding: 22px !important;
      }

      body.solo-results-centred-step9 .finished-team-card .pitch {
        width: min(640px, 100%) !important;
        max-width: 640px !important;
        min-height: 560px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      body.solo-results-centred-step9 .finished-player-list {
        width: min(640px, 100%) !important;
        max-width: 640px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      body.solo-results-centred-step9 .finished-player-row {
        grid-template-columns: 56px minmax(0, 1fr) 46px !important;
      }

      @media (max-width: 720px) {
        body.solo-results-centred-step9 #resultsPanel.finished-results-page {
          width: min(100vw - 18px, 720px) !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }

        body.solo-results-centred-step9 #resultsPanel .finished-hero {
          max-width: 100%;
          padding: 16px !important;
        }

        body.solo-results-centred-step9 #resultsPanel .finished-actions {
          display: grid !important;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        body.solo-results-centred-step9 .finished-team-card {
          padding: 14px !important;
        }

        body.solo-results-centred-step9 .finished-team-card .pitch {
          width: 100% !important;
          min-height: 500px !important;
        }

        body.solo-results-centred-step9 .finished-player-row {
          grid-template-columns: 50px minmax(0, 1fr) 42px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function updateActivePoolNoteStep11() {
    const range = state?.yearRange;
    const pill = document.getElementById("activeYearRangePillStep5");
    if (!pill) return;

    if (window.challengePreset === "ultimate") {
      pill.textContent = "Active player pool: All years (2005-2026)";
      return;
    }

    if (window.challengePreset === "easy") {
      pill.textContent = "Active player pool: Elite players only";
      return;
    }

    if (range) {
      pill.textContent = `Active player pool: ${range.start} - ${range.end}`;
    }
  }

  const previousRenderStep11 = render;
  render = function (...args) {
    const result = previousRenderStep11.apply(this, args);
    injectStep11Styles();
    updateActivePoolNoteStep11();
    return result;
  };

  if (typeof renderResults === "function") {
    const previousRenderResultsStep11 = renderResults;
    renderResults = function (...args) {
      const result = previousRenderResultsStep11.apply(this, args);
      injectStep11Styles();
      return result;
    };
  }

  if (typeof showFinishedResultsPageV33 === "function") {
    const previousFinishedStep11 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = previousFinishedStep11.apply(this, args);
      injectStep11Styles();
      return result;
    };
  }

  injectStep11Styles();
  updateActivePoolNoteStep11();
})();

// --- step12 online game UI refresh ---
// Improves the online in-game screens without changing game logic.
// Focus: clearer action area, cleaner bid input, smaller tip/helper text, compact room badge and better hierarchy.
(function () {
  function injectOnlineRefreshStylesStep12() {
    if ($("onlineRefreshStylesStep12")) return;
    const style = document.createElement("style");
    style.id = "onlineRefreshStylesStep12";
    style.textContent = `
      body.online-game-active-step12 #gamePanel.game-grid {
        max-width: 1320px;
        width: min(1320px, calc(100vw - 32px));
        margin-left: auto;
        margin-right: auto;
        grid-template-columns: minmax(0, 1.45fr) minmax(360px, .82fr) !important;
        gap: 22px;
        align-items: start;
      }

      body.online-game-active-step12 .draft-card {
        padding: 22px !important;
        border: 1px solid rgba(255,255,255,.40);
        box-shadow: 0 24px 70px rgba(15,23,42,.18);
      }

      body.online-game-active-step12 .teams-card {
        padding: 18px !important;
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(226,232,240,.95);
        box-shadow: 0 20px 52px rgba(15,23,42,.12);
      }

      body.online-game-active-step12 .turn-row {
        align-items: center;
        padding: 14px;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(239,246,255,.96), rgba(240,253,244,.92));
        border: 1px solid rgba(191,219,254,.95);
        margin-bottom: 14px;
      }

      body.online-game-active-step12 .turn-row h2 {
        margin: 2px 0 0;
        font-size: clamp(1.7rem, 3.2vw, 2.7rem);
        line-height: 1.05;
      }

      body.online-game-active-step12 .turn-row .eyebrow {
        font-size: .72rem;
        letter-spacing: .09em;
      }

      body.online-game-active-step12 .player-card {
        min-height: 280px;
        padding: 24px !important;
        border-radius: 28px !important;
      }

      body.online-game-active-step12 .player-card .player-name {
        font-size: clamp(2rem, 4vw, 3.35rem);
        line-height: 1.02;
      }

      body.online-game-active-step12 .player-card .badge-row {
        margin-top: 12px;
      }

      body.online-game-active-step12 .player-card .detail-grid {
        gap: 12px;
      }

      body.online-game-active-step12 #bidControls.bid-controls {
        display: grid;
        gap: 12px;
      }

      body.online-game-active-step12 #bidControls > .bid-order-card:first-child {
        padding: 12px 14px !important;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      body.online-game-active-step12 .bid-status-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      body.online-game-active-step12 .bid-status-summary strong {
        font-size: 1rem;
        color: #0f172a;
      }

      body.online-game-active-step12 .bid-status-summary span {
        font-size: .76rem;
        color: #64748b;
        font-weight: 850;
      }

      body.online-game-active-step12 .bid-warning,
      body.online-game-active-step12 .warning-note,
      body.online-game-active-step12 .muted,
      body.online-game-active-step12 .bid-help,
      body.online-game-active-step12 .turn-lock-note {
        font-size: .76rem !important;
        line-height: 1.3 !important;
      }

      body.online-game-active-step12 .bid-warning,
      body.online-game-active-step12 .warning-note {
        padding: 8px 10px !important;
        margin: 0 !important;
        border-radius: 12px;
        opacity: .86;
      }

      body.online-game-active-step12 #bidInputs {
        display: grid;
        gap: 12px;
      }

      body.online-game-active-step12 #bidInputs > .bid-order-card,
      body.online-game-active-step12 .live-auction-panel-step2,
      body.online-game-active-step12 #bidInputs > .bid-order-card:first-child {
        border-radius: 22px !important;
        border: 1px solid #dbeafe !important;
        background: linear-gradient(180deg, #ffffff, #f8fafc) !important;
        box-shadow: 0 16px 38px rgba(15,23,42,.10);
        padding: 16px !important;
      }

      body.online-game-active-step12 #bidInputs > .bid-order-card:first-child .eyebrow,
      body.online-game-active-step12 .live-auction-panel-step2 .eyebrow {
        color: #2563eb;
        font-size: .72rem;
        letter-spacing: .09em;
      }

      body.online-game-active-step12 #bidInputs > .bid-order-card:first-child h3,
      body.online-game-active-step12 .live-auction-panel-step2 h3 {
        font-size: clamp(1.35rem, 2.8vw, 2rem);
        margin: 4px 0 6px;
        color: #0f172a;
      }

      body.online-game-active-step12 .bid-row {
        gap: 8px;
        padding: 10px !important;
        border-radius: 16px !important;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      body.online-game-active-step12 .bid-row label {
        font-size: .92rem;
        font-weight: 950;
        color: #0f172a;
      }

      body.online-game-active-step12 input[type="number"]#onlineBlindBidInput,
      body.online-game-active-step12 input[type="number"]#onlineLiveBidInput,
      body.online-game-active-step12 .bid-row input[type="number"] {
        min-height: 54px;
        border-radius: 16px;
        font-size: 1.45rem;
        font-weight: 950;
        text-align: center;
        color: #0f172a;
        border: 2px solid #bfdbfe;
        background: #ffffff;
      }

      body.online-game-active-step12 #submitBlindBidBtn,
      body.online-game-active-step12 #submitLiveBidBtnStep2,
      body.online-game-active-step12 #passLiveBidBtnStep2 {
        min-height: 50px;
        border-radius: 16px;
        font-size: 1rem;
        font-weight: 950;
      }

      body.online-game-active-step12 .live-auction-top-step2 {
        border-radius: 18px;
        padding: 13px !important;
        background: #eff6ff !important;
      }

      body.online-game-active-step12 .live-highest-step2 {
        font-size: 1.45rem !important;
        line-height: 1.1;
      }

      body.online-game-active-step12 .live-auction-actions-step2 {
        grid-template-columns: minmax(0, 1fr) minmax(96px, auto) minmax(96px, auto) !important;
        gap: 10px !important;
      }

      body.online-game-active-step12 .live-status-row-step2 {
        padding: 8px 10px !important;
      }

      body.online-game-active-step12 .live-status-pill-step2,
      body.online-game-active-step12 .bid-submit-status {
        font-size: .72rem !important;
        border-radius: 999px;
        padding: 5px 8px;
        font-weight: 950;
      }

      body.online-game-active-step12 .teams-card .section-title-row h2 {
        font-size: 1.45rem;
      }

      body.online-game-active-step12 .teams-card .section-title-row .eyebrow {
        font-size: .72rem;
        letter-spacing: .08em;
      }

      body.online-game-active-step12 .team-card {
        padding: 13px !important;
        border-radius: 18px !important;
      }

      body.online-game-active-step12 .team-card h3 {
        font-size: 1rem;
      }

      body.online-game-active-step12 .team-meta,
      body.online-game-active-step12 .team-card .score {
        font-size: .76rem;
      }

      body.online-game-active-step12 .teams-card .pitch {
        min-height: 330px;
      }

      .online-room-mini-step12 {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(15,23,42,.88);
        color: #ffffff;
        font-size: .72rem;
        font-weight: 950;
        letter-spacing: .02em;
        box-shadow: 0 10px 26px rgba(15,23,42,.18);
        white-space: nowrap;
      }

      body.online-game-active-step12 .turn-row .online-room-mini-step12 {
        margin-left: auto;
      }

      body.online-game-active-step12 #message.message {
        font-size: .86rem;
        font-weight: 850;
        color: #334155;
      }

      @media (max-width: 980px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(760px, calc(100vw - 24px));
        }

        body.online-game-active-step12 .teams-card {
          order: 2;
        }

        body.online-game-active-step12 .draft-card {
          order: 1;
        }

        body.online-game-active-step12 .live-auction-actions-step2 {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 640px) {
        body.online-game-active-step12 .turn-row {
          grid-template-columns: 1fr;
        }

        body.online-game-active-step12 .turn-row .online-room-mini-step12 {
          margin-left: 0;
          width: fit-content;
        }

        body.online-game-active-step12 .player-card {
          min-height: 240px;
          padding: 18px !important;
        }

        body.online-game-active-step12 #bidInputs > .bid-order-card,
        body.online-game-active-step12 .live-auction-panel-step2 {
          padding: 13px !important;
        }

        body.online-game-active-step12 input[type="number"]#onlineBlindBidInput,
        body.online-game-active-step12 input[type="number"]#onlineLiveBidInput,
        body.online-game-active-step12 .bid-row input[type="number"] {
          min-height: 50px;
          font-size: 1.25rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isOnlineGameActiveStep12() {
    return !!state && !!online.enabled && !ratingsRevealed;
  }

  function setOnlineBodyClassStep12() {
    document.body.classList.toggle("online-game-active-step12", isOnlineGameActiveStep12());
  }

  function addOnlineRoomBadgeStep12() {
    if (!isOnlineGameActiveStep12()) return;
    const row = document.querySelector(".draft-card .turn-row");
    if (!row) return;
    let badge = $("onlineRoomMiniStep12");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "onlineRoomMiniStep12";
      badge.className = "online-room-mini-step12";
      row.appendChild(badge);
    }
    badge.textContent = online.roomId ? `Room: ${online.roomId}` : "Online game";
  }

  function simplifyOnlineLabelsStep12() {
    if (!isOnlineGameActiveStep12()) return;
    if (state?.gameMode === "bid") {
      if (els.turnEyebrow) els.turnEyebrow.textContent = state.onlineBidMode === "live" ? "Live auction" : "Blind bidding";
      if (els.currentUserLabel) els.currentUserLabel.textContent = currentCandidate ? "Make your bid" : "Online bidding";
    } else {
      if (els.turnEyebrow) els.turnEyebrow.textContent = "Online draft";
    }
  }

  function refreshOnlineUiStep12() {
    injectOnlineRefreshStylesStep12();
    setOnlineBodyClassStep12();
    addOnlineRoomBadgeStep12();
    simplifyOnlineLabelsStep12();
  }

  const previousRenderStep12 = render;
  render = function (...args) {
    const result = previousRenderStep12.apply(this, args);
    refreshOnlineUiStep12();
    return result;
  };

  const previousApplyRemoteDataStep12 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep12.apply(this, args);
    refreshOnlineUiStep12();
    return result;
  };

  const previousRenderOnlineBidControlsStep12 = renderOnlineBidControlsV38;
  renderOnlineBidControlsV38 = function (...args) {
    const result = previousRenderOnlineBidControlsStep12.apply(this, args);
    refreshOnlineUiStep12();
    return result;
  };

  const previousResetStep12 = resetGame;
  resetGame = function (...args) {
    const result = previousResetStep12.apply(this, args);
    document.body.classList.remove("online-game-active-step12");
    const badge = $("onlineRoomMiniStep12");
    if (badge) badge.remove();
    return result;
  };

  injectOnlineRefreshStylesStep12();
  refreshOnlineUiStep12();
})();

// --- step13 online pitch overflow desktop fix ---
// Fixes online desktop issue where the draft-board/pitch panel could overflow off the right side.
// Keeps the improved bidding/action UI from Step 12.
(function () {
  function injectOnlinePitchOverflowFixStep13() {
    if ($("onlinePitchOverflowFixStep13")) return;
    const style = document.createElement("style");
    style.id = "onlinePitchOverflowFixStep13";
    style.textContent = `
      body.online-game-active-step12 #gamePanel.game-grid {
        box-sizing: border-box;
        max-width: 1240px !important;
        width: min(1240px, calc(100vw - 40px)) !important;
        grid-template-columns: minmax(0, 1.42fr) minmax(0, .78fr) !important;
        overflow-x: hidden;
      }

      body.online-game-active-step12 .draft-card,
      body.online-game-active-step12 .teams-card,
      body.online-game-active-step12 .team-card,
      body.online-game-active-step12 .pitch {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box;
      }

      body.online-game-active-step12 .teams-card {
        overflow: hidden !important;
      }

      body.online-game-active-step12 #teamsContainer.teams-container {
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }

      body.online-game-active-step12 .team-card {
        width: 100%;
        overflow: hidden;
      }

      body.online-game-active-step12 .teams-card .pitch {
        width: 100% !important;
        min-height: 300px !important;
        overflow: hidden !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player {
        max-width: 112px !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player .name,
      body.online-game-active-step12 .teams-card .pitch-player .club,
      body.online-game-active-step12 .teams-card .pitch-player .year,
      body.online-game-active-step12 .teams-card .pitch-player .rating,
      body.online-game-active-step12 .teams-card .pitch-player .price {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Preserve mobile behaviour, which already looked fine. */
      @media (max-width: 980px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          width: min(760px, calc(100vw - 24px)) !important;
          grid-template-columns: 1fr !important;
          overflow-x: visible;
        }

        body.online-game-active-step12 .teams-card .pitch {
          min-height: 330px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const previousRenderStep13 = render;
  render = function (...args) {
    const result = previousRenderStep13.apply(this, args);
    injectOnlinePitchOverflowFixStep13();
    return result;
  };

  const previousApplyRemoteDataStep13 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep13.apply(this, args);
    injectOnlinePitchOverflowFixStep13();
    return result;
  };

  injectOnlinePitchOverflowFixStep13();
})();

// --- step14 online draft board fit and scroll all teams ---
// Fixes the online draft board/pitch sidebar so each pitch fits without being clipped,
// and all online teams remain accessible inside a tidy scrollable draft-board panel.
(function () {
  function injectOnlineBoardFitStylesStep14() {
    if ($("onlineBoardFitStylesStep14")) return;
    const style = document.createElement("style");
    style.id = "onlineBoardFitStylesStep14";
    style.textContent = `
      body.online-game-active-step12 #gamePanel.game-grid {
        max-width: 1320px !important;
        width: min(1320px, calc(100vw - 40px)) !important;
        grid-template-columns: minmax(0, 1.35fr) minmax(390px, .88fr) !important;
        align-items: start !important;
        overflow: visible !important;
      }

      body.online-game-active-step12 .teams-card {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: visible !important;
        padding: 18px !important;
      }

      body.online-game-active-step12 #teamsContainer.teams-container {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        width: 100% !important;
        max-width: 100% !important;
        max-height: calc(100vh - 230px);
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding-right: 8px;
        scrollbar-gutter: stable;
      }

      body.online-game-active-step12 #teamsContainer.teams-container::-webkit-scrollbar {
        width: 8px;
      }
      body.online-game-active-step12 #teamsContainer.teams-container::-webkit-scrollbar-track {
        background: rgba(226,232,240,.85);
        border-radius: 999px;
      }
      body.online-game-active-step12 #teamsContainer.teams-container::-webkit-scrollbar-thumb {
        background: rgba(100,116,139,.65);
        border-radius: 999px;
      }

      body.online-game-active-step12 .team-card {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: visible !important;
        box-sizing: border-box !important;
        padding: 14px !important;
      }

      body.online-game-active-step12 .teams-card .pitch {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        min-height: 420px !important;
        max-height: none !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player {
        position: absolute !important;
        width: min(118px, 30%) !important;
        min-width: 86px !important;
        max-width: 118px !important;
        box-sizing: border-box !important;
        transform: translate(-50%, -50%) !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player.gk {
        left: 50% !important;
        top: 88% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.def {
        left: 50% !important;
        top: 68% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.mid1 {
        left: 32% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.mid2 {
        left: 68% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
      }
      body.online-game-active-step12 .teams-card .pitch-player.fwd {
        left: 50% !important;
        top: 22% !important;
        right: auto !important;
        bottom: auto !important;
      }

      body.online-game-active-step12 .teams-card .pitch-player .pos,
      body.online-game-active-step12 .teams-card .pitch-player .name,
      body.online-game-active-step12 .teams-card .pitch-player .club,
      body.online-game-active-step12 .teams-card .pitch-player .year,
      body.online-game-active-step12 .teams-card .pitch-player .rating,
      body.online-game-active-step12 .teams-card .pitch-player .price {
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      body.online-game-active-step12 .teams-card .section-title-row {
        position: sticky;
        top: 0;
        z-index: 5;
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(8px);
        border-radius: 16px;
        padding-bottom: 8px;
        margin-bottom: 10px;
      }

      @media (min-width: 981px) and (max-width: 1180px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          grid-template-columns: minmax(0, 1.2fr) minmax(360px, .9fr) !important;
          width: min(1180px, calc(100vw - 28px)) !important;
          gap: 18px !important;
        }
        body.online-game-active-step12 .teams-card .pitch {
          min-height: 390px !important;
        }
        body.online-game-active-step12 #teamsContainer.teams-container {
          max-height: calc(100vh - 220px);
        }
      }

      @media (max-width: 980px) {
        body.online-game-active-step12 #gamePanel.game-grid {
          grid-template-columns: 1fr !important;
          width: min(760px, calc(100vw - 24px)) !important;
        }
        body.online-game-active-step12 #teamsContainer.teams-container {
          max-height: none !important;
          overflow: visible !important;
          padding-right: 0 !important;
        }
        body.online-game-active-step12 .teams-card .pitch {
          min-height: 420px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const previousRenderStep14 = render;
  render = function (...args) {
    const result = previousRenderStep14.apply(this, args);
    injectOnlineBoardFitStylesStep14();
    return result;
  };

  const previousApplyRemoteDataStep14 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep14.apply(this, args);
    injectOnlineBoardFitStylesStep14();
    return result;
  };

  injectOnlineBoardFitStylesStep14();
})();

// --- step16 mobile action highlight, online board header polish and live skip fix ---
// 1) Adds a real in-card "YOUR GO" banner so phones show the active action area reliably.
// 2) Makes the online Draft Board/Teams header look more polished across all online modes.
// 3) Adds extra skip synchronisation for live auction "No first bid" so the counter updates correctly.
(function () {
  function injectStep16Styles() {
    if ($("step16OnlinePolishStyles")) return;
    const style = document.createElement("style");
    style.id = "step16OnlinePolishStyles";
    style.textContent = `
      /* More robust action highlighting, including real mobile Safari/iPhone rendering. */
      .online-action-needed-step15 {
        border: 3px solid #22c55e !important;
        box-shadow: 0 0 0 5px rgba(34,197,94,.18), 0 18px 44px rgba(15,23,42,.16) !important;
        background: linear-gradient(180deg, #ffffff, #f0fdf4) !important;
      }
      .online-action-banner-step16 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        margin: -2px 0 12px;
        padding: 10px 12px;
        border-radius: 16px;
        background: linear-gradient(135deg, #22c55e, #bbf7d0);
        color: #052e16;
        font-weight: 950;
        font-size: .9rem;
        box-shadow: 0 12px 28px rgba(34,197,94,.20);
        box-sizing: border-box;
      }
      .online-action-banner-step16 span:last-child {
        font-size: .72rem;
        opacity: .86;
      }
      @media (max-width: 720px) {
        .online-action-banner-step16 {
          position: sticky;
          top: 8px;
          z-index: 20;
          font-size: .95rem;
          padding: 12px;
          margin-bottom: 14px;
        }
        .online-action-needed-step15 {
          border-width: 4px !important;
          box-shadow: 0 0 0 5px rgba(34,197,94,.22), 0 12px 36px rgba(15,23,42,.18) !important;
        }
      }

      /* Professional online Draft Board header. */
      body.online-game-active-step12 .teams-card > .section-title-row {
        position: sticky;
        top: 0;
        z-index: 8;
        margin: -4px -4px 16px !important;
        padding: 16px 16px !important;
        border-radius: 22px !important;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #2563eb) !important;
        color: #ffffff !important;
        box-shadow: 0 18px 44px rgba(15,23,42,.18);
        border: 1px solid rgba(255,255,255,.18);
        backdrop-filter: blur(10px);
      }
      body.online-game-active-step12 .teams-card > .section-title-row > div {
        display: grid;
        gap: 4px;
      }
      body.online-game-active-step12 .teams-card > .section-title-row .eyebrow {
        display: inline-flex;
        width: fit-content;
        padding: 5px 9px;
        border-radius: 999px;
        background: rgba(255,255,255,.16);
        color: #bfdbfe !important;
        font-size: .68rem !important;
        letter-spacing: .11em !important;
        font-weight: 950;
      }
      body.online-game-active-step12 .teams-card > .section-title-row h2 {
        margin: 0;
        color: #ffffff !important;
        font-size: 1.55rem !important;
        line-height: 1.05;
        font-weight: 950;
      }
      body.online-game-active-step12 .teams-card > .section-title-row h2::after {
        content: "Live teams";
        display: block;
        margin-top: 4px;
        font-size: .78rem;
        line-height: 1.2;
        color: rgba(255,255,255,.76);
        font-weight: 800;
      }
      body.online-game-active-step12 .teams-card > .section-title-row #revealBtn:not(.hidden) {
        background: #ffffff !important;
        color: #1d4ed8 !important;
        border: 0 !important;
        box-shadow: 0 10px 28px rgba(15,23,42,.18);
      }
      @media (max-width: 720px) {
        body.online-game-active-step12 .teams-card > .section-title-row {
          margin: 0 0 14px !important;
          padding: 14px !important;
          border-radius: 20px !important;
        }
        body.online-game-active-step12 .teams-card > .section-title-row h2 {
          font-size: 1.38rem !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function safeKeyStep16(value) {
    return typeof safeKey === "function" ? safeKey(value) : String(value || "").trim().toLowerCase();
  }

  function clampSkipsStep16(value) {
    const n = Math.max(0, Math.floor(Number(value || 0)));
    return Math.min(BID_SKIPS_ALLOWED, n);
  }

  function normaliseSkipsStep16() {
    if (!state?.users) return;
    state.users.forEach(user => {
      user.bidSkips = clampSkipsStep16(user.bidSkips);
    });
  }

  function syncLiveNoFirstSkipsStep16() {
    if (!state || !online.enabled || state.gameMode !== "bid" || state.onlineBidMode !== "live") return;
    const auction = state.liveAuction;
    if (!auction?.noFirstBidKeys || !state.users) return;
    Object.keys(auction.noFirstBidKeys).forEach(key => {
      if (!auction.noFirstBidKeys[key]) return;
      const user = state.users.find(u => safeKeyStep16(u.name) === key);
      if (!user) return;
      // If the no-first-bid marker exists but the counter has not moved at all, repair it.
      // This catches phone/browser timing cases where the state marker saved but the skip counter did not.
      if (clampSkipsStep16(user.bidSkips) < 1) user.bidSkips = 1;
      user.bidSkips = clampSkipsStep16(user.bidSkips);
    });
  }

  function addRealActionBannerStep16() {
    document.querySelectorAll(".online-action-banner-step16").forEach(n => n.remove());
    if (!online.enabled || !state || state.gameMode !== "bid" || ratingsRevealed) return;
    const card = document.querySelector(".online-action-needed-step15");
    if (!card) return;
    const banner = document.createElement("div");
    banner.className = "online-action-banner-step16";
    const isLive = state.onlineBidMode === "live";
    banner.innerHTML = `<span>YOUR GO</span><span>${isLive ? "Bid or pass" : "Submit your bid"}</span>`;
    card.insertBefore(banner, card.firstChild);
  }

  function polishBoardHeaderTextStep16() {
    if (!online.enabled || !state) return;
    const eyebrow = document.querySelector(".teams-card > .section-title-row .eyebrow");
    const title = document.querySelector(".teams-card > .section-title-row h2");
    if (eyebrow) eyebrow.textContent = "Draft board";
    if (title) title.textContent = "Teams";
  }

  function applyStep16() {
    injectStep16Styles();
    normaliseSkipsStep16();
    syncLiveNoFirstSkipsStep16();
    polishBoardHeaderTextStep16();
    // Wait a frame so Step 15 has had chance to add the active class.
    setTimeout(addRealActionBannerStep16, 0);
  }

  const previousRenderStep16 = render;
  render = function (...args) {
    const result = previousRenderStep16.apply(this, args);
    applyStep16();
    return result;
  };

  const previousApplyRemoteDataStep16 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep16.apply(this, args);
    applyStep16();
    return result;
  };

  const previousRenderOnlineBidControlsStep16 = renderOnlineBidControlsV38;
  renderOnlineBidControlsV38 = function (...args) {
    const result = previousRenderOnlineBidControlsStep16.apply(this, args);
    applyStep16();
    return result;
  };

  const previousResetStep16 = resetGame;
  resetGame = function (...args) {
    const result = previousResetStep16.apply(this, args);
    document.querySelectorAll(".online-action-banner-step16").forEach(n => n.remove());
    return result;
  };

  applyStep16();
})();

// --- step17 online headers action highlight cleanup and skip hardening ---
// Polishes online headers, restores a clear active-input highlight, removes duplicate helper/status text,
// and hardens live-auction skip behaviour.
(function () {
  function injectStep17Styles() {
    if ($("step17OnlineHeaderActionStyles")) return;
    const style = document.createElement("style");
    style.id = "step17OnlineHeaderActionStyles";
    style.textContent = `
      /* Make the main online action title match the polished draft-board header style. */
      body.online-game-active-step12 .draft-card > .turn-row,
      body.online-game-active-step12 .teams-card > .section-title-row {
        position: sticky;
        top: 0;
        z-index: 12;
        margin: -4px -4px 18px !important;
        padding: 16px 16px !important;
        border-radius: 22px !important;
        background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #2563eb) !important;
        color: #ffffff !important;
        box-shadow: 0 18px 44px rgba(15,23,42,.20) !important;
        border: 1px solid rgba(255,255,255,.18) !important;
        backdrop-filter: blur(10px);
      }
      body.online-game-active-step12 .draft-card > .turn-row .eyebrow,
      body.online-game-active-step12 .teams-card > .section-title-row .eyebrow {
        display: inline-flex !important;
        width: fit-content !important;
        padding: 5px 9px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.16) !important;
        color: #bfdbfe !important;
        font-size: .68rem !important;
        letter-spacing: .11em !important;
        font-weight: 950 !important;
      }
      body.online-game-active-step12 .draft-card > .turn-row h2,
      body.online-game-active-step12 .teams-card > .section-title-row h2 {
        margin: 0 !important;
        color: #ffffff !important;
        font-size: clamp(1.5rem, 2.8vw, 2.25rem) !important;
        line-height: 1.05 !important;
        font-weight: 950 !important;
      }
      body.online-game-active-step12 .draft-card > .turn-row .lives-pill,
      body.online-game-active-step12 .draft-card > .turn-row .online-room-mini-step12 {
        background: rgba(255,255,255,.16) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255,255,255,.18) !important;
      }
      body.online-game-active-step12 .teams-card > .section-title-row h2::after {
        content: "Live teams";
        display: block;
        margin-top: 4px;
        font-size: .78rem;
        line-height: 1.2;
        color: rgba(255,255,255,.76);
        font-weight: 800;
      }

      /* Strong, reliable highlight for the exact online bidding section the user must use. */
      body.online-game-active-step12 .online-action-needed-step17 {
        position: relative !important;
        border: 4px solid #22c55e !important;
        box-shadow: 0 0 0 6px rgba(34,197,94,.18), 0 22px 54px rgba(15,23,42,.20) !important;
        background: linear-gradient(180deg, #ffffff, #f0fdf4) !important;
      }
      .online-action-banner-step17 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        margin: -2px 0 14px;
        padding: 12px 14px;
        border-radius: 16px;
        background: linear-gradient(135deg, #16a34a, #86efac);
        color: #052e16;
        font-weight: 950;
        font-size: .95rem;
        box-shadow: 0 12px 28px rgba(34,197,94,.24);
        box-sizing: border-box;
      }
      .online-action-banner-step17 span:last-child {
        font-size: .76rem;
        opacity: .88;
      }
      body.online-game-active-step12 .online-action-needed-step17 input[type="number"] {
        border-color: #16a34a !important;
        box-shadow: 0 0 0 5px rgba(34,197,94,.16) !important;
      }
      body.online-game-active-step12 .online-action-needed-step17 .btn-primary,
      body.online-game-active-step12 .online-action-needed-step17 #submitLiveBidBtnStep2,
      body.online-game-active-step12 .online-action-needed-step17 #submitBlindBidBtn {
        box-shadow: 0 12px 30px rgba(37,99,235,.25) !important;
      }
      @media (max-width: 720px) {
        body.online-game-active-step12 .draft-card > .turn-row,
        body.online-game-active-step12 .teams-card > .section-title-row {
          margin: 0 0 14px !important;
          padding: 14px !important;
          border-radius: 20px !important;
        }
        body.online-game-active-step12 .draft-card > .turn-row h2,
        body.online-game-active-step12 .teams-card > .section-title-row h2 {
          font-size: 1.45rem !important;
        }
        .online-action-banner-step17 {
          position: sticky;
          top: 8px;
          z-index: 30;
          padding: 13px 14px;
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function clampSkipsStep17(value) {
    const n = Math.max(0, Math.floor(Number(value || 0)));
    return Math.min(BID_SKIPS_ALLOWED, n);
  }

  function userKeyStep17(value) {
    return typeof safeKey === "function" ? safeKey(value) : String(value || "").trim().toLowerCase();
  }

  // Make the global skip helper robust for all online bidding calls.
  if (typeof onlineIncrementSkipV44 === "function") {
    onlineIncrementSkipV44 = function (user) {
      if (!user) return;
      user.bidSkips = clampSkipsStep17(Number(user.bidSkips || 0) + 1);
    };
  }
  if (typeof onlineBidSkipsLeftV44 === "function") {
    onlineBidSkipsLeftV44 = function (user) {
      return Math.max(0, BID_SKIPS_ALLOWED - clampSkipsStep17(user?.bidSkips));
    };
  }
  if (typeof onlineBidSkipsUsedV44 === "function") {
    onlineBidSkipsUsedV44 = function (user) {
      return clampSkipsStep17(user?.bidSkips);
    };
  }

  function findActionCardStep17() {
    if (!online.enabled || !state || state.gameMode !== "bid" || ratingsRevealed) return null;
    const blindBtn = $("submitBlindBidBtn");
    if (blindBtn && !blindBtn.disabled) return blindBtn.closest(".bid-order-card");
    const liveBidBtn = $("submitLiveBidBtnStep2");
    const livePassBtn = $("passLiveBidBtnStep2");
    if ((liveBidBtn && !liveBidBtn.disabled) || (livePassBtn && !livePassBtn.disabled)) {
      return (liveBidBtn || livePassBtn).closest(".live-auction-panel-step2, .bid-order-card");
    }
    return null;
  }

  function applyActionHighlightStep17() {
    document.querySelectorAll(".online-action-needed-step17").forEach(card => card.classList.remove("online-action-needed-step17"));
    document.querySelectorAll(".online-action-banner-step17").forEach(n => n.remove());
    const card = findActionCardStep17();
    if (!card) return;
    card.classList.add("online-action-needed-step17");
    const banner = document.createElement("div");
    banner.className = "online-action-banner-step17";
    const isLive = state?.onlineBidMode === "live";
    banner.innerHTML = `<span>YOUR GO</span><span>${isLive ? "Bid or pass" : "Submit your bid"}</span>`;
    card.insertBefore(banner, card.firstChild);
  }

  function polishHeadersStep17() {
    if (!online.enabled || !state) return;
    const boardEyebrow = document.querySelector(".teams-card > .section-title-row .eyebrow");
    const boardTitle = document.querySelector(".teams-card > .section-title-row h2");
    if (boardEyebrow) boardEyebrow.textContent = "Draft board";
    if (boardTitle) boardTitle.textContent = "Teams";
  }

  function removeDuplicateHelperTextStep17() {
    if (!online.enabled || !state) return;
    if (els?.message) {
      const txt = (els.message.textContent || "").trim();
      if (/^Live auction open for/i.test(txt) || /^It is your turn/i.test(txt) || /^Active player pool/i.test(txt)) {
        els.message.textContent = "";
      }
    }
    const pill = document.getElementById("activeYearRangePillStep5");
    if (pill && online.enabled) pill.style.display = "none";
  }

  function soloPoolTextNoCountStep17() {
    const pill = document.getElementById("activeYearRangePillStep5");
    if (!pill || online.enabled) return;
    pill.style.display = "";
    pill.textContent = pill.textContent.replace(/\s*\(\d+\s+players\)/i, "");
  }

  function repairNoFirstBidSkipStep17() {
    if (!online.enabled || !state || state.gameMode !== "bid" || state.onlineBidMode !== "live") return;
    const auction = state.liveAuction;
    if (!auction?.noFirstBidKeys || !state.users) return;
    Object.keys(auction.noFirstBidKeys).forEach(key => {
      if (!auction.noFirstBidKeys[key]) return;
      const user = state.users.find(u => userKeyStep17(u.name) === key);
      if (!user) return;
      // If no-first-bid is recorded but the skip counter did not move, repair to at least 1.
      if (clampSkipsStep17(user.bidSkips) < 1) user.bidSkips = 1;
      user.bidSkips = clampSkipsStep17(user.bidSkips);
    });
  }

  function applyStep17() {
    injectStep17Styles();
    repairNoFirstBidSkipStep17();
    polishHeadersStep17();
    removeDuplicateHelperTextStep17();
    soloPoolTextNoCountStep17();
    setTimeout(applyActionHighlightStep17, 0);
  }

  const previousRenderStep17 = render;
  render = function (...args) {
    const result = previousRenderStep17.apply(this, args);
    applyStep17();
    return result;
  };

  const previousApplyRemoteDataStep17 = applyRemoteData;
  applyRemoteData = function (...args) {
    const result = previousApplyRemoteDataStep17.apply(this, args);
    applyStep17();
    return result;
  };

  const previousRenderOnlineBidControlsStep17 = renderOnlineBidControlsV38;
  renderOnlineBidControlsV38 = function (...args) {
    const result = previousRenderOnlineBidControlsStep17.apply(this, args);
    applyStep17();
    return result;
  };

  const previousSetMessageStep17 = setMessage;
  setMessage = function (message) {
    const txt = String(message || "");
    if (online.enabled && (/^Live auction open for/i.test(txt) || /^It is your turn/i.test(txt) || /^Active player pool/i.test(txt))) {
      return previousSetMessageStep17.call(this, "");
    }
    return previousSetMessageStep17.apply(this, arguments);
  };

  const previousResetStep17 = resetGame;
  resetGame = function (...args) {
    const result = previousResetStep17.apply(this, args);
    document.querySelectorAll(".online-action-banner-step17").forEach(n => n.remove());
    return result;
  };

  applyStep17();
})();

// --- step19 realtime database leaderboard submit on results reveal ---
// Adds a "Submit to leaderboard" button to the final results screen.
// The button appears after ratings are revealed, validates the username,
// then writes the top final score into Realtime Database at /leaderboard.
(function () {
  function leaderboardGameModeLabelStep19() {
    if (!state) return "Unknown";
    if (state.challengePreset === "leaguelegends" || window.challengePreset === "leaguelegends") {
      return "League Legends Challenge";
    }
    if (!online.enabled &&
    state.gameMode === "draft" &&
    Number(state.userCount || 0) === 1) {

    if (window.challengePreset === "worldcup2026") {
        return "World Cup 2026 Challenge";
    }

    if (window.challengePreset === "ultimate") {
        return "Ultimate Solo Mode";
    }

    if (window.challengePreset === "easy") {
        return "Easy Solo Challenge";
    }

    return "Solo Challenge";
    }
    if (online.enabled && state.gameMode === "draft") {
      return "Online Ultimate Draft";
    }
    if (online.enabled && state.gameMode === "bid" && state.onlineBidMode === "live") {
      return "Online Live Auction";
    }
    if (online.enabled && state.gameMode === "bid") {
      return "Online Blind Bidding";
    }
    if (state.gameMode === "bid") {
      return "Local Bidding";
    }
    return "Ultimate Draft";
  }

  function cleanLeaderboardTeamStep19(user) {
    return Array.isArray(user?.team)
      ? user.team.map(player => ({
          name: player.player || "",
          year: Number(player.year || 0),
          position: player.mainPosition || player.position || "",
          rating: Number(player.rating || 0),
          club: player.club || "",
          nation: player.nation || ""
        }))
      : [];
  }

  async function submitCurrentResultToLeaderboardStep19() {
    if (!state || !ratingsRevealed) {
      alert("Reveal the ratings first.");
      return;
    }

    if (state.leaderboardSubmitted) {
      alert("This result has already been submitted from this screen.");
      return;
    }

    const scored = getFinalScores();
    const top = scored[0];

    if (!top) {
      alert("No score found to submit.");
      return;
    }

    const defaultName = top.user?.name && top.user.name !== "You" ? top.user.name : "";
    const username = prompt("Enter leaderboard name (3-18 letters/numbers):", defaultName || "");

    if (username === null) return;

    if (!validateUsername(username)) {
      alert("Invalid username. Use 3-18 characters: letters, numbers, spaces, underscores or hyphens. Avoid reserved names.");
      return;
    }

    await ensureFirebase();

    await firebase.database().ref("leaderboard").push({
      username: username.trim(),
      score: Number(top.total || 0),
      gameMode: leaderboardGameModeLabelStep19(),
      online: !!online.enabled,
      roomId: online.enabled ? (online.roomId || "") : "",
      yearRange: state.yearRange || null,
      team: cleanLeaderboardTeamStep19(top.user),
      timestamp: Date.now()
    });

    state.leaderboardSubmitted = true;

    const btn = document.getElementById("submitLeaderboardBtnStep19");
    if (btn) {
      btn.textContent = "Submitted ✅";
      btn.disabled = true;
    }

    alert("Score submitted to leaderboard.");
  }

  function addLeaderboardButtonStep19() {
    if (!state || !ratingsRevealed) return;

    const actions = document.querySelector("#resultsPanel .finished-actions");
    if (!actions) return;

    let btn = document.getElementById("submitLeaderboardBtnStep19");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "submitLeaderboardBtnStep19";
      btn.type = "button";
      btn.className = "btn btn-success";
      btn.textContent = state.leaderboardSubmitted ? "Submitted ✅" : "Submit to leaderboard";
      actions.insertBefore(btn, actions.firstChild);
    }

    btn.disabled = !!state.leaderboardSubmitted;
    btn.onclick = safe(submitCurrentResultToLeaderboardStep19);
  }

  const previousRenderResultsStep19 = renderResults;
  renderResults = function (...args) {
    const result = previousRenderResultsStep19.apply(this, args);
    addLeaderboardButtonStep19();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const previousShowFinishedResultsPageStep19 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function (...args) {
      const result = previousShowFinishedResultsPageStep19.apply(this, args);
      addLeaderboardButtonStep19();
      return result;
    };
  }
})();


// --- step20 dedicated leaderboard page and tabs ---
// Adds the header Leaderboard button, a dedicated leaderboard page, and tabs for game modes.
(function () {
  let activeLeaderboardFilterStep20 = "all";
  let activeSoloLeaderboardFilterStep20 = "solo";

  function escapeHtmlStep20(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
  }

  function normaliseModeStep20(mode) {
    return String(mode || "Unknown").trim() || "Unknown";
  }

  function hideMainPanelsStep20() {
    show($("gameEntryPanel"), false);
    show(els?.setupPanel, false);
    show(els?.gamePanel, false);
    show(els?.resultsPanel, false);
  }

  async function loadLeaderboardStep20(filter = activeLeaderboardFilterStep20) {
    const list = $("leaderboardList");
    if (!list) return;

    list.innerHTML = `<div class="leaderboard-empty">Loading leaderboard...</div>`;

    try {
      await ensureFirebase();
      const snapshot = await firebase.database().ref("leaderboard").once("value");

      if (!snapshot.exists()) {
        list.innerHTML = `<div class="leaderboard-empty">No scores submitted yet.</div>`;
        return;
      }

      let entries = Object.values(snapshot.val() || {});

      entries = entries
        .filter(entry => Number.isFinite(Number(entry.score)))
        .map(entry => ({
          username: String(entry.username || "Player").trim() || "Player",
          score: Number(entry.score || 0),
          gameMode: normaliseModeStep20(entry.gameMode),
          timestamp: Number(entry.timestamp || 0)
        }));

      if (!filter || filter === "all") {
        entries = entries.filter(entry => entry.gameMode !== "League Legends Challenge");
      }

      if (filter && filter !== "all") {

        if (filter === "solo") {

          entries = entries.filter(entry =>
            entry.gameMode === "Solo Challenge" ||
            entry.gameMode === "Ultimate Solo Mode" ||
            entry.gameMode === "Easy Solo Challenge" ||
            entry.gameMode === "World Cup 2026 Challenge"
          );
          entries = entries.filter(entry => entry.gameMode !== "League Legends Challenge");

        } else {

          entries = entries.filter(entry =>
            entry.gameMode === filter
          );

        }
      }

      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.timestamp - a.timestamp;
      });

      const top20 = entries.slice(0, 20);

      if (!top20.length) {
        list.innerHTML = `<div class="leaderboard-empty">No scores yet for this leaderboard.</div>`;
        return;
      }

      list.innerHTML = top20.map((entry, index) => `
        <div class="leaderboard-row">
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${escapeHtmlStep20(entry.username)}</span>
          <span class="leaderboard-score">${entry.score}</span>
          <span class="leaderboard-mode">${escapeHtmlStep20(entry.gameMode)}</span>
        </div>
      `).join("");

    } catch (error) {
      list.innerHTML = `<div class="leaderboard-error">Could not load leaderboard. ${escapeHtmlStep20(error.message || error)}</div>`;
    }
  }

  async function openLeaderboardStep20() {
    hideMainPanelsStep20();
    show($("leaderboardPanel"), true);

    setActiveLeaderboardTabStep20(activeLeaderboardFilterStep20);

    if (activeLeaderboardFilterStep20 === "solo") {
      setActiveSoloLeaderboardTabStep20(activeSoloLeaderboardFilterStep20);
      await loadLeaderboardStep20(activeSoloLeaderboardFilterStep20);
    } else {
      await loadLeaderboardStep20(activeLeaderboardFilterStep20);
    }

    setTimeout(() => $("leaderboardPanel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  function closeLeaderboardStep20() {
    show($("leaderboardPanel"), false);

    if (state) {
      show(els?.gamePanel, true);
      show(els?.resultsPanel, !!ratingsRevealed);
    } else {
      show($("gameEntryPanel"), true);
      show(els?.setupPanel, false);
    }
  }

  function setActiveLeaderboardTabStep20(filter) {
    activeLeaderboardFilterStep20 = filter || "all";

    document.querySelectorAll(".leaderboard-tab[data-leaderboard-filter]").forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.leaderboardFilter === activeLeaderboardFilterStep20
      );
    });

    const soloSubTabs =
      document.getElementById("soloLeaderboardSubTabs");

    if (soloSubTabs) {
      soloSubTabs.classList.toggle(
        "hidden",
        activeLeaderboardFilterStep20 !== "solo"
      );
    }
  }

  function setActiveSoloLeaderboardTabStep20(filter) {
    activeSoloLeaderboardFilterStep20 = filter || "solo";

    document.querySelectorAll(".solo-sub-tab").forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.soloLeaderboardFilter === activeSoloLeaderboardFilterStep20
      );
    });
  }

  function wireLeaderboardPageStep20() {
    // v64: disabled older leaderboard opener to avoid a brief flash before the rebuilt leaderboard renders.
    // The final leaderboard click handler below opens and renders the v55/v64 leaderboard directly.
    $("leaderboardBackBtn")?.addEventListener("click", closeLeaderboardStep20);

    document.querySelectorAll(".leaderboard-tab[data-leaderboard-filter]").forEach(tab => {
      tab.addEventListener("click", safe(async () => {
        const filter =
          tab.dataset.leaderboardFilter || "all";

        setActiveLeaderboardTabStep20(filter);

        if (filter === "solo") {
          activeSoloLeaderboardFilterStep20 = "solo";
          setActiveSoloLeaderboardTabStep20("solo");
          await loadLeaderboardStep20("solo");
        } else {
          await loadLeaderboardStep20(filter);
        }
      }));
    });

    document.querySelectorAll(".solo-sub-tab").forEach(tab => {
      tab.addEventListener("click", safe(async () => {
        const filter =
          tab.dataset.soloLeaderboardFilter || "solo";

        activeSoloLeaderboardFilterStep20 = filter;
        setActiveSoloLeaderboardTabStep20(filter);
        await loadLeaderboardStep20(filter);
      }));
    });
  }

  const previousResetGameStep20 = resetGame;
  resetGame = function (...args) {
    window.challengePreset = "standard";
    console.log("Challenge reset");
    show($("leaderboardPanel"), false);
    return previousResetGameStep20.apply(this, args);
  };

  wireLeaderboardPageStep20();
})();

document.addEventListener('click', function(e){

    if (e.target.closest('#resetBtn')) {

        window.challengePreset = "standard";

        console.log(
            "Challenge reset to standard"
        );
    }

}, true);

window.challengePreset = 'standard';

document.addEventListener('click', function(e){

    const card = e.target.closest('.active-challenge');

    if (!card) return;

    window.challengePreset =
        card.dataset.challenge;

    console.log(
        "Selected:",
        window.challengePreset
    );

    const localBtn =
        document.getElementById(
            'startLocalGameBtn'
        );

    if (localBtn) {
        localBtn.click();
    }

});


/* =====================================================================
   ULTIMATE 5-A-SIDE ONLINE BIDDING FIXES - VERSION 2
   ---------------------------------------------------------------------
   Targeted fixes only:
   - Solo modes are left untouched.
   - Online Blind Bidding: skip/life counters are forced to persist and
     zero bids always cost exactly one skip for eligible users.
   - Online Live Auction: rewritten as a strict turn-based auction.
     The first bidder rotates each player, users act in order, and a pass
     costs one skip only if that user has not already bid on that player.
   ===================================================================== */
(function onlineBiddingFixV2(){
  const SAVE_DELAY_MS_V2 = 1800;

  function clampSkipV2(n){ return Math.min(BID_SKIPS_ALLOWED, Math.max(0, Math.floor(Number(n || 0)))); }
  function keyV2(value){ return safeKey(typeof value === 'string' ? value : value?.name); }
  function meV2(){
    if (!online.enabled || !state?.users) return null;
    v29SafeState();
    return state.users.find(u => keyV2(u) === keyV2(online.myName)) || null;
  }
  function usedSkipsV2(user){ return clampSkipV2(user?.bidSkips); }
  function leftSkipsV2(user){ return Math.max(0, BID_SKIPS_ALLOWED - usedSkipsV2(user)); }
  function incSkipV2(user){ if (user) user.bidSkips = clampSkipV2(usedSkipsV2(user) + 1); }
  onlineBidSkipsUsedV44 = usedSkipsV2;
  onlineBidSkipsLeftV44 = leftSkipsV2;
  onlineIncrementSkipV44 = incSkipV2;

  function maxBidV2(user, candidate=currentCandidate){
    if (typeof onlineMaxBidForCandidateV45 === 'function') return onlineMaxBidForCandidateV45(user, candidate);
    return Math.max(0, Math.floor(Number(user?.budget || 0)));
  }
  function eligibleForCandidateV2(candidate=currentCandidate){
    if (!state || !candidate) return [];
    v29SafeState();
    return state.users.filter(u => getNeededPositions(u).includes(candidate.mainPosition) && maxBidV2(u, candidate) > 0);
  }
  function allNeededPositionsV2(){
    const s = new Set();
    (state?.users || []).forEach(u => getNeededPositions(u).forEach(p => s.add(p)));
    return s;
  }
  function ensureBidMetaV2(){
    if (!state) return;
    if (!Array.isArray(state.onlineBidOrderBaseV2) || state.onlineBidOrderBaseV2.length !== state.users.length) {
      state.onlineBidOrderBaseV2 = shuffleArray([...Array(state.users.length).keys()]).map(i => keyV2(state.users[i]));
    }
    state.onlineBidRoundV2 = Math.max(0, Math.floor(Number(state.onlineBidRoundV2 || 0)));
  }
  function rotatingOrderV2(eligible){
    ensureBidMetaV2();
    const eligibleKeys = new Set(eligible.map(keyV2));
    let base = state.onlineBidOrderBaseV2.filter(k => state.users.some(u => keyV2(u) === k));
    state.users.forEach(u => { const k=keyV2(u); if (!base.includes(k)) base.push(k); });
    const raw = base.filter(k => eligibleKeys.has(k));
    if (!raw.length) return [];
    const shift = state.onlineBidRoundV2 % raw.length;
    return raw.slice(shift).concat(raw.slice(0, shift));
  }
  function initLiveAuctionV2(candidate=currentCandidate){
    const eligible = eligibleForCandidateV2(candidate);
    const order = rotatingOrderV2(eligible);
    state.liveAuction = {
      v2: true,
      orderKeys: order,
      turnKey: order[0] || '',
      highestKey: '',
      highestName: '',
      highestBid: 0,
      passedKeys: {},
      bidKeys: {},
      skipPenaltyKeys: {},
      autoOutKeys: {},
      outcome: null,
      openedAt: Date.now()
    };
    return state.liveAuction;
  }
  function auctionV2(){
    if (!state.liveAuction || !state.liveAuction.v2) return initLiveAuctionV2();
    const a = state.liveAuction;
    a.orderKeys ||= [];
    a.turnKey ||= '';
    a.highestKey ||= '';
    a.highestName ||= '';
    a.highestBid = Math.max(0, Math.floor(Number(a.highestBid || 0)));
    a.passedKeys ||= {};
    a.bidKeys ||= {};
    a.skipPenaltyKeys ||= {};
    a.autoOutKeys ||= {};
    a.outcome ||= null;
    return a;
  }
  function userByKeyV2(key){ return (state?.users || []).find(u => keyV2(u) === key) || null; }
  function activeKeysV2(candidate=currentCandidate, a=auctionV2()){
    return eligibleForCandidateV2(candidate).map(keyV2).filter(k => !a.passedKeys[k] && !a.autoOutKeys[k]);
  }
  function canBeatCurrentV2(user, a=auctionV2(), candidate=currentCandidate){
    return maxBidV2(user, candidate) >= Math.max(1, a.highestBid + 1);
  }
  function advanceTurnV2(){
    const a = auctionV2();
    const order = a.orderKeys.length ? a.orderKeys : rotatingOrderV2(eligibleForCandidateV2());
    a.orderKeys = order;
    if (!order.length) { a.turnKey = ''; return; }
    let start = Math.max(0, order.indexOf(a.turnKey));
    for (let step=1; step<=order.length; step++) {
      const k = order[(start + step) % order.length];
      const u = userByKeyV2(k);
      if (!u || a.passedKeys[k] || a.autoOutKeys[k]) continue;
      if (a.highestKey && k === a.highestKey) continue;
      if (!canBeatCurrentV2(u, a)) { a.autoOutKeys[k] = true; continue; }
      a.turnKey = k;
      return;
    }
    a.turnKey = '';
  }
  function shouldResolveV2(){
    const a = auctionV2();
    const active = activeKeysV2();
    if (!active.length) return true;
    if (a.highestBid <= 0) return active.every(k => !!a.passedKeys[k] || !!a.autoOutKeys[k]);
    return active.every(k => k === a.highestKey || !!a.passedKeys[k] || !!a.autoOutKeys[k] || !canBeatCurrentV2(userByKeyV2(k), a));
  }

  async function drawBlindCandidateV2(){
    await ensurePlayersReady();
    v29SafeState();
    if (isGameComplete()) { completeGame(); render(); await saveOnlineState('Bidding complete. Reveal ratings to see the winner.'); return; }
    const needed = allNeededPositionsV2();
    const sourcePlayers = (typeof window.getUltimate5AsideFilteredPlayersForCurrentGame === 'function' && state?.yearRange)
      ? window.getUltimate5AsideFilteredPlayersForCurrentGame()
      : players;
    const pool = sourcePlayers.filter(p => needed.has(p.mainPosition) && !state.acceptedPlayerNames.has(p.player));
    if (!pool.length) { completeGame(); render(); await saveOnlineState('No more eligible players. Reveal ratings to see the winner.'); return; }
    currentCandidate = pool[Math.floor(Math.random()*pool.length)];
    state.blindBids = {};
    state.bidOutcome = null;
    state.bidSubmittingLocked = false;
    renderCandidate(currentCandidate);
    renderOnlineBidControlsV38();
    await saveOnlineState(`Blind bidding open for ${currentCandidate.player}.`);
  }

  async function drawLiveCandidateV2(){
    await ensurePlayersReady();
    v29SafeState();
    state.onlineBidMode = 'live';
    if (isGameComplete()) { completeGame(); render(); await saveOnlineState('Bidding complete. Reveal ratings to see the winner.'); return; }
    const needed = allNeededPositionsV2();
    const sourcePlayers = (typeof window.getUltimate5AsideFilteredPlayersForCurrentGame === 'function' && state?.yearRange)
      ? window.getUltimate5AsideFilteredPlayersForCurrentGame()
      : players;
    const pool = sourcePlayers.filter(p => needed.has(p.mainPosition) && !state.acceptedPlayerNames.has(p.player));
    if (!pool.length) { completeGame(); render(); await saveOnlineState('No more eligible players. Reveal ratings to see the winner.'); return; }
    currentCandidate = pool[Math.floor(Math.random()*pool.length)];
    initLiveAuctionV2(currentCandidate);
    renderCandidate(currentCandidate);
    renderOnlineBidControlsV38();
    await saveOnlineState(`Live auction open for ${currentCandidate.player}.`);
  }

  function selectedOnlineBidModeFromLobbyV2(){
    const selected = document.querySelector('#onlineBidModeSelectorStep2 .online-bid-mode-card-step2.selected');
    return selected?.dataset?.onlineBidMode === 'live' ? 'live' : 'blind';
  }

  startOnlineGameFromLobby = async function startOnlineGameFromLobbyV2(){
    if (!online.enabled || !online.isHost || !online.ref) return;
    await ensurePlayersReady();
    const snap = await online.ref.child('participants').once('value');
    const names = participantNamesFromObject(snap.val()).slice(0, 4);
    if (names.length < (selectedGameMode === 'bid' ? 2 : 1)) {
      throw new Error(selectedGameMode === 'bid' ? 'Bid mode needs at least 2 players.' : 'At least 1 player is needed.');
    }
    startNewGame(selectedGameMode, names, true);
    if (selectedGameMode !== 'bid') { await saveOnlineState('Online game started.'); return; }
    ensureBidMetaV2();
    state.onlineBidMode = selectedOnlineBidModeFromLobbyV2();
    if (state.onlineBidMode === 'live') await drawLiveCandidateV2();
    else await drawBlindCandidateV2();
  };

  drawOnlineBlindBidCandidateV38 = async function drawOnlineBidCandidateRouterV2(){
    if (online.enabled && state?.gameMode === 'bid' && state?.onlineBidMode === 'live') return drawLiveCandidateV2();
    return drawBlindCandidateV2();
  };

  function renderBlindV2(){
    initialiseBlindBidStateV38();
    v29SafeState();
    show(els.draftControls, false); show(els.bidControls, true); show(els.declinesPill, false); show(els.budgetPill, false);
    if (els.bidPickBtn) els.bidPickBtn.classList.add('hidden');
    if (els.awardBidBtn) els.awardBidBtn.classList.add('hidden');
    if (els.skipBidBtn) els.skipBidBtn.classList.add('hidden');
    const me = meV2();
    const eligible = eligibleForCandidateV2();
    const eligibleKeys = new Set(eligible.map(keyV2));
    const myKey = keyV2(online.myName);
    const myBid = state.blindBids?.[myKey];
    const submittedCount = eligible.filter(u => state.blindBids?.[keyV2(u)]?.submitted).length;
    if (els.bidOrderDisplay) els.bidOrderDisplay.innerHTML = `<div class="bid-status-summary"><strong>Blind bidding</strong><span>${submittedCount}/${eligible.length} eligible bids submitted</span></div>`;
    if (!els.bidInputs) return;
    if (!currentCandidate && isGameComplete()) { els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`; syncRevealButtonV37?.(); return; }
    if (!currentCandidate && !state.bidOutcome) { els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`; return; }
    if (state.bidOutcome) {
      const o = state.bidOutcome;
      els.bidInputs.innerHTML = `<div class="bid-order-card"><p class="eyebrow">Bids revealed</p><h3>${escapeHtml(o.player?.player || 'Player')}</h3><p class="message">${o.winnerName ? `${escapeHtml(o.winnerName)} wins ${escapeHtml(o.player?.player || 'the player')} for £${o.winningBid}m${o.tie ? ' after a tied highest bid' : ''}.` : `No valid bids above £0m. ${escapeHtml(o.player?.player || 'The player')} was skipped.`}</p>${(o.bids||[]).map(r=>`<div class="bid-row"><label>${escapeHtml(r.name)}</label><div class="bid-submit-status submitted">£${Number(r.bid||0)}m</div></div>`).join('')}${o.zeroBidNames?.length ? `<p class="muted">${escapeHtml(o.zeroBidNames.join(', '))} ${o.zeroBidNames.length===1?'loses':'lose'} one skip for bidding £0m.</p>`:''}<p class="muted">Next player loading...</p></div>`;
      return;
    }
    const canSubmit = !!me && eligibleKeys.has(myKey) && !myBid?.submitted && !state.bidSubmittingLocked;
    const myBudget = Number(me?.budget || 0);
    const myMax = me ? maxBidV2(me) : 0;
    const mySkips = leftSkipsV2(me);
    const draft = typeof getBlindBidDraftV39 === 'function' ? getBlindBidDraftV39('0') : '0';
    const submitBox = canSubmit ? `<div class="bid-order-card"><p class="eyebrow">Your blind bid</p><h3>${escapeHtml(currentCandidate.player)}</h3><p class="muted">Enter your bid privately. You must leave enough money to complete your remaining squad slots.</p><div class="bid-row"><label for="onlineBlindBidInput">Your bid<span class="bid-help">Budget left: £${myBudget}m • Max bid: £${myMax}m • Skips left: ${mySkips}/${BID_SKIPS_ALLOWED}${mySkips<=0 ? ' • must bid above £0m' : ''}</span></label><input id="onlineBlindBidInput" type="number" min="0" max="${myMax}" step="1" value="${escapeHtml(draft)}" /></div><button id="submitBlindBidBtn" class="btn btn-primary" type="button">Submit blind bid</button></div>` : `<div class="bid-order-card"><p class="eyebrow">Your blind bid</p><p class="muted">${myBid?.submitted ? 'Your bid has been submitted. Waiting for everyone else.' : eligibleKeys.has(myKey) ? 'Bidding is locked while results are being calculated.' : 'You are not eligible for this player because your team does not need this position, or you do not have enough budget.'}</p></div>`;
    const statusRows = state.users.map(u=>{ const k=keyV2(u); const elig=eligibleKeys.has(k); const sub=!!state.blindBids?.[k]?.submitted; return `<div class="bid-row"><label>${escapeHtml(u.name)}<span class="bid-help">Budget left: £${Number(u.budget||0)}m • Max bid: £${elig?maxBidV2(u):0}m • Skips left: ${leftSkipsV2(u)}/${BID_SKIPS_ALLOWED}</span></label><div class="bid-submit-status ${sub?'submitted':'waiting'}">${elig ? (sub?'Bid submitted ✅':(leftSkipsV2(u)<=0?'Must bid above £0m':'Waiting for bid')) : 'Not eligible for this position'}</div></div>`; }).join('');
    els.bidInputs.innerHTML = submitBox + `<div class="bid-order-card"><p class="eyebrow">Submission status</p>${statusRows}</div>`;
    const inp=$('onlineBlindBidInput'); if (inp && typeof setBlindBidDraftV39 === 'function') { inp.addEventListener('input', e=>setBlindBidDraftV39(e.target.value)); inp.addEventListener('change', e=>setBlindBidDraftV39(e.target.value)); }
    $('submitBlindBidBtn')?.addEventListener('click', safe(submitBlindBidV2));
  }

  async function submitBlindBidV2(){
    if (!online.enabled || !state || state.gameMode !== 'bid' || state.onlineBidMode === 'live' || !currentCandidate) return;
    initialiseBlindBidStateV38(); v29SafeState();
    const me = meV2(); if (!me) throw new Error('You are not listed in this online game.');
    const myKey = keyV2(me);
    const eligibleKeys = new Set(eligibleForCandidateV2().map(keyV2));
    if (!eligibleKeys.has(myKey)) throw new Error('You are not eligible to bid for this player.');
    if (state.blindBids?.[myKey]?.submitted) return;
    const bid = Math.max(0, Math.floor(Number($('onlineBlindBidInput')?.value || (typeof getBlindBidDraftV39 === 'function' ? getBlindBidDraftV39('0') : 0))));
    if (!Number.isFinite(bid)) throw new Error('Enter a valid bid.');
    const maxBid = maxBidV2(me);
    if (bid > maxBid) throw new Error(`Your maximum bid is £${maxBid}m because you need to keep enough money to complete your team.`);
    if (bid <= 0 && leftSkipsV2(me) <= 0) throw new Error('You have used all 3 skips and must bid above £0m.');
    state.blindBids[myKey] = { name: me.name, bid, submitted: true, submittedAt: Date.now() };
    if (typeof clearBlindBidDraftV39 === 'function') clearBlindBidDraftV39();
    const eligible = eligibleForCandidateV2();
    if (eligible.every(u => state.blindBids?.[keyV2(u)]?.submitted)) await resolveBlindV2();
    else { renderBlindV2(); await saveOnlineState(`${me.name} submitted a blind bid.`); }
  }

  async function resolveBlindV2(){
    if (!currentCandidate) return;
    state.bidSubmittingLocked = true;
    const candidate = v29NormalisePlayer(currentCandidate);
    const eligible = eligibleForCandidateV2(candidate);
    const bids = eligible.map(u => ({ name:u.name, bid:Math.max(0, Math.floor(Number(state.blindBids?.[keyV2(u)]?.bid || 0))), budget:Number(u.budget||0), maxBid:maxBidV2(u,candidate) }));
    const zeroBidNames=[];
    bids.forEach(r => { if (r.bid <= 0) { const u=userByKeyV2(keyV2(r.name)); if (u) { incSkipV2(u); zeroBidNames.push(u.name); } } });
    const valid = bids.filter(r => r.bid > 0 && r.bid <= r.budget && r.bid <= r.maxBid).sort((a,b)=>b.bid-a.bid || a.name.localeCompare(b.name));
    let winnerName=null, winningBid=0, tie=false;
    if (valid.length) {
      const high=valid[0].bid; const tied=valid.filter(r=>r.bid===high); tie=tied.length>1; const win=tied[Math.floor(Math.random()*tied.length)];
      winnerName=win.name; winningBid=win.bid;
      const winner=userByKeyV2(keyV2(winnerName));
      if (winner) { winner.team.push({...candidate, price:winningBid}); winner.budget=Math.max(0, Number(winner.budget||0)-winningBid); winner.spent=Number(winner.spent||0)+winningBid; state.acceptedPlayerNames.add(candidate.player); }
    }
    state.bidOutcome = { player:candidate, bids, winnerName, winningBid, tie, zeroBidNames, resolvedAt:Date.now() };
    currentCandidate=null; renderOnlineBidControlsV38(); renderTeams();
    await saveOnlineState(winnerName ? `${winnerName} won ${candidate.player} for £${winningBid}m.${zeroBidNames.length ? ' ' + zeroBidNames.join(', ') + ' ' + (zeroBidNames.length===1?'loses':'lose') + ' one skip.' : ''}` : `${candidate.player} was skipped.${zeroBidNames.length ? ' ' + zeroBidNames.join(', ') + ' ' + (zeroBidNames.length===1?'loses':'lose') + ' one skip.' : ''}`);
    setTimeout(async()=>{ if (isGameComplete()) { completeGame(); render(); await saveOnlineState('Bidding complete. Reveal ratings to see the winner.'); } else await drawBlindCandidateV2(); }, SAVE_DELAY_MS_V2);
  }

  function renderLiveV2(){
    v29SafeState();
    const a = auctionV2();
    show(els.draftControls, false); show(els.bidControls, true); show(els.declinesPill, false); show(els.budgetPill, false);
    if (els.bidPickBtn) els.bidPickBtn.classList.add('hidden');
    if (els.awardBidBtn) els.awardBidBtn.classList.add('hidden');
    if (els.skipBidBtn) els.skipBidBtn.classList.add('hidden');
    if (els.bidOrderDisplay) els.bidOrderDisplay.innerHTML = `<div class="bid-status-summary"><strong>Live auction</strong><span>${a.highestBid>0 ? `Highest bid: £${a.highestBid}m by ${escapeHtml(a.highestName)}` : 'No bids yet'}${a.turnKey ? ` • Turn: ${escapeHtml(userByKeyV2(a.turnKey)?.name || '')}` : ''}</span></div>`;
    if (!els.bidInputs) return;
    if (!currentCandidate && isGameComplete()) { els.bidInputs.innerHTML = `<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>`; syncRevealButtonV37?.(); return; }
    if (a.outcome) {
      els.bidInputs.innerHTML = `<div class="bid-order-card"><p class="eyebrow">Auction result</p><h3>${escapeHtml(a.outcome.player?.player || 'Player')}</h3><p class="message">${a.outcome.type==='awarded' ? `${escapeHtml(a.outcome.winnerName)} wins ${escapeHtml(a.outcome.player?.player || 'the player')} for £${a.outcome.amount}m.` : `${escapeHtml(a.outcome.player?.player || 'The player')} was skipped.`}</p>${a.outcome.skipPenaltyNames?.length ? `<p class="muted">${escapeHtml(a.outcome.skipPenaltyNames.join(', '))} ${a.outcome.skipPenaltyNames.length===1?'loses':'lose'} one skip for passing without bidding.</p>`:''}<p class="muted">Next player loading...</p></div>`; return;
    }
    if (!currentCandidate) { els.bidInputs.innerHTML = `<p class="muted">Waiting for the next player...</p>`; return; }
    const me=meV2(); const myKey=keyV2(online.myName); const isMyTurn=a.turnKey===myKey; const eligibleKeys=new Set(eligibleForCandidateV2().map(keyV2));
    const minBid=Math.max(1, a.highestBid+1); const myMax=me?maxBidV2(me):0; const mySkips=leftSkipsV2(me); const alreadyBid=!!a.bidKeys[myKey]; const canBid=!!me && isMyTurn && eligibleKeys.has(myKey) && !a.passedKeys[myKey] && myMax>=minBid; const passCostsSkip=!alreadyBid; const canPass=!!me && isMyTurn && eligibleKeys.has(myKey) && !a.passedKeys[myKey] && (!passCostsSkip || mySkips>0 || !canBid);
    const actionBox = isMyTurn && (canBid || canPass) ? `<div class="bid-order-card live-auction-panel-step2"><div class="live-auction-top-step2"><div><p class="eyebrow">Your action</p><h3>${escapeHtml(currentCandidate.player)}</h3><p class="muted">${a.highestBid>0 ? `Bid more than £${a.highestBid}m or pass.` : 'Make the first bid or pass.'} ${passCostsSkip ? 'Passing before you have bid costs one skip.' : 'You have already bid for this player, so passing is free.'}</p></div><div class="live-highest-step2">${a.highestBid>0 ? `£${a.highestBid}m<br><span class="muted">${escapeHtml(a.highestName)}</span>` : 'No bids yet'}</div></div><div class="live-auction-actions-step2"><div class="bid-row"><label for="onlineLiveBidInput">Your bid<span class="bid-help">Budget: £${Number(me?.budget||0)}m • Max bid: £${myMax}m • Skips left: ${mySkips}/${BID_SKIPS_ALLOWED}</span></label><input id="onlineLiveBidInput" type="number" min="${minBid}" max="${myMax}" step="1" value="${Math.min(myMax,minBid)}" ${canBid?'':'disabled'} /></div><button id="submitLiveBidBtnStep2" class="btn btn-primary" type="button" ${canBid?'':'disabled'}>Bid</button><button id="passLiveBidBtnStep2" class="btn btn-danger" type="button" ${canPass?'':'disabled'}>No / Pass</button></div></div>` : `<div class="bid-order-card"><p class="eyebrow">Your action</p><p class="muted">${eligibleKeys.has(myKey) ? (a.passedKeys[myKey] ? 'You have passed on this player. Waiting for the auction to finish.' : a.highestKey===myKey ? 'You are currently the highest bidder. Waiting for the others.' : `Waiting for ${escapeHtml(userByKeyV2(a.turnKey)?.name || 'the current player')}.`) : 'You are not eligible for this player because your team does not need this position, or you do not have enough budget.'}</p></div>`;
    const statusRows = state.users.map(u=>{ const k=keyV2(u); let status='Not eligible', cls=''; if(a.highestKey===k){status=`Highest £${a.highestBid}m`;cls='highest';} else if(a.passedKeys[k]){status=a.skipPenaltyKeys[k]?'Passed - skip used':'Passed';cls='passed';} else if(a.autoOutKeys[k]){status='Cannot beat bid';cls='passed';} else if(eligibleKeys.has(k)){status=(a.turnKey===k?'Your go':'Waiting');cls='ready';} return `<div class="live-status-row-step2"><div><strong>${escapeHtml(u.name)}</strong><div class="bid-help">Budget: £${Number(u.budget||0)}m • Max: £${maxBidV2(u)}m • Skips left: ${leftSkipsV2(u)}/${BID_SKIPS_ALLOWED}${a.bidKeys[k]?' • has bid':''}</div></div><span class="live-status-pill-step2 ${cls}">${escapeHtml(status)}</span></div>`; }).join('');
    els.bidInputs.innerHTML = actionBox + `<div class="bid-order-card"><p class="eyebrow">Auction status</p><div class="live-status-list-step2">${statusRows}</div></div>`;
    $('submitLiveBidBtnStep2')?.addEventListener('click', safe(submitLiveBidV2));
    $('passLiveBidBtnStep2')?.addEventListener('click', safe(passLiveBidV2));
  }

  async function submitLiveBidV2(){
    if (!online.enabled || !state || state.gameMode !== 'bid' || state.onlineBidMode !== 'live' || !currentCandidate) return;
    v29SafeState(); const a=auctionV2(); const me=meV2(); if(!me) throw new Error('You are not listed in this online game.'); const k=keyV2(me);
    if (a.turnKey !== k) throw new Error('It is not your turn.');
    if (a.passedKeys[k]) throw new Error('You have already passed on this player.');
    const bid=Math.max(0, Math.floor(Number($('onlineLiveBidInput')?.value || 0))); const min=Math.max(1, a.highestBid+1); const max=maxBidV2(me);
    if (!Number.isFinite(bid) || bid < min) throw new Error(`Your bid must be at least £${min}m.`);
    if (bid > max) throw new Error(`Your maximum bid is £${max}m because you need to keep enough money to complete your team.`);
    a.highestKey=k; a.highestName=me.name; a.highestBid=bid; a.bidKeys[k]=true;
    advanceTurnV2();
    if (shouldResolveV2()) await resolveLiveV2();
    else { renderLiveV2(); await saveOnlineState(`${me.name} bid £${bid}m for ${currentCandidate.player}.`); }
  }
  async function passLiveBidV2(){
    if (!online.enabled || !state || state.gameMode !== 'bid' || state.onlineBidMode !== 'live' || !currentCandidate) return;
    v29SafeState(); const a=auctionV2(); const me=meV2(); if(!me) throw new Error('You are not listed in this online game.'); const k=keyV2(me);
    if (a.turnKey !== k) throw new Error('It is not your turn.');
    if (a.passedKeys[k]) return;
    const alreadyBid=!!a.bidKeys[k];
    const canBid=canBeatCurrentV2(me,a);
    if (!alreadyBid && canBid) {
      if (leftSkipsV2(me) <= 0) throw new Error('You have used all 3 skips and must bid above £0m.');
      incSkipV2(me); a.skipPenaltyKeys[k]=true;
    }
    a.passedKeys[k]=true;
    advanceTurnV2();
    if (shouldResolveV2()) await resolveLiveV2();
    else { renderLiveV2(); await saveOnlineState(`${me.name} passed on ${currentCandidate.player}${!alreadyBid && canBid ? ' and used one skip' : ''}.`); }
  }
  async function resolveLiveV2(){
    const a=auctionV2(); const candidate=v29NormalisePlayer(currentCandidate); if(!candidate) return;
    const penaltyNames = Object.keys(a.skipPenaltyKeys||{}).map(k=>userByKeyV2(k)?.name).filter(Boolean);
    if (a.highestBid > 0 && a.highestKey) {
      const winner=userByKeyV2(a.highestKey);
      if (winner) { winner.team.push({...candidate, price:a.highestBid}); winner.budget=Math.max(0, Number(winner.budget||0)-a.highestBid); winner.spent=Number(winner.spent||0)+a.highestBid; state.acceptedPlayerNames.add(candidate.player); }
      a.outcome={type:'awarded', player:candidate, winnerName:winner?.name || a.highestName, amount:a.highestBid, skipPenaltyNames:penaltyNames, resolvedAt:Date.now()};
    } else {
      a.outcome={type:'skipped', player:candidate, skipPenaltyNames:penaltyNames, resolvedAt:Date.now()};
    }
    currentCandidate=null; renderLiveV2(); renderTeams();
    const msg=a.outcome.type==='awarded' ? `${a.outcome.winnerName} won ${candidate.player} for £${a.outcome.amount}m.` : `${candidate.player} was skipped.`;
    await saveOnlineState(`${msg}${penaltyNames.length ? ' ' + penaltyNames.join(', ') + ' ' + (penaltyNames.length===1?'loses':'lose') + ' one skip.' : ''}`);
    state.onlineBidRoundV2 = Math.max(0, Math.floor(Number(state.onlineBidRoundV2 || 0))) + 1;
    setTimeout(async()=>{ if(isGameComplete()){ completeGame(); render(); await saveOnlineState('Bidding complete. Reveal ratings to see the winner.'); } else await drawLiveCandidateV2(); }, SAVE_DELAY_MS_V2);
  }

  renderOnlineBidControlsV38 = function renderOnlineBidControlsV2(){
    if (!online.enabled || !state || state.gameMode !== 'bid') return;
    if (state.onlineBidMode === 'live') return renderLiveV2();
    return renderBlindV2();
  };

  const prevRenderV2 = render;
  render = function renderWrappedV2(...args){
    const result = prevRenderV2.apply(this,args);
    if (online.enabled && state?.gameMode === 'bid') renderOnlineBidControlsV38();
    return result;
  };
  const prevApplyRemoteV2 = applyRemoteData;
  applyRemoteData = function applyRemoteWrappedV2(data){
    const result = prevApplyRemoteV2.call(this,data);
    if (online.enabled && state?.gameMode === 'bid' && !ratingsRevealed) renderOnlineBidControlsV38();
    return result;
  };
})();


/* =====================================================================
   ULTIMATE 5-A-SIDE ONLINE BIDDING FIXES - VERSION 3
   ---------------------------------------------------------------------
   - Removes the incorrect bottom orange turn/waiting box (#turnLockNote).
   - Ensures online blind bidding and live auction candidate pools respect
     the host's selected year range.
   ===================================================================== */
(function onlineBiddingFixV3(){
  function removeIncorrectTurnBoxV3(){
    const note = document.getElementById('turnLockNote');
    if (note) note.remove();
  }

  // Hide it immediately via CSS as well, so it never flashes during Firebase updates.
  if (!document.getElementById('removeTurnLockNoteV3Styles')) {
    const style = document.createElement('style');
    style.id = 'removeTurnLockNoteV3Styles';
    style.textContent = '#turnLockNote{display:none!important;}';
    document.head.appendChild(style);
  }

  // Keep existing button-permission logic, but remove the incorrect message box afterwards.
  if (typeof applyOnlinePermissions === 'function') {
    const previousApplyOnlinePermissionsV3 = applyOnlinePermissions;
    applyOnlinePermissions = function(...args){
      const result = previousApplyOnlinePermissionsV3.apply(this,args);
      removeIncorrectTurnBoxV3();
      return result;
    };
  }

  // Also remove after every render/remote update because older wrappers can recreate it.
  if (typeof render === 'function') {
    const previousRenderV3 = render;
    render = function(...args){
      const result = previousRenderV3.apply(this,args);
      removeIncorrectTurnBoxV3();
      return result;
    };
  }

  if (typeof applyRemoteData === 'function') {
    const previousApplyRemoteDataV3 = applyRemoteData;
    applyRemoteData = function(...args){
      const result = previousApplyRemoteDataV3.apply(this,args);
      removeIncorrectTurnBoxV3();
      return result;
    };
  }

  // Belt-and-braces observer for Firebase/browser timing cases.
  if (!window.ultimate5AsideTurnBoxObserverV3) {
    window.ultimate5AsideTurnBoxObserverV3 = new MutationObserver(removeIncorrectTurnBoxV3);
    window.ultimate5AsideTurnBoxObserverV3.observe(document.body, { childList: true, subtree: true });
  }

  // Expose a reliable filtered online pool helper for any later online draw code.
  window.getUltimate5AsideOnlineFilteredPoolV3 = function(){
    if (typeof window.getUltimate5AsideFilteredPlayersForCurrentGame === 'function' && state?.yearRange) {
      return window.getUltimate5AsideFilteredPlayersForCurrentGame();
    }
    if (state?.yearRange) {
      const r = state.yearRange;
      return (Array.isArray(players) ? players : []).filter(p => Number(p.year || p.Game_Year || 0) >= Number(r.start) && Number(p.year || p.Game_Year || 0) <= Number(r.end));
    }
    return Array.isArray(players) ? players : [];
  };

  // Re-wrap the public online candidate router so blind bidding definitely uses the filtered pool.
  // Live auction v2 draws were also directly edited above, but this keeps future routes safe.
  if (typeof drawOnlineBlindBidCandidateV38 === 'function') {
    const previousDrawOnlineBidCandidateV3 = drawOnlineBlindBidCandidateV38;
    drawOnlineBlindBidCandidateV38 = async function(...args){
      const originalPlayers = players;
      if (state?.yearRange) players = window.getUltimate5AsideOnlineFilteredPoolV3();
      try {
        return await previousDrawOnlineBidCandidateV3.apply(this,args);
      } finally {
        players = originalPlayers;
        removeIncorrectTurnBoxV3();
      }
    };
  }

  removeIncorrectTurnBoxV3();
})();


/* =====================================================================
   ULTIMATE 5-A-SIDE SOLO MODE FIX - VERSION 4
   ---------------------------------------------------------------------
   Fix: Ultimate Solo Mode must always use the full all-years player pool.
   If a user previously changed the Solo Challenge year filter, the locked
   Ultimate Solo Mode slider is now reset to the full range before setup
   and before the game starts.
   ===================================================================== */
(function ultimateSoloFullRangeFixV4(){
  function allYearsRangeV4(){
    const years = (Array.isArray(players) ? players : [])
      .map(p => Number(p.year || p.Game_Year || 0))
      .filter(Boolean)
      .sort((a,b) => a-b);
    const min = years.length ? years[0] : 2005;
    const max = years.length ? years[years.length - 1] : 2026;
    return { start:min, end:max, min, max };
  }

  function setTextV4(id, value){
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function resetLocalYearSliderToAllYearsV4(){
    const r = allYearsRangeV4();
    const start = document.getElementById('localYearStartStep4');
    const end = document.getElementById('localYearEndStep4');
    if (start) {
      start.min = String(r.min);
      start.max = String(r.max);
      start.value = String(r.start);
      start.disabled = true;
    }
    if (end) {
      end.min = String(r.min);
      end.max = String(r.max);
      end.value = String(r.end);
      end.disabled = true;
    }
    setTextV4('localYearLabelStep4', `${r.start} - ${r.end}`);
    setTextV4('localYearStartValueStep4', r.start);
    setTextV4('localYearEndValueStep4', r.end);
    const count = document.getElementById('localYearCountStep4');
    if (count) count.textContent = '';
    const fill = document.getElementById('localYearFillStep4');
    if (fill) {
      fill.style.left = '0%';
      fill.style.right = '0%';
    }
    const holder = document.getElementById('localYearSlicerHolderStep4');
    if (holder) {
      holder.style.opacity = '0.4';
      holder.style.pointerEvents = 'none';
      const label = holder.querySelector('label');
      if (label) label.textContent = 'Player pool locked to all years';
      const values = holder.querySelector('.year-slicer-values-step4');
      if (values) values.innerHTML = `<span style="width:100%;text-align:center;">All years active (${r.start} - ${r.end})</span>`;
      const help = holder.querySelector('.year-slicer-help-step4');
      if (help) help.textContent = '';
    }
    return r;
  }

  function unlockLocalYearSliderIfNotUltimateV4(){
    if (window.challengePreset === 'ultimate') return;
    document.querySelectorAll('#localYearSlicerHolderStep4 input[type="range"]').forEach(input => input.disabled = false);
    const holder = document.getElementById('localYearSlicerHolderStep4');
    if (holder) {
      holder.style.opacity = '';
      holder.style.pointerEvents = '';
    }
  }

  function applyUltimateSetupV4(){
    if (window.challengePreset === 'ultimate') {
      resetLocalYearSliderToAllYearsV4();
    } else {
      unlockLocalYearSliderIfNotUltimateV4();
    }
  }

  // When entering the setup screen, force the Ultimate Solo slider back to all years.
  if (typeof configureSoloSetupStep7 === 'function') {
    const previousConfigureSoloSetupV4 = configureSoloSetupStep7;
    configureSoloSetupStep7 = function(...args){
      const result = previousConfigureSoloSetupV4.apply(this,args);
      setTimeout(applyUltimateSetupV4, 0);
      setTimeout(applyUltimateSetupV4, 50);
      return result;
    };
  }

  // Before the game starts, set the actual DOM slider values to all years so the existing
  // Step 4 lockRangeBeforeStart logic stores the correct range in state.yearRange.
  if (typeof startNewGame === 'function') {
    const previousStartNewGameV4 = startNewGame;
    startNewGame = function(gameMode, names, isOnlineGame){
      let fullRange = null;
      if (!isOnlineGame && window.challengePreset === 'ultimate') {
        fullRange = resetLocalYearSliderToAllYearsV4();
      }
      const result = previousStartNewGameV4.apply(this, arguments);
      if (!isOnlineGame && window.challengePreset === 'ultimate' && state) {
        state.yearRange = fullRange || allYearsRangeV4();
      }
      return result;
    };
  }

  // Make the globally exposed filtered-pool helper return the full database for Ultimate Solo.
  const previousFilteredPoolV4 = window.getUltimate5AsideFilteredPlayersForCurrentGame;
  window.getUltimate5AsideFilteredPlayersForCurrentGame = function(){
    if (window.challengePreset === 'ultimate') {
      return Array.isArray(players) ? players : [];
    }
    if (typeof previousFilteredPoolV4 === 'function') return previousFilteredPoolV4();
    return Array.isArray(players) ? players : [];
  };

  // Keep the in-game note honest if it appears.
  if (typeof render === 'function') {
    const previousRenderV4 = render;
    render = function(...args){
      const result = previousRenderV4.apply(this,args);
      if (window.challengePreset === 'ultimate' && state) {
        const r = allYearsRangeV4();
        state.yearRange = { start:r.start, end:r.end };
        const pill = document.getElementById('activeYearRangePillStep5');
        if (pill) pill.textContent = `Active player pool: All years (${r.start} - ${r.end})`;
      }
      return result;
    };
  }

  document.addEventListener('click', function(e){
    const card = e.target.closest('.active-challenge[data-challenge="ultimate"]');
    if (!card) return;
    setTimeout(applyUltimateSetupV4, 0);
    setTimeout(applyUltimateSetupV4, 100);
  }, true);
})();


/* =====================================================================
   MONTHLY CHALLENGE - JULY 2026 WORLD CUP 2026
   Adds a Monthly Challenges page, makes July live, loads the dedicated
   players_worldcup2026.json pool, and reuses Solo Challenge gameplay.
   ===================================================================== */
(function monthlyWorldCup2026ChallengeV1(){
  const WC_PRESET = "worldcup2026";
  const WC_MODE_LABEL = "World Cup 2026 Challenge";
  let worldCupPlayers = [];
  let worldCupPlayersPromise = null;

  function isWorldCupChallenge(){
    return window.challengePreset === WC_PRESET;
  }

  function normaliseWorldCupRows(data){
    const rows = Array.isArray(data) ? data : [];
    return rows.map((p, idx) => {
      const position = p.Position ?? p.position ?? p.POS ?? p.pos ?? "";
      const main = p.Main_Position ?? p.mainPosition ?? p.MainPosition ?? p.main_position ?? "";
      return {
        id: `wc2026-${idx + 1}`,
        player: String(p.Player ?? p.player ?? p.Name ?? p.name ?? "").trim(),
        year: Number(p.Game_Year ?? p.year ?? p.Year ?? p.gameYear ?? 2026),
        rating: Number(p.Rating_OVR ?? p.rating ?? p.OVR ?? p.ovr ?? p.Rating ?? 0),
        position: String(position || main || "").trim(),
        mainPosition: normalisePosition(main, position),
        club: String(p.Club ?? p.club ?? "").trim(),
        nation: String(p.Nation ?? p.nation ?? p.Squad_Nation ?? "").trim(),
        squadNation: String(p.Squad_Nation ?? p.squadNation ?? p.Nation ?? "").trim(),
        challengeMode: String(p.Challenge_Mode ?? p.challengeMode ?? "WC2026").trim()
      };
    }).filter(p => p.player && p.rating > 0 && TEAM_SHAPE.includes(p.mainPosition));
  }

  async function loadWorldCupPlayers(){
    if (worldCupPlayersPromise) return worldCupPlayersPromise;
    worldCupPlayersPromise = (async () => {
      const response = await fetch("players_worldcup2026.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load players_worldcup2026.json - HTTP ${response.status}`);
      worldCupPlayers = normaliseWorldCupRows(await response.json());
      if (!worldCupPlayers.length) throw new Error("players_worldcup2026.json loaded but no valid World Cup players were found.");
      console.log(`Loaded ${worldCupPlayers.length} World Cup 2026 challenge players`);
      return worldCupPlayers;
    })();
    return worldCupPlayersPromise;
  }

  window.loadWorldCup2026Players = loadWorldCupPlayers;
  window.getWorldCup2026Players = () => worldCupPlayers.slice();

  async function withWorldCupPool(fn){
    if (!isWorldCupChallenge()) return await fn();
    await loadWorldCupPlayers();
    await loadPlayers();
    const originalPlayers = players;
    players = worldCupPlayers.slice();
    try { return await fn(); }
    finally { players = originalPlayers; }
  }

  function ensureMonthlyPanel(){
    let panel = document.getElementById("monthlyChallengesPanel");
    if (panel) return panel;
    const shell = document.querySelector(".app-shell") || document.body;
    panel = document.createElement("section");
    panel.id = "monthlyChallengesPanel";
    panel.className = "card monthly-challenges-panel hidden";
    panel.innerHTML = `
      <div class="section-title-row monthly-title-row">
        <div>
          <p class="eyebrow">Monthly Challenges</p>
          <h2>Monthly Challenges</h2>
          <p class="muted monthly-lead">Play limited-time solo challenges with special player pools. More months will be added here.</p>
        </div>
        <button id="monthlyChallengesBackBtn" class="btn btn-secondary" type="button">Back</button>
      </div>
      <div class="monthly-challenge-grid">
        <button type="button" class="monthly-challenge-card live" id="playWorldCup2026ChallengeBtn">
          <span class="challenge-badge">LIVE</span>
          <h3>July 2026: World Cup 2026</h3>
          <p>Draft your solo 5-a-side team from the dedicated World Cup 2026 player pool. No year filter. No normal player-pool data.</p>
          <span class="challenge-action">Play Now &rarr;</span>
        </button>
      </div>
    `;
    const leaderboard = document.getElementById("leaderboardPanel");
    if (leaderboard) shell.insertBefore(panel, leaderboard);
    else shell.appendChild(panel);
    document.getElementById("monthlyChallengesBackBtn")?.addEventListener("click", function(){
      show(panel, false);
      show(document.getElementById("gameEntryPanel"), true);
    });
    document.getElementById("playWorldCup2026ChallengeBtn")?.addEventListener("click", safe(openWorldCupSetup));
    return panel;
  }

  function hideAllMainPanelsForMonthly(){
    show(document.getElementById("gameEntryPanel"), false);
    show(els?.setupPanel, false);
    show(els?.gamePanel, false);
    show(els?.resultsPanel, false);
    show(document.getElementById("leaderboardPanel"), false);
    show(ensureLobby?.(), false);
  }

  function openMonthlyChallenges(){
    ensureMonthlyPanel();
    hideAllMainPanelsForMonthly();
    show(document.getElementById("monthlyChallengesPanel"), true);
    setTimeout(() => document.getElementById("monthlyChallengesPanel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  async function openWorldCupSetup(){
    window.challengePreset = WC_PRESET;
    online.enabled = false;
    await loadWorldCupPlayers();
    show(document.getElementById("monthlyChallengesPanel"), false);
    hideEntryPanel();
    show(els.setupPanel, true);
    if (typeof updateSetupForMode === "function") updateSetupForMode();
    setTimeout(applyWorldCupSetupUi, 0);
    setTimeout(applyWorldCupSetupUi, 80);
  }

  function clearWorldCupSetupUi(){
    document.querySelectorAll(".worldcup-year-hidden").forEach(el => el.classList.remove("worldcup-year-hidden"));
  }

  function applyWorldCupSetupUi(){
    if (!isWorldCupChallenge()) { clearWorldCupSetupUi(); return; }
    const heroEyebrow = document.querySelector("#setupPanel .setup-copy .eyebrow");
    const heroTitle = document.querySelector("#setupPanel .setup-copy h2");
    const heroLead = document.querySelector("#setupPanel .setup-copy .setup-lead");
    if (heroEyebrow) heroEyebrow.textContent = "July Monthly Challenge";
    if (heroTitle) heroTitle.textContent = "World Cup 2026 Challenge";
    if (heroLead) heroLead.textContent = "Solo Challenge rules with a dedicated World Cup 2026 player pool. The usual year filter is disabled for this challenge.";
    if (els.startBtn) els.startBtn.textContent = "Start World Cup 2026 Challenge";

    const soloIntro = document.getElementById("soloSetupIntroStep7");
    if (soloIntro) {
      soloIntro.style.display = "";
      soloIntro.innerHTML = `<h3>World Cup 2026 Challenge</h3><p>July monthly challenge. Draft from the World Cup 2026 player pool only. No year filter.</p>`;
    }

    const yearCard = document.getElementById("localYearSlicerHolderStep4");
    if (yearCard) yearCard.classList.add("worldcup-year-hidden");

    if (els.gameModeDescription) {
      els.gameModeDescription.textContent = "World Cup 2026 Challenge: solo draft using only the dedicated World Cup 2026 player pool.";
      els.gameModeDescription.classList.remove("solo-local-hidden-step7");
    }
  }

  function patchEntryPanel(){
    const panel = document.getElementById("gameEntryPanel");
    if (!panel || panel.dataset.worldCupMonthlyPatched === "1") return;
    const cards = [...panel.querySelectorAll(".challenge-card-v2")];
    const monthly = cards.find(card => /monthly challenges/i.test(card.textContent || ""));
    if (monthly) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "challenge-card-v2 monthly-challenges-entry active-monthly-challenge";
      button.innerHTML = `<span class="challenge-badge">LIVE</span><h4>📅 Monthly Challenges</h4><p>July 2026: World Cup 2026</p><span class="challenge-action">Play Now &rarr;</span>`;
      monthly.replaceWith(button);
      button.addEventListener("click", openMonthlyChallenges);
      panel.dataset.worldCupMonthlyPatched = "1";
    }
  }

  if (typeof injectEntryPanel === "function") {
    const previousInjectEntryPanelWC = injectEntryPanel;
    injectEntryPanel = function(...args){
      const result = previousInjectEntryPanelWC.apply(this, args);
      ensureMonthlyPanel();
      patchEntryPanel();
      return result;
    };
  }

  if (typeof updateSetupForMode === "function") {
    const previousUpdateSetupForModeWC = updateSetupForMode;
    updateSetupForMode = function(...args){
      const result = previousUpdateSetupForModeWC.apply(this, args);
      setTimeout(applyWorldCupSetupUi, 0);
      return result;
    };
  }

  if (typeof startNewGame === "function") {
    const previousStartNewGameWC = startNewGame;
    startNewGame = function(gameMode, names, isOnlineGame){
      const wasWorldCup = !isOnlineGame && isWorldCupChallenge();
      const result = previousStartNewGameWC.apply(this, arguments);
      if (wasWorldCup && state) {
        state.yearRange = null;
        state.challengePreset = WC_PRESET;
        state.challengeName = WC_MODE_LABEL;
        document.body.classList.add("worldcup-challenge-active");
      }
      return result;
    };
  }

  if (typeof pickRandomPlayer === "function") {
    const previousPickRandomPlayerWC = pickRandomPlayer;
    pickRandomPlayer = async function(...args){
      return await withWorldCupPool(() => previousPickRandomPlayerWC.apply(this, args));
    };
  }

  document.addEventListener("click", function(event){
    if (!isWorldCupChallenge()) return;
    if (event.target?.closest?.("#startBtn") && !online.enabled && !els.setupPanel?.classList.contains("hidden")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      safe(async function(){
        await loadWorldCupPlayers();
        selectedGameMode = "draft";
        online.enabled = false;
        startNewGame("draft", ["You"], false);
      })();
    }
    if (event.target?.closest?.("#pickBtn")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      safe(function(){ return pickRandomPlayer(); })();
    }
  }, true);

  if (typeof render === "function") {
    const previousRenderWC = render;
    render = function(...args){
      const result = previousRenderWC.apply(this, args);
      patchEntryPanel();
      ensureMonthlyPanel();
      if (isWorldCupChallenge() && state) {
        if (els.turnEyebrow) els.turnEyebrow.textContent = "World Cup 2026 Challenge";
        let pill = document.getElementById("activeWorldCupPillV1");
        if (!pill && els.message) {
          pill = document.createElement("div");
          pill.id = "activeWorldCupPillV1";
          pill.className = "turn-lock-note worldcup-lock-note";
          els.message.insertAdjacentElement("afterend", pill);
        }
        if (pill) pill.textContent = `Active monthly challenge: World Cup 2026 player pool (${worldCupPlayers.length || "World Cup"} players). Year filter disabled.`;
      }
      return result;
    };
  }

  if (typeof resetGame === "function") {
    const previousResetGameWC = resetGame;
    resetGame = function(...args){
      document.body.classList.remove("worldcup-challenge-active");
      document.getElementById("activeWorldCupPillV1")?.remove();
      clearWorldCupSetupUi();
      return previousResetGameWC.apply(this, args);
    };
  }

  document.addEventListener("click", function(event){
    const otherChallenge = event.target?.closest?.(".active-challenge:not([data-challenge='worldcup2026'])");
    if (otherChallenge) clearWorldCupSetupUi();
  }, true);

  ensureMonthlyPanel();
  patchEntryPanel();
})();

// --- v46 completed game stats tracking ---
// Records one completed game to Firebase Realtime Database when all teams are complete.
// This runs even if the user never submits to the leaderboard.
(function completedGameStatsV46(){
  const STATS_NODE_V46 = "stats";

  function ukDateKeyV46(date = new Date()) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(date);
    } catch (err) {
      return date.toISOString().slice(0, 10);
    }
  }

  function statsModeLabelV46() {
    if (!state) return "Unknown";

    if (!online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1) {
      if (window.challengePreset === "leaguelegends" || state.challengePreset === "leaguelegends") {
        return "League Legends Challenge";
      }
      if (window.challengePreset === "league" || state.challengePreset === "league") {
        return "League Challenge";
      }
      if (window.challengePreset === "worldcup2026" || state.challengePreset === "worldcup2026") {
        return "World Cup 2026 Challenge";
      }
      if (window.challengePreset === "ultimate" || state.challengePreset === "ultimate") {
        return "Ultimate Solo Mode";
      }
      if (window.challengePreset === "easy" || state.challengePreset === "easy") {
        return "Easy Solo Challenge";
      }
      return "Solo Challenge";
    }

    if (online.enabled && state.gameMode === "draft") return "Online Ultimate Draft";
    if (online.enabled && state.gameMode === "bid" && state.onlineBidMode === "live") return "Online Live Auction";
    if (online.enabled && state.gameMode === "bid") return "Online Blind Bidding";
    if (!online.enabled && state.gameMode === "bid") return "Local Bidding";
    if (!online.enabled && state.gameMode === "draft") return "Local Ultimate Draft";

    return state.gameMode || "Unknown";
  }

  function statsModeKeyV46(label) {
    return String(label || "unknown")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "unknown";
  }

  function highestScoreV46() {
    try {
      const scored = typeof getFinalScores === "function" ? getFinalScores() : [];
      return Number(scored?.[0]?.total || 0);
    } catch (err) {
      return 0;
    }
  }

  async function recordCompletedGameStatsV46() {
    if (!state) return;

    try {
      await ensureFirebase();

      const label = statsModeLabelV46();
      const key = statsModeKeyV46(label);
      const today = ukDateKeyV46();
      const now = Date.now();
      const increment = firebase.database.ServerValue.increment(1);

      const updates = {};

      // Overall totals.
      updates[`${STATS_NODE_V46}/totals/all`] = increment;
      updates[`${STATS_NODE_V46}/totals/byMode/${key}`] = increment;
      updates[`${STATS_NODE_V46}/modeLabels/${key}`] = label;

      // Daily counters, used for checking specific time periods.
      updates[`${STATS_NODE_V46}/daily/${today}/total`] = increment;
      updates[`${STATS_NODE_V46}/daily/${today}/byMode/${key}`] = increment;

      // Useful lightweight metadata.
      updates[`${STATS_NODE_V46}/lastCompletedAt`] = now;
      updates[`${STATS_NODE_V46}/lastCompletedMode`] = label;
      updates[`${STATS_NODE_V46}/daily/${today}/lastCompletedAt`] = now;

      // Keep a small audit trail as well as the counters.
      const recentRef = firebase.database().ref(`${STATS_NODE_V46}/recent`).push();
      updates[`${STATS_NODE_V46}/recent/${recentRef.key}`] = {
        mode: label,
        modeKey: key,
        online: !!online.enabled,
        roomId: online.enabled ? (online.roomId || "") : "",
        userCount: Number(state.userCount || (Array.isArray(state.users) ? state.users.length : 0) || 0),
        topScore: highestScoreV46(),
        challengePreset: state.challengePreset || window.challengePreset || "",
        completedAt: now,
        dateKey: today
      };

      await firebase.database().ref().update(updates);
      console.log("Completed game stats recorded:", label);
    } catch (err) {
      // Never block the game/results screen if stats tracking fails.
      console.warn("Could not record completed game stats", err);
    }
  }

  if (typeof completeGame === "function") {
    const previousCompleteGameStatsV46 = completeGame;

    completeGame = function(...args) {
      const shouldRecord = !!(
        state &&
        !state.statsRecorded &&
        typeof isGameComplete === "function" &&
        isGameComplete()
      );

      if (shouldRecord) {
        state.statsRecorded = true;
        state.statsRecordedAt = Date.now();
        state.statsMode = statsModeLabelV46();
      }

      const result = previousCompleteGameStatsV46.apply(this, args);

      if (shouldRecord) {
        recordCompletedGameStatsV46();
      }

      return result;
    };
  }
})();


// --- v53 safe solo labels + cleaner saved/share pitch image ---
// Minimal patch: does not alter leaderboard submit logic or reveal flow.
(function safeResultsAndImageV53(){
  function isSoloResultV53(){
    return !!(
      state &&
      !online.enabled &&
      state.gameMode === "draft" &&
      Number(state.userCount || state.users?.length || 0) === 1
    );
  }

  function modeLabelV53(){
    if (!state) return "Ultimate 5-a-side Draft";
    if (isSoloResultV53()) {
      const preset = window.challengePreset || state.challengePreset || "";
      if (preset === "worldcup2026") return "World Cup 2026 Challenge";
      if (preset === "ultimate") return "Ultimate Solo Mode";
      if (preset === "easy") return "Easy Solo Challenge";
      return "Solo Challenge";
    }
    if (online.enabled && state.gameMode === "draft") return "Online Ultimate Draft";
    if (online.enabled && state.gameMode === "bid" && state.onlineBidMode === "live") return "Online Live Auction";
    if (online.enabled && state.gameMode === "bid") return "Online Blind Bidding";
    if (!online.enabled && state.gameMode === "bid") return "Local Bidding";
    return "Ultimate Draft";
  }

  function ordinalV53(index){
    const n = index + 1;
    const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
    return `${n}${suffix} place`;
  }

  function injectV53Styles(){
    if (document.getElementById("safeResultsAndImageV53Styles")) return;
    const style = document.createElement("style");
    style.id = "safeResultsAndImageV53Styles";
    style.textContent = `
      #resultsPanel .solo-score-pill-v53 {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        width: fit-content;
        margin-top: 8px;
        padding: 12px 18px;
        border-radius: 999px;
        background: linear-gradient(135deg, #dcfce7, #dbeafe);
        color: #0f172a;
        font-weight: 950;
        box-shadow: 0 14px 32px rgba(15,23,42,.10);
      }
      #resultsPanel .solo-score-pill-v53 strong {
        color: #1d4ed8;
        font-size: 1.25rem;
      }
      #resultsPanel .finished-team-card.solo-result-card-v53 {
        border-color: rgba(37,99,235,.26) !important;
        box-shadow: 0 18px 52px rgba(37,99,235,.12) !important;
      }
      #resultsPanel .finished-team-card.solo-result-card-v53 .finished-rank {
        color: #1d4ed8;
      }
      #resultsPanel .finished-player-name {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        overflow-wrap: anywhere;
      }
    `;
    document.head.appendChild(style);
  }

  function polishSoloResultsDomV53(){
    if (!isSoloResultV53()) return;
    injectV53Styles();
    const scored = getFinalScores();
    const score = scored[0]?.total ?? 0;

    const hero = document.querySelector("#resultsPanel .finished-hero");
    if (hero) {
      const eyebrow = hero.querySelector(".eyebrow");
      const title = hero.querySelector("h2");
      const intro = hero.querySelector(".muted");
      const winner = hero.querySelector(".winner-badge-large");
      if (eyebrow) eyebrow.textContent = modeLabelV53();
      if (title) title.textContent = "Your final score";
      if (intro) intro.textContent = "Ratings are revealed. Here is your completed 5-a-side score.";
      if (winner) {
        winner.className = "solo-score-pill-v53";
        winner.innerHTML = `Score: <strong>${score}</strong>`;
      }
    }

    const card = document.querySelector("#resultsPanel .finished-team-card");
    if (card) {
      card.classList.remove("winner");
      card.classList.add("solo-result-card-v53");
    }

    const rank = document.querySelector("#resultsPanel .finished-rank");
    if (rank) rank.textContent = "Final score";
  }

  const previousRenderResultsV53 = renderResults;
  renderResults = function(...args){
    const result = previousRenderResultsV53.apply(this, args);
    polishSoloResultsDomV53();
    return result;
  };

  function roundRectV53(ctx, x, y, w, h, r){
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fitTextV53(ctx, text, x, y, maxWidth, font, color){
    ctx.font = font;
    ctx.fillStyle = color || "#0f172a";
    let output = String(text || "");
    while (output.length > 3 && ctx.measureText(output).width > maxWidth) {
      output = output.slice(0, -2) + "…";
    }
    ctx.fillText(output, x, y);
  }

  function wrapTextV53(ctx, text, x, y, maxWidth, lineHeight, maxLines){
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    const clipped = lines.slice(0, maxLines);
    if (lines.length > maxLines && clipped.length) {
      let last = clipped[clipped.length - 1];
      while (last.length > 3 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      clipped[clipped.length - 1] = `${last}…`;
    }
    clipped.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
  }

  function drawBrandV53(ctx){
    const logo = document.querySelector('img[alt*="Ultimate 5-a-side"], img[src*="LOGO"]');
    if (logo && logo.complete && logo.naturalWidth) {
      try {
        ctx.drawImage(logo, 74, 42, 106, 106);
        return 204;
      } catch (err) {}
    }
    const g = ctx.createLinearGradient(74, 42, 180, 148);
    g.addColorStop(0, "#22c55e");
    g.addColorStop(1, "#2563eb");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(127, 95, 53, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "950 30px Arial";
    ctx.fillText("5", 117, 105);
    return 204;
  }

  function teamSlotsV53(user){
    const team = Array.isArray(user?.team) ? user.team : [];
    const mids = team.filter(p => (p.mainPosition || p.position) === "MID");
    return {
      GK: team.find(p => (p.mainPosition || p.position) === "GK") || null,
      DEF: team.find(p => (p.mainPosition || p.position) === "DEF") || null,
      MID1: mids[0] || null,
      MID2: mids[1] || null,
      FWD: team.find(p => (p.mainPosition || p.position) === "FWD") || null
    };
  }

  function drawPlayerCardV53(ctx, player, label, cx, cy, boxW, boxH){
    ctx.save();
    ctx.translate(cx - boxW / 2, cy - boxH / 2);

    // More modern/punchy card: slim blue accent, position pill, compact text, circular rating.
    ctx.fillStyle = "rgba(248,250,252,.985)";
    roundRectV53(ctx, 0, 0, boxW, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(147,197,253,.95)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#2563eb";
    roundRectV53(ctx, 0, 0, 9, boxH, 20);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    roundRectV53(ctx, 20, 16, 58, 32, 14);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, 49, 38);
    ctx.textAlign = "left";

    if (!player) {
      ctx.fillStyle = "#64748b";
      ctx.font = "900 20px Arial";
      ctx.fillText("Empty", 92, 43);
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "900 18px Arial";
    wrapTextV53(ctx, player.player || "", 92, 32, boxW - 172, 20, 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "800 12.5px Arial";
    const meta = `${shortenClub(player.club)}${player.year ? ` • ${player.year}` : ""}`;
    fitTextV53(ctx, meta, 92, boxH - 17, boxW - 178, "800 12.5px Arial", "#64748b");

    ctx.fillStyle = "#dbeafe";
    ctx.beginPath();
    ctx.arc(boxW - 39, 39, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1d4ed8";
    ctx.font = "950 26px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(player.rating || ""), boxW - 39, 48);
    ctx.restore();
  }

  function drawPitchV53(ctx, user, x, y, w, h){
    const pitch = ctx.createLinearGradient(x, y, x + w, y + h);
    pitch.addColorStop(0, "#166534");
    pitch.addColorStop(.52, "#16a34a");
    pitch.addColorStop(1, "#15803d");
    ctx.fillStyle = pitch;
    roundRectV53(ctx, x, y, w, h, 34);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    roundRectV53(ctx, x, y, w, h, 34);
    ctx.clip();

    for (let i = 0; i < 10; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,.045)" : "rgba(0,0,0,.035)";
      ctx.fillRect(x + i * w / 10, y, w / 10, h);
    }

    ctx.strokeStyle = "rgba(255,255,255,.78)";
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(78, h * .105), 0, Math.PI * 2);
    ctx.stroke();

    const penaltyW = w * .36;
    const penaltyH = h * .16;
    ctx.strokeRect(x + (w - penaltyW) / 2, y + 3, penaltyW, penaltyH);
    ctx.strokeRect(x + (w - penaltyW) / 2, y + h - penaltyH - 3, penaltyW, penaltyH);

    const goalW = w * .18;
    const goalH = h * .055;
    ctx.strokeRect(x + (w - goalW) / 2, y + 3, goalW, goalH);
    ctx.strokeRect(x + (w - goalW) / 2, y + h - goalH - 3, goalW, goalH);
    ctx.restore();

    const slots = teamSlotsV53(user);
    const cardW = Math.min(382, w * .335);
    const cardH = 116;

    drawPlayerCardV53(ctx, slots.FWD, "FWD", x + w / 2, y + h * .135, cardW, cardH);
    drawPlayerCardV53(ctx, slots.MID1, "MID", x + w * .285, y + h * .385, cardW, cardH);
    drawPlayerCardV53(ctx, slots.MID2, "MID", x + w * .715, y + h * .385, cardW, cardH);
    drawPlayerCardV53(ctx, slots.DEF, "DEF", x + w / 2, y + h * .645, cardW, cardH);
    drawPlayerCardV53(ctx, slots.GK, "GK", x + w / 2, y + h * .885, cardW, cardH);
  }

  createSummaryCanvas = function(){
    const scored = getFinalScores();
    const solo = isSoloResultV53();
    const teamCount = Math.max(scored.length, 1);
    const canvas = document.createElement("canvas");
    canvas.width = 1600;

    // Removed the duplicate top score strip. The score now appears once in each team card.
    const headerH = 178;
    const cardH = 940;
    const gap = 38;
    canvas.height = headerH + teamCount * cardH + Math.max(0, teamCount - 1) * gap + 82;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#052e16");
    bg.addColorStop(.52, "#0f172a");
    bg.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,.07)";
    for (let i = 0; i < 15; i += 1) {
      ctx.beginPath();
      ctx.arc(120 + i * 112, 94 + (i % 3) * 58, 62, 0, Math.PI * 2);
      ctx.fill();
    }

    const titleX = drawBrandV53(ctx);
    ctx.fillStyle = "#fff";
    ctx.font = "950 58px Arial";
    ctx.fillText("Ultimate 5-a-side Draft", titleX, 82);
    ctx.font = "850 28px Arial";
    ctx.fillStyle = "#d1fae5";
    ctx.fillText(modeLabelV53(), titleX, 122);

    let y = headerH;
    const x = 70;
    const cardW = 1460;
    const top = scored[0]?.total ?? 0;

    scored.forEach((row, index) => {
      const isWinner = !solo && row.total === top;
      ctx.fillStyle = solo ? "rgba(239,246,255,.98)" : (isWinner ? "rgba(254,243,199,.98)" : "rgba(255,255,255,.95)");
      roundRectV53(ctx, x, y, cardW, cardH, 34);
      ctx.fill();
      ctx.strokeStyle = solo ? "#60a5fa" : (isWinner ? "#f59e0b" : "rgba(226,232,240,.95)");
      ctx.lineWidth = solo || isWinner ? 6 : 2.5;
      ctx.stroke();

      ctx.fillStyle = solo ? "#1d4ed8" : (isWinner ? "#92400e" : "#475569");
      ctx.font = "950 26px Arial";
      ctx.fillText(solo ? "FINAL SCORE" : ordinalV53(index).toUpperCase(), x + 34, y + 54);
      fitTextV53(ctx, row.user.name, x + 34, y + 104, 650, "950 40px Arial", "#0f172a");

      ctx.fillStyle = "#1d4ed8";
      ctx.font = "950 58px Arial";
      ctx.textAlign = "right";
      ctx.fillText(String(row.total), x + cardW - 40, y + 68);
      ctx.font = "850 19px Arial";
      ctx.fillStyle = "#64748b";
      ctx.fillText("SCORE", x + cardW - 40, y + 98);
      ctx.textAlign = "left";

      drawPitchV53(ctx, row.user, x + 54, y + 152, cardW - 108, cardH - 205);
      y += cardH + gap;
    });

    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.font = "850 22px Arial";
    ctx.fillText("Generated from Ultimate 5-a-side Draft", 70, canvas.height - 38);
    return canvas;
  };
})();

// --- v52 League Challenge from restored working files ---
// Adds League Challenge without removing restored social footer, solo result labels, saved pitch image, or WC solo sub-tab.
(function leagueChallengeRestoredV52(){
  const PRESET = "league";
  const MODE_LABEL = "League Challenge";
  const OTHER_KEY = "__other__";
  const REQUIRED = {GK:5, DEF:5, MID:10, FWD:5};
  let selectedLeagueKeys = new Set();
  let currentOptions = [];

  const esc = v => String(v ?? "").replace(/[&<>'\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  const normLeague = v => String(v || "Unknown League").trim() || "Unknown League";
  const leagueKey = v => normLeague(v).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"") || "unknown_league";
  const pLeague = p => normLeague(p?.league || p?.League || p?.LEAGUE || "Unknown League");
  const pPos = p => String(p?.mainPosition || p?.Main_Position || p?.MainPosition || p?.position || p?.Position || "").toUpperCase();
  const allPlayers = () => Array.isArray(players) ? players : [];

  function countPositions(group){
    return group.reduce((acc,p)=>{ const pos=pPos(p); if (acc[pos] !== undefined) acc[pos] += 1; return acc; }, {GK:0, DEF:0, MID:0, FWD:0});
  }
  function enough(group){
    const c=countPositions(group);
    return c.GK >= REQUIRED.GK && c.DEF >= REQUIRED.DEF && c.MID >= REQUIRED.MID && c.FWD >= REQUIRED.FWD;
  }
  function buildOptions(){
    const source=allPlayers();
    const leagues=[...new Set(source.map(pLeague))].sort((a,b)=>a.localeCompare(b));
    const qualified=leagues.filter(lg => enough(source.filter(p => pLeague(p) === lg))).map(lg => ({key:leagueKey(lg), label:lg, league:lg, isOther:false}));
    const qualifiedSet=new Set(qualified.map(o=>o.league));
    const otherGroup=source.filter(p=>!qualifiedSet.has(pLeague(p)));
    if (enough(otherGroup)) qualified.push({key:OTHER_KEY, label:"All Other Leagues", league:"All Other Leagues", isOther:true});
    currentOptions=qualified;
    return qualified;
  }
  function selectedOptions(){
    const opts=currentOptions.length ? currentOptions : buildOptions();
    return opts.filter(o=>selectedLeagueKeys.has(o.key));
  }
  function leaguePool(){
    const opts=currentOptions.length ? currentOptions : buildOptions();
    const selected=selectedOptions();
    if (!selected.length) return [];
    const selectedRegular=new Set(selected.filter(o=>!o.isOther).map(o=>o.league));
    const qualifiedSet=new Set(opts.filter(o=>!o.isOther).map(o=>o.league));
    const includeOther=selected.some(o=>o.isOther);
    return allPlayers().filter(p=>{
      const lg=pLeague(p);
      if (selectedRegular.has(lg)) return true;
      if (includeOther && !qualifiedSet.has(lg)) return true;
      return false;
    });
  }
  function selectionForState(){
    const sel=selectedOptions();
    return {keys:sel.map(o=>o.key), labels:sel.map(o=>o.label), playerCount:leaguePool().length, allYears:true};
  }

  function injectStyles(){
    if (document.getElementById("leagueChallengeRestoredStylesV52")) return;
    const style=document.createElement("style");
    style.id="leagueChallengeRestoredStylesV52";
    style.textContent = `
      .challenge-grid-v2{align-items:stretch;}
      .challenge-card-v2{min-height:176px;display:flex!important;flex-direction:column;align-items:flex-start;gap:8px;padding:18px 18px 16px!important;}
      .challenge-card-v2 .challenge-badge{min-height:22px;display:inline-flex;align-items:center;justify-content:center;margin:0 0 4px;line-height:1;}
      .challenge-card-v2 h4{min-height:38px;margin:0!important;display:flex;align-items:flex-start;line-height:1.18;}
      .challenge-card-v2 p{min-height:48px;margin:0!important;line-height:1.28;}
      .challenge-card-v2 small{margin:0!important;line-height:1.25;}
      .challenge-card-v2 .challenge-action{margin-top:auto!important;}
      .league-challenge-card-v52,.challenge-card-v2.league-challenge-card-v52{background:rgba(255,255,255,.085)!important;border:1px solid rgba(147,197,253,.10)!important;box-shadow:0 12px 30px rgba(15,23,42,.12)!important;}
      .league-challenge-card-v52:hover,.league-challenge-card-v52:focus-visible{transform:translateY(-3px);background:rgba(59,130,246,.22)!important;border-color:rgba(147,197,253,.42)!important;box-shadow:0 18px 44px rgba(37,99,235,.22),0 0 0 1px rgba(147,197,253,.12) inset!important;}
      .league-selector-v52{margin:14px 0 16px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #dbeafe;}
      .league-selector-v52 h3{margin:0 0 12px;color:#0f172a;}
      .league-buttons-v52{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important;width:100%;}
      .league-button-v52{width:100%!important;min-height:48px;display:inline-flex!important;align-items:center;justify-content:center;padding:12px 10px!important;border-radius:14px!important;border:2px solid #bfdbfe!important;background:#eff6ff!important;color:#1e3a8a!important;font-size:.95rem!important;font-weight:1000!important;line-height:1.05;text-align:center;box-shadow:0 8px 18px rgba(37,99,235,.10);cursor:pointer;}
      .league-button-v52.selected{background:linear-gradient(135deg,#2563eb,#1d4ed8)!important;color:white!important;border-color:transparent!important;box-shadow:0 12px 24px rgba(37,99,235,.26)!important;}
      .league-summary-v52{margin:14px 0 0!important;color:#166534!important;font-weight:950!important;font-size:1rem;}
      .league-warning-v52{margin-top:10px!important;padding:10px 12px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412!important;font-weight:900!important;}
      @media(max-width:720px){.league-buttons-v52{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px!important}.league-button-v52{min-height:46px;font-size:.86rem!important;padding:11px 8px!important}.challenge-card-v2{min-height:150px}.challenge-card-v2 h4,.challenge-card-v2 p{min-height:auto;}}
      @media(max-width:360px){.league-button-v52{font-size:.78rem!important;}}
    `;
    document.head.appendChild(style);
  }

  function addPopularCard(){
    injectStyles();
    const grid=document.querySelector(".challenge-grid-v2");
    if (!grid || grid.querySelector('[data-challenge="league"]')) return;
    const card=document.createElement("button");
    card.type="button";
    card.className="challenge-card-v2 active-challenge league-challenge-card-v52";
    card.dataset.challenge=PRESET;
    card.innerHTML=`<span class="challenge-badge challenge-badge-new">NEW</span><h4>🏟️ League Challenge</h4><p>Filter the all-years player pool by Premier League, La Liga and other eligible leagues.</p><span class="challenge-action">Play Now →</span>`;
    const cards=grid.querySelectorAll(".challenge-card-v2");
    if (cards[2]) grid.insertBefore(card,cards[2]); else grid.appendChild(card);
  }

  async function ensureLeagueData(){
    await ensurePlayersReady();
    if (players.some(p => p.league || p.League)) return;
    try{
      const response=await fetch("players.json", {cache:"no-store"});
      const raw=await response.json();
      const lookup=new Map();
      raw.forEach(row=>{
        const key=`${String(row.Player||row.player||"").trim()}|${Number(row.Game_Year||row.year||0)}|${String(row.Club||row.club||"").trim()}`;
        lookup.set(key, row.League || row.league || row.LEAGUE || "Unknown League");
      });
      players.forEach(p=>{
        const key=`${String(p.player||"").trim()}|${Number(p.year||0)}|${String(p.club||"").trim()}`;
        p.league=lookup.get(key) || "Unknown League";
      });
    }catch(err){ console.warn("Could not add league data", err); }
  }

  if (typeof normalisePlayers === "function" && !normalisePlayers.__leagueV52) {
    const previousNormalise = normalisePlayers;
    normalisePlayers = function(data){
      const out=previousNormalise.apply(this, arguments);
      const rows=Array.isArray(data) ? data : [];
      const lookup=new Map();
      rows.forEach(row=>{
        const key=`${String(row.Player||row.player||"").trim()}|${Number(row.Game_Year||row.year||0)}|${String(row.Club||row.club||"").trim()}`;
        lookup.set(key, row.League || row.league || row.LEAGUE || "Unknown League");
      });
      out.forEach(p=>{
        const key=`${String(p.player||"").trim()}|${Number(p.year||0)}|${String(p.club||"").trim()}`;
        p.league=lookup.get(key) || p.league || "Unknown League";
      });
      return out;
    };
    normalisePlayers.__leagueV52 = true;
  }

  function defaultSelection(options){
    if (!options.length) return;
    const valid=[...selectedLeagueKeys].filter(k=>options.some(o=>o.key===k));
    if (valid.length){ selectedLeagueKeys=new Set(valid); return; }
    const premier=options.find(o=>/premier league/i.test(o.label));
    selectedLeagueKeys=new Set([(premier || options[0]).key]);
  }

  function renderSelector(){
    if (window.challengePreset !== PRESET) return;
    injectStyles();
    const panel=document.querySelector(".setup-panel-card");
    if (!panel) return;
    let holder=document.getElementById("leagueSelectorV52");
    if (!holder){
      holder=document.createElement("div");
      holder.id="leagueSelectorV52";
      holder.className="league-selector-v52";
      const before=els.excludeDeclinesLabel || els.startBtn;
      if (before && before.parentNode===panel) panel.insertBefore(holder,before); else panel.appendChild(holder);
    }
    const options=buildOptions();
    defaultSelection(options);
    const selected=selectedOptions();
    const count=leaguePool().length;
    if (!options.length){
      holder.innerHTML=`<h3>Choose leagues</h3><p class="league-warning-v52">No league has enough players in the full player pool. A league needs at least 5 GK, 5 DEF, 10 MID and 5 FWD in total.</p>`;
      if (els.startBtn) els.startBtn.disabled=true;
      return;
    }
    holder.innerHTML=`<h3>Choose leagues</h3><div class="league-buttons-v52">${options.map(o=>`<button type="button" class="league-button-v52 ${selectedLeagueKeys.has(o.key)?"selected":""}" data-league-key="${o.key}">${esc(o.label)}</button>`).join("")}</div><p class="league-summary-v52">Selected: ${selected.map(o=>esc(o.label)).join(", ") || "None"} • Active pool: ${count} players</p><p class="league-warning-v52 ${selected.length?"hidden":""}">Select at least one league to start.</p>`;
    holder.querySelectorAll(".league-button-v52").forEach(btn=>btn.addEventListener("click",()=>{
      const key=btn.dataset.leagueKey;
      if (!key) return;
      if (selectedLeagueKeys.has(key)){ if (selectedLeagueKeys.size > 1) selectedLeagueKeys.delete(key); }
      else selectedLeagueKeys.add(key);
      renderSelector();
    }));
    if (els.startBtn) els.startBtn.disabled = selected.length < 1;
  }
  function hideYearFilter(){
    const year=document.getElementById("localYearSlicerHolderStep4");
    if (year){ year.style.display="none"; year.style.opacity="0.35"; year.style.pointerEvents="none"; year.querySelectorAll('input[type="range"]').forEach(s=>s.disabled=true); }
  }
  function restoreYearFilter(){
    const year=document.getElementById("localYearSlicerHolderStep4");
    if (year){ year.style.display=""; year.style.opacity=""; year.style.pointerEvents=""; year.querySelectorAll('input[type="range"]').forEach(s=>s.disabled=false); }
  }
  function removeLeagueUi(){ document.getElementById("leagueSelectorV52")?.remove(); if (els.startBtn) els.startBtn.disabled=false; }
  function applySetup(){
    if (window.challengePreset !== PRESET){ removeLeagueUi(); restoreYearFilter(); return; }
    const heroEyebrow=document.querySelector("#setupPanel .setup-copy .eyebrow");
    const heroTitle=document.querySelector("#setupPanel .setup-copy h2");
    const heroLead=document.querySelector("#setupPanel .setup-copy .setup-lead");
    const soloIntro=document.getElementById("soloSetupIntroStep7");
    if (heroEyebrow) heroEyebrow.textContent="🏟️ League Challenge";
    if (heroTitle) heroTitle.textContent="League Challenge";
    if (heroLead) heroLead.textContent="Select one or more eligible leagues, then build your best 5-a-side team from that filtered all-years player pool.";
    if (els.startBtn) els.startBtn.textContent="Start League Challenge";
    if (els.gameModeDescription) els.gameModeDescription.textContent="League Challenge: solo draft using selected leagues from the full normal player pool. Year filter disabled.";
    if (soloIntro){ soloIntro.dataset.hiddenByLeagueV52="1"; soloIntro.style.display="none"; }
    hideYearFilter();
    renderSelector();
  }
  async function withLeaguePool(fn){
    if (!(window.challengePreset === PRESET || state?.challengePreset === PRESET)) return await fn();
    const original=players;
    players=leaguePool();
    try { return await fn(); } finally { players=original; }
  }

  const oldInject=injectEntryPanel;
  injectEntryPanel=function(...args){ const res=oldInject.apply(this,args); addPopularCard(); removeWorldCupMainTab(); return res; };
  const oldUpdate=updateSetupForMode;
  updateSetupForMode=function(...args){ const res=oldUpdate.apply(this,args); setTimeout(()=>ensureLeagueData().then(applySetup),0); return res; };
  const oldStart=startNewGame;
  startNewGame=function(gameMode,names,isOnlineGame){
    if (!isOnlineGame && window.challengePreset === PRESET){
      const sel=selectionForState();
      if (!sel.labels.length){ alert("Select at least one league to start League Challenge."); return; }
      const res=oldStart.apply(this, arguments);
      if (state){ state.challengePreset=PRESET; state.challengeName=MODE_LABEL; state.leagueSelection=sel; state.yearRange=null; }
      return res;
    }
    return oldStart.apply(this, arguments);
  };
  const oldPick=pickRandomPlayer;
  pickRandomPlayer=async function(...args){ return await withLeaguePool(()=>oldPick.apply(this,args)); };
  const oldRenderCandidate=renderCandidate;
  renderCandidate=function(p){
    const res=oldRenderCandidate.apply(this,arguments);
    if ((window.challengePreset === PRESET || state?.challengePreset === PRESET) && els.candidateCard){
      const sel=state?.leagueSelection || selectionForState();
      const note=document.createElement("p");
      note.className="muted";
      note.style.marginTop="8px";
      note.textContent=`League Challenge: ${sel.labels.join(", ") || "Selected leagues"}`;
      els.candidateCard.appendChild(note);
    }
    return res;
  };
  const oldRender=render;
  render=function(...args){
    const res=oldRender.apply(this,args);
    if (state?.challengePreset === PRESET && els?.message){
      let pill=document.getElementById("activeLeagueChallengePillV52");
      if (!pill){ pill=document.createElement("div"); pill.id="activeLeagueChallengePillV52"; pill.className="turn-lock-note"; pill.style.background="#eff6ff"; pill.style.borderColor="#bfdbfe"; pill.style.color="#1e3a8a"; els.message.insertAdjacentElement("afterend", pill); }
      const sel=state.leagueSelection || selectionForState();
      pill.textContent=`Active League Challenge: ${sel.labels.join(", ")} (${sel.playerCount || leaguePool().length} players, all years)`;
    }
    return res;
  };
  const oldReset=resetGame;
  resetGame=function(...args){ selectedLeagueKeys=new Set(); document.getElementById("activeLeagueChallengePillV52")?.remove(); removeLeagueUi(); return oldReset.apply(this,args); };

  function removeWorldCupMainTab(){ document.querySelectorAll('.leaderboard-tab[data-leaderboard-filter="World Cup 2026 Challenge"]').forEach(t=>t.remove()); }
  function ensureLeagueLeaderboardTab(){
    const tabs=document.getElementById("soloLeaderboardSubTabs");
    if (!tabs || tabs.querySelector('[data-solo-leaderboard-filter="League Challenge"]')) return;
    const btn=document.createElement("button"); btn.type="button"; btn.className="leaderboard-tab solo-sub-tab"; btn.dataset.soloLeaderboardFilter=MODE_LABEL; btn.textContent="League Challenge"; tabs.appendChild(btn);
  }

  async function submitLeagueLeaderboard(){
    if (!state || !ratingsRevealed){ alert("Reveal the ratings first."); return; }
    if (state.leaderboardSubmitted){ alert("This result has already been submitted from this screen."); return; }
    const scored=getFinalScores(); const top=scored[0];
    if (!top){ alert("No score found to submit."); return; }
    const username=prompt("Enter leaderboard name (3-18 letters/numbers):", "");
    if (username === null) return;
    if (!validateUsername(username)){ alert("Invalid username. Use 3-18 characters: letters, numbers, spaces, underscores or hyphens. Avoid reserved names."); return; }
    await ensureFirebase();
    await firebase.database().ref("leaderboard").push({username:username.trim(), score:Number(top.total||0), gameMode:MODE_LABEL, online:false, roomId:"", yearRange:null, leagueSelection:state.leagueSelection || selectionForState(), team:Array.isArray(top.user?.team)?top.user.team.map(p=>({name:p.player||"", year:Number(p.year||0), position:p.mainPosition||p.position||"", rating:Number(p.rating||0), club:p.club||"", nation:p.nation||"", league:pLeague(p)})):[], timestamp:Date.now()});
    state.leaderboardSubmitted=true;
    const btn=document.getElementById("submitLeaderboardBtnStep19");
    if (btn){ btn.textContent="Submitted ✅"; btn.disabled=true; }
    alert("League Challenge score submitted to leaderboard.");
  }
  function patchLeaderboardButton(){ if (!state || state.challengePreset !== PRESET || !ratingsRevealed) return; const btn=document.getElementById("submitLeaderboardBtnStep19"); if (btn) btn.onclick=safe(submitLeagueLeaderboard); }
  const oldResults=renderResults;
  renderResults=function(...args){ const res=oldResults.apply(this,args); patchLeaderboardButton(); if (state?.challengePreset===PRESET){ const eyebrow=document.querySelector("#resultsPanel .finished-hero .eyebrow"); if (eyebrow) eyebrow.textContent="League Challenge"; } return res; };
  if (typeof showFinishedResultsPageV33 === "function"){
    const oldShow=showFinishedResultsPageV33;
    showFinishedResultsPageV33=function(...args){ const res=oldShow.apply(this,args); patchLeaderboardButton(); return res; };
  }

  async function loadLeagueLeaderboard(filter){
    const list=document.getElementById("leaderboardList"); if (!list) return;
    list.innerHTML=`<div class="leaderboard-empty">Loading leaderboard...</div>`;
    try{
      await ensureFirebase(); const snap=await firebase.database().ref("leaderboard").once("value");
      let entries=snap.exists()?Object.values(snap.val()||{}):[];
      entries=entries.filter(e=>Number.isFinite(Number(e.score))).map(e=>({username:String(e.username||"Player").trim()||"Player", score:Number(e.score||0), gameMode:String(e.gameMode||"Unknown"), timestamp:Number(e.timestamp||0)}));
      if (filter===MODE_LABEL) entries=entries.filter(e=>e.gameMode===MODE_LABEL);
      else if (filter==="solo") entries=entries.filter(e=>["Solo Challenge","Ultimate Solo Mode","Easy Solo Challenge","World Cup 2026 Challenge",MODE_LABEL].includes(e.gameMode));
      entries.sort((a,b)=>b.score!==a.score?b.score-a.score:b.timestamp-a.timestamp);
      const top=entries.slice(0,20);
      if (!top.length){ list.innerHTML=`<div class="leaderboard-empty">No scores yet for this leaderboard.</div>`; return; }
      list.innerHTML=top.map((e,i)=>`<div class="leaderboard-row"><span class="leaderboard-rank">#${i+1}</span><span class="leaderboard-name">${esc(e.username)}</span><span class="leaderboard-score">${e.score}</span><span class="leaderboard-mode">${esc(e.gameMode)}</span></div>`).join("");
    }catch(err){ list.innerHTML=`<div class="leaderboard-error">Could not load leaderboard. ${esc(err.message||err)}</div>`; }
  }
  document.addEventListener("click", function(event){
    ensureLeagueLeaderboardTab(); removeWorldCupMainTab();
    const tab=event.target?.closest?.('[data-solo-leaderboard-filter="League Challenge"], [data-solo-leaderboard-filter="solo"]');
    if (!tab) return;
    event.preventDefault(); event.stopImmediatePropagation();
    document.querySelectorAll(".solo-sub-tab").forEach(t=>t.classList.toggle("active", t===tab));
    document.querySelector('[data-leaderboard-filter="solo"]')?.classList.add("active");
    loadLeagueLeaderboard(tab.dataset.soloLeaderboardFilter || "solo");
  }, true);
  document.addEventListener("click", function(event){ if (event.target?.closest?.('[data-challenge="league"]')) setTimeout(()=>ensureLeagueData().then(()=>{hideYearFilter();renderSelector();}),80); if (event.target?.closest?.("#leaderboardBtn")) setTimeout(()=>{ensureLeagueLeaderboardTab();removeWorldCupMainTab();},0); }, true);

  injectStyles(); addPopularCard(); ensureLeagueLeaderboardTab(); removeWorldCupMainTab();
  ensureLeagueData().then(()=>{ addPopularCard(); if (window.challengePreset===PRESET) applySetup(); });
})();

// --- v53 Leaderboard metadata display ---
// Shows selected leagues for League Challenge and selected year range for solo/year-filtered challenges.
(function leaderboardMetadataV53(){
  const SOLO_MODES_V53 = [
    "Solo Challenge",
    "Ultimate Solo Mode",
    "Easy Solo Challenge",
    "World Cup 2026 Challenge",
    "League Challenge"
  ];

  function escV53(value){
    return String(value ?? "").replace(/[&<>'\"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    }[char]));
  }

  function modeV53(entry){
    return String(entry?.gameMode || "Unknown").trim() || "Unknown";
  }

  function normaliseYearRangeV53(range){
    if (!range || typeof range !== "object") return null;
    const start = Number(range.start ?? range.from ?? range.min ?? 0);
    const end = Number(range.end ?? range.to ?? range.max ?? 0);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !start || !end) return null;
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }

  function leagueLabelsV53(entry){
    const labels = entry?.leagueSelection?.labels;
    if (Array.isArray(labels)) {
      return labels.map(label => String(label || "").trim()).filter(Boolean);
    }
    if (typeof labels === "object" && labels) {
      return Object.values(labels).map(label => String(label || "").trim()).filter(Boolean);
    }
    return [];
  }

  function metadataTextV53(entry){
    const mode = modeV53(entry);

    if (mode === "League Challenge") {
      const labels = leagueLabelsV53(entry);
      if (labels.length) return `Leagues: ${labels.join(", ")}`;
      return "Leagues: selected leagues";
    }

    const range = normaliseYearRangeV53(entry?.yearRange);
    if (range) {
      if (range.start === range.end) return `Year: ${range.start}`;
      return `Years: ${range.start} - ${range.end}`;
    }

    if (mode === "Ultimate Solo Mode") return "Years: all years";
    if (mode === "World Cup 2026 Challenge") return "Player pool: World Cup 2026";

    return "";
  }

  function ensureMetadataStylesV53(){
    if (document.getElementById("leaderboardMetadataStylesV53")) return;
    const style = document.createElement("style");
    style.id = "leaderboardMetadataStylesV53";
    style.textContent = `
      .leaderboard-row.leaderboard-row-with-meta-v53 {
        grid-template-columns: 54px minmax(0, 1fr) 80px minmax(160px, .8fr);
        row-gap: 3px;
      }
      .leaderboard-meta-v53 {
        grid-column: 2 / span 3;
        color: #64748b;
        font-size: .78rem;
        font-weight: 850;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }
      @media (max-width: 720px) {
        .leaderboard-row.leaderboard-row-with-meta-v53 {
          grid-template-columns: 44px minmax(0, 1fr) 72px;
        }
        .leaderboard-row.leaderboard-row-with-meta-v53 .leaderboard-mode {
          grid-column: 2 / span 2;
          text-align: left;
        }
        .leaderboard-meta-v53 {
          grid-column: 2 / span 2;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function loadLeaderboardWithMetadataV53(filter){
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    ensureMetadataStylesV53();
    list.innerHTML = `<div class="leaderboard-empty">Loading leaderboard...</div>`;

    try {
      await ensureFirebase();
      const snapshot = await firebase.database().ref("leaderboard").once("value");

      if (!snapshot.exists()) {
        list.innerHTML = `<div class="leaderboard-empty">No scores submitted yet.</div>`;
        return;
      }

      let entries = Object.values(snapshot.val() || {})
        .filter(entry => Number.isFinite(Number(entry.score)))
        .map(entry => ({
          ...entry,
          username: String(entry.username || "Player").trim() || "Player",
          score: Number(entry.score || 0),
          gameMode: modeV53(entry),
          timestamp: Number(entry.timestamp || 0)
        }));

      if (filter && filter !== "all") {
        if (filter === "solo") {
          entries = entries.filter(entry => SOLO_MODES_V53.includes(entry.gameMode));
        } else {
          entries = entries.filter(entry => entry.gameMode === filter);
        }
      }

      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.timestamp - a.timestamp;
      });

      const top20 = entries.slice(0, 20);
      if (!top20.length) {
        list.innerHTML = `<div class="leaderboard-empty">No scores yet for this leaderboard.</div>`;
        return;
      }

      list.innerHTML = top20.map((entry, index) => {
        const meta = metadataTextV53(entry);
        return `
          <div class="leaderboard-row leaderboard-row-with-meta-v53">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${escV53(entry.username)}</span>
            <span class="leaderboard-score">${entry.score}</span>
            <span class="leaderboard-mode">${escV53(entry.gameMode)}</span>
            ${meta ? `<span class="leaderboard-meta-v53">${escV53(meta)}</span>` : ""}
          </div>
        `;
      }).join("");

    } catch (error) {
      list.innerHTML = `<div class="leaderboard-error">Could not load leaderboard. ${escV53(error.message || error)}</div>`;
    }
  }

  function setMainActiveV53(filter){
    document.querySelectorAll(".leaderboard-tab[data-leaderboard-filter]").forEach(tab => {
      tab.classList.toggle("active", (tab.dataset.leaderboardFilter || "all") === filter);
    });

    const subTabs = document.getElementById("soloLeaderboardSubTabs");
    if (subTabs) subTabs.classList.toggle("hidden", filter !== "solo");
  }

  function setSoloActiveV53(filter){
    document.querySelectorAll(".solo-sub-tab").forEach(tab => {
      tab.classList.toggle("active", (tab.dataset.soloLeaderboardFilter || "solo") === filter);
    });
  }

  function ensureLeagueSubTabV53(){
    const tabs = document.getElementById("soloLeaderboardSubTabs");
    if (!tabs || tabs.querySelector('[data-solo-leaderboard-filter="League Challenge"]')) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "leaderboard-tab solo-sub-tab";
    button.dataset.soloLeaderboardFilter = "League Challenge";
    button.textContent = "League Challenge";
    tabs.appendChild(button);
  }

  function removeWorldCupMainTabV53(){
    document.querySelectorAll('.leaderboard-tab[data-leaderboard-filter="World Cup 2026 Challenge"]').forEach(tab => tab.remove());
  }

  document.addEventListener("click", function(event){
    const mainTab = event.target?.closest?.(".leaderboard-tab[data-leaderboard-filter]");
    if (!mainTab) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    removeWorldCupMainTabV53();
    ensureLeagueSubTabV53();

    const filter = mainTab.dataset.leaderboardFilter || "all";
    setMainActiveV53(filter);

    if (filter === "solo") {
      setSoloActiveV53("solo");
      loadLeaderboardWithMetadataV53("solo");
    } else {
      loadLeaderboardWithMetadataV53(filter);
    }
  }, true);

  document.addEventListener("click", function(event){
    const subTab = event.target?.closest?.(".solo-sub-tab[data-solo-leaderboard-filter]");
    if (!subTab) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    removeWorldCupMainTabV53();
    ensureLeagueSubTabV53();
    setMainActiveV53("solo");

    const filter = subTab.dataset.soloLeaderboardFilter || "solo";
    setSoloActiveV53(filter);
    loadLeaderboardWithMetadataV53(filter);
  }, true);

  // v64: older v53 leaderboard button refresh disabled.


  ensureMetadataStylesV53();
  ensureLeagueSubTabV53();
  removeWorldCupMainTabV53();
})();

// --- League Challenge leaderboard metadata hotfix ---
// Append this block to the VERY END of your current app.js.
// It must be after the existing League Challenge and leaderboard patches.
(function leagueLeaderboardMetadataHotfixV54(){
  const SOLO_MODES = [
    "Solo Challenge",
    "Ultimate Solo Mode",
    "Easy Solo Challenge",
    "World Cup 2026 Challenge",
    "League Challenge"
  ];

  function esc(value){
    return String(value ?? "").replace(/[&<>'\"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    }[char]));
  }

  function mode(entry){
    return String(entry?.gameMode || "Unknown").trim() || "Unknown";
  }

  function yearRangeText(entry){
    const range = entry?.yearRange;
    if (!range || typeof range !== "object") return "";

    const start = Number(range.start ?? range.from ?? range.min ?? 0);
    const end = Number(range.end ?? range.to ?? range.max ?? 0);

    if (!Number.isFinite(start) || !Number.isFinite(end) || !start || !end) return "";

    const a = Math.min(start, end);
    const b = Math.max(start, end);

    return a === b ? `Year: ${a}` : `Years: ${a} - ${b}`;
  }

  function leagueLabels(entry){
    const labels = entry?.leagueSelection?.labels;

    if (Array.isArray(labels)) {
      return labels.map(label => String(label || "").trim()).filter(Boolean);
    }

    if (labels && typeof labels === "object") {
      return Object.values(labels).map(label => String(label || "").trim()).filter(Boolean);
    }

    return [];
  }

  function metadataText(entry){
    const gameMode = mode(entry);

    if (gameMode === "League Challenge") {
      const labels = leagueLabels(entry).filter(label => !/^unknown league$/i.test(String(label || "").trim()));
      return labels.length ? `Leagues: ${labels.join(", ")}` : "";
    }

    const years = yearRangeText(entry);
    if (years) return years;

    if (gameMode === "Ultimate Solo Mode") return "Years: all years";
    if (gameMode === "World Cup 2026 Challenge") return "Player pool: World Cup 2026";

    return "";
  }

  function ensureStyles(){
    if (document.getElementById("leaderboardMetadataHotfixStylesV54")) return;

    const style = document.createElement("style");
    style.id = "leaderboardMetadataHotfixStylesV54";
    style.textContent = `
      .leaderboard-row.leaderboard-row-with-meta-v54 {
        grid-template-columns: 54px minmax(0, 1fr) 80px minmax(160px, .8fr);
        row-gap: 3px;
      }

      .leaderboard-meta-v54 {
        grid-column: 2 / span 3;
        color: #64748b;
        font-size: .78rem;
        font-weight: 850;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      @media (max-width: 720px) {
        .leaderboard-row.leaderboard-row-with-meta-v54 {
          grid-template-columns: 44px minmax(0, 1fr) 72px;
        }

        .leaderboard-row.leaderboard-row-with-meta-v54 .leaderboard-mode {
          grid-column: 2 / span 2;
          text-align: left;
        }

        .leaderboard-meta-v54 {
          grid-column: 2 / span 2;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLeagueSubTab(){
    const tabs = document.getElementById("soloLeaderboardSubTabs");
    if (!tabs || tabs.querySelector('[data-solo-leaderboard-filter="League Challenge"]')) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "leaderboard-tab solo-sub-tab";
    button.dataset.soloLeaderboardFilter = "League Challenge";
    button.textContent = "League Challenge";
    tabs.appendChild(button);
  }

  function removeWorldCupMainTab(){
    document.querySelectorAll('.leaderboard-tab[data-leaderboard-filter="World Cup 2026 Challenge"]').forEach(tab => tab.remove());
  }

  function setActiveMain(filter){
    document.querySelectorAll(".leaderboard-tab[data-leaderboard-filter]").forEach(tab => {
      tab.classList.toggle("active", (tab.dataset.leaderboardFilter || "all") === filter);
    });

    const subTabs = document.getElementById("soloLeaderboardSubTabs");
    if (subTabs) subTabs.classList.toggle("hidden", filter !== "solo");
  }

  function setActiveSolo(filter){
    document.querySelectorAll(".solo-sub-tab").forEach(tab => {
      tab.classList.toggle("active", (tab.dataset.soloLeaderboardFilter || "solo") === filter);
    });
  }

  async function loadLeaderboardWithMeta(filter){
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    ensureStyles();
    list.innerHTML = `<div class="leaderboard-empty">Loading leaderboard...</div>`;

    try {
      await ensureFirebase();
      const snapshot = await firebase.database().ref("leaderboard").once("value");

      if (!snapshot.exists()) {
        list.innerHTML = `<div class="leaderboard-empty">No scores submitted yet.</div>`;
        return;
      }

      let entries = Object.values(snapshot.val() || {})
        .filter(entry => Number.isFinite(Number(entry.score)))
        .map(entry => ({
          ...entry,
          username: String(entry.username || "Player").trim() || "Player",
          score: Number(entry.score || 0),
          gameMode: mode(entry),
          timestamp: Number(entry.timestamp || 0)
        }));

      if (filter && filter !== "all") {
        if (filter === "solo") {
          entries = entries.filter(entry => SOLO_MODES.includes(entry.gameMode));
        } else {
          entries = entries.filter(entry => entry.gameMode === filter);
        }
      }

      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.timestamp - a.timestamp;
      });

      const top20 = entries.slice(0, 20);

      if (!top20.length) {
        list.innerHTML = `<div class="leaderboard-empty">No scores yet for this leaderboard.</div>`;
        return;
      }

      list.innerHTML = top20.map((entry, index) => {
        const meta = metadataText(entry);

        return `
          <div class="leaderboard-row leaderboard-row-with-meta-v54">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${esc(entry.username)}</span>
            <span class="leaderboard-score">${entry.score}</span>
            <span class="leaderboard-mode">${esc(entry.gameMode)}</span>
            ${meta ? `<span class="leaderboard-meta-v54">${esc(meta)}</span>` : ""}
          </div>
        `;
      }).join("");

    } catch (error) {
      list.innerHTML = `<div class="leaderboard-error">Could not load leaderboard. ${esc(error.message || error)}</div>`;
    }
  }

  // Important: use WINDOW capture, which fires before older document-level leaderboard handlers.
  // This avoids the previous League Challenge handler stopping the metadata renderer.
  window.addEventListener("click", function(event){
    const mainTab = event.target?.closest?.(".leaderboard-tab[data-leaderboard-filter]");
    const soloTab = event.target?.closest?.(".solo-sub-tab[data-solo-leaderboard-filter]");

    if (!mainTab && !soloTab) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    ensureStyles();
    ensureLeagueSubTab();
    removeWorldCupMainTab();

    if (soloTab) {
      const filter = soloTab.dataset.soloLeaderboardFilter || "solo";
      setActiveMain("solo");
      setActiveSolo(filter);
      loadLeaderboardWithMeta(filter);
      return;
    }

    const filter = mainTab.dataset.leaderboardFilter || "all";
    setActiveMain(filter);

    if (filter === "solo") {
      setActiveSolo("solo");
      loadLeaderboardWithMeta("solo");
    } else {
      loadLeaderboardWithMeta(filter);
    }
  }, true);

  // v64: older v54 leaderboard button refresh disabled. The v55/v64 handler below opens and renders once.


  ensureStyles();
  ensureLeagueSubTab();
  removeWorldCupMainTab();
})();

// --- League Legends Challenge full implementation ---
(function leagueLegendsChallengeFull(){
  const PRESET = 'leaguelegends';
  const MODE_LABEL = 'League Legends Challenge';
  const DATA_FILE = 'league_players.json';
  const LEAGUES = ['Premier League', 'La Liga', 'Serie A', 'Ligue 1', 'Bundesliga'];
  const TEAM = ['GK', 'DEF', 'MID', 'MID', 'FWD'];
  let legends = [];
  let legendsPromise = null;
  let selectedLeague = 'Premier League';

  function esc(v){ return String(v ?? '').replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }
  function roleLabel(role){ return role === 'FWD' ? 'ST' : role; }
  function isActive(){ return window.challengePreset === PRESET || state?.challengePreset === PRESET; }
  function normalMain(pos){
    const p = String(pos || '').toUpperCase();
    if (p.includes('GK')) return 'GK';
    if (['CB','LB','RB','LWB','RWB','SW'].some(x => p.includes(x))) return 'DEF';
    if (['DM','CDM','CM','AM','CAM','LM','RM'].some(x => p.includes(x))) return 'MID';
    return 'FWD';
  }
  function legendPlayerKey(value){ return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function normaliseLegendRows(rows){
    return (Array.isArray(rows) ? rows : []).map((p, index) => {
      const multipliers = p.Position_Multipliers || p.positionMultipliers || {};
      const position = String(p.Position || p.position || '').trim();
      const main = String(p.Main_Position || p.mainPosition || p.MainPosition || normalMain(position)).toUpperCase();
      return {
        id: `legend-${index + 1}`,
        player: String(p.Player || p.player || '').trim(),
        rank: Number(p.Rank || p.rank || 0),
        baseRating: Number(p.Rating_OVR || p.rating || 0),
        rating: Number(p.Rating_OVR || p.rating || 0),
        position,
        naturalPosition: position,
        naturalMainPosition: main,
        mainPosition: main,
        club: String(p.Club || p.club || '').trim(),
        nation: String(p.Nation || p.nation || '').trim(),
        league: String(p.League || p.league || '').trim(),
        multipliers: {
          DEF: Number(multipliers.DEF ?? 0),
          MID: Number(multipliers.MID ?? 0),
          FWD: Number(multipliers.FWD ?? multipliers.ST ?? 0),
          ST: Number(multipliers.ST ?? multipliers.FWD ?? 0)
        }
      };
    }).filter(p => p.player && p.rating > 0 && LEAGUES.includes(p.league));
  }
  async function loadLegends(){
    if (legendsPromise) return legendsPromise;
    legendsPromise = (async () => {
      const response = await fetch(DATA_FILE, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${DATA_FILE}`);
      legends = normaliseLegendRows(await response.json());
      if (!legends.length) throw new Error(`${DATA_FILE} loaded but no valid players were found.`);
      return legends;
    })();
    return legendsPromise;
  }
  function currentPool(){ return legends.filter(p => p.league === selectedLeague); }
  function currentTeam(){ return Array.isArray(state?.users?.[0]?.team) ? state.users[0].team : []; }
  function neededRoles(){
    const counts = { GK:0, DEF:0, MID:0, FWD:0 };
    currentTeam().forEach(p => { const r = p.selectedRole || p.mainPosition; if (counts[r] !== undefined) counts[r] += 1; });
    const needed = [];
    TEAM.forEach(role => { if (counts[role] > 0) counts[role] -= 1; else needed.push(role); });
    return needed;
  }
  function finalScore(user){ return (Array.isArray(user?.team) ? user.team : []).reduce((sum, p) => sum + Number(p.adjustedRating ?? p.rating ?? 0), 0); }
  function multiplierFor(player, role){
    if (!player) return 0;
    if (player.naturalMainPosition === 'GK') return role === 'GK' ? 1 : 0;
    if (role === 'GK') return 0;
    return Number(player.multipliers?.[role] ?? (role === 'FWD' ? player.multipliers?.ST : undefined) ?? 0.75);
  }
  function adjustedPlayer(player, role){
    const base = Number(player.baseRating || player.rating || 0);
    const multiplier = multiplierFor(player, role);
    const adjusted = Math.round(base * multiplier);
    return { ...player, selectedRole: role, mainPosition: role, rating: adjusted, adjustedRating: adjusted, baseRating: base, positionMultiplier: multiplier };
  }
  function availableCandidates(){
    const user = state?.users?.[0];
    const selectedNames = new Set(currentTeam().map(p => legendPlayerKey(p.player)));
    const declinedNames = new Set([...v29Set(user?.declinedNames)].map(name => legendPlayerKey(name)));
    const needed = neededRoles();
    const onlyGkLeft = needed.length === 1 && needed[0] === 'GK';
    const gkAlreadyPicked = !needed.includes('GK');
    return currentPool().filter(p => {
      const playerKey = legendPlayerKey(p.player);
      if (selectedNames.has(playerKey)) return false;
      if (declinedNames.has(playerKey)) return false;
      if (onlyGkLeft) return p.naturalMainPosition === 'GK';
      if (gkAlreadyPicked) return p.naturalMainPosition !== 'GK';
      return true;
    });
  }

  function removeOldSmallCard(){ document.querySelectorAll('.challenge-grid-v2 [data-challenge="leaguelegends"]').forEach(card => card.remove()); }
  function addStandaloneSection(){
    const entry = document.getElementById('gameEntryPanel');
    if (!entry) return;
    removeOldSmallCard();
    let section = document.getElementById('leagueLegendsHome');
    if (!section) {
      section = document.createElement('section');
      section.id = 'leagueLegendsHome';
      section.className = 'league-legends-hero-card';
      const popular = entry.querySelector('.popular-challenges-v2');
      if (popular) entry.insertBefore(section, popular);
      else {
        const how = entry.querySelector('.landing-how-play-inline');
        if (how) entry.insertBefore(section, how); else entry.appendChild(section);
      }
    }
    section.className = 'league-legends-hero-card';
    section.style.display = '';
    section.innerHTML = `
      <div class="league-legends-hero-copy">
        <div class="league-legends-title-line"><span class="league-legends-new-badge">NEW</span><p class="eyebrow">Game mode</p></div>
        <h3>League Legends</h3>
        <p>Choose a league. Draft its legends. Pick their positions - but out-of-position picks affect the final rating.</p>
      </div>
      <div class="league-legends-hero-action">
        <button type="button" class="btn btn-primary" data-challenge="leaguelegends">Play League Legends</button>
      </div>`;
  }
  function addLeaderboardTab(){
    const tabs = document.getElementById('soloLeaderboardSubTabs');
    if (!tabs || tabs.querySelector(`[data-solo-leaderboard-filter="${MODE_LABEL}"]`)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'leaderboard-tab solo-sub-tab';
    btn.dataset.soloLeaderboardFilter = MODE_LABEL;
    btn.textContent = 'League Legends';
    tabs.appendChild(btn);
  }
  function hideNormalSetupBits(){
    document.getElementById('soloSetupIntroStep7')?.remove();
    const firstLabel = document.querySelector('.setup-panel-card > label:first-child');
    if (firstLabel) firstLabel.style.display = 'none';
    if (els.gameModeCards) els.gameModeCards.style.display = 'none';
    els.userCount?.closest('div')?.classList.add('hidden');
    els.userNameFields?.classList.add('hidden');
    els.excludeDeclinesLabel?.classList.add('hidden');
    const year = document.getElementById('localYearSlicerHolderStep4');
    if (year) year.style.display = 'none';
  }
  function renderLeagueSelector(){
    const panel = document.querySelector('.setup-panel-card');
    if (!panel) return;
    let holder = document.getElementById('leagueLegendsSelector');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'leagueLegendsSelector';
      holder.className = 'league-legends-selector-card';
      panel.insertBefore(holder, els.startBtn || panel.firstChild);
    }
    holder.innerHTML = `<h3>Choose your league</h3><div class="league-legends-league-grid">${LEAGUES.map(lg => `<button type="button" class="league-legends-league-btn ${lg === selectedLeague ? 'selected' : ''}" data-legend-league="${esc(lg)}"><span>${esc(lg)}</span></button>`).join('')}</div><div class="league-legends-rule-note"><strong>Rules:</strong> 3 declines only. GK is fixed. Outfield players can be placed DEF, MID or ST, with position multipliers applied at reveal.</div><div class="league-legends-rating-note"><strong>Ratings note:</strong> League Legends ratings are relative to the selected league and are different to the normal game mode ratings. They are based on prime ability, legacy and longevity.</div>`;
    holder.querySelectorAll('[data-legend-league]').forEach(btn => btn.addEventListener('click', () => { selectedLeague = btn.dataset.legendLeague; renderLeagueSelector(); }));
  }
  async function openLeagueLegendsSetup(){
    window.challengePreset = PRESET;
    selectedGameMode = 'draft';
    online.enabled = false;
    await loadLegends();
    hideEntryPanel();
    show($('leaderboardPanel'), false);
    show(els.resultsPanel, false);
    show(els.gamePanel, false);
    show(els.setupPanel, true);
    if (els.resetBtn) els.resetBtn.style.display = '';
    hideNormalSetupBits();
    const eyebrow = document.querySelector('#setupPanel .setup-copy .eyebrow');
    const title = document.querySelector('#setupPanel .setup-copy h2');
    const lead = document.querySelector('#setupPanel .setup-copy .setup-lead');
    if (eyebrow) eyebrow.textContent = MODE_LABEL;
    if (title) title.textContent = 'Draft your legends';
    if (lead) lead.textContent = "Choose a league, then draft from its legends. Choose their positions, but be careful - the ratings will be affected if they're out of position.";
    if (els.gameModeDescription) els.gameModeDescription.textContent = 'Choose a league, then place each randomised legend into your five-a-side team.';
    if (els.startBtn) els.startBtn.textContent = 'Start League Legends';
    renderLeagueSelector();
    setTimeout(() => els.setupPanel?.scrollIntoView({ behavior:'smooth', block:'start' }), 30);
  }
  async function startLeagueLegendsGame(){
    await loadLegends();
    ratingsRevealed = false;
    currentCandidate = null;
    state = {
      gameMode: 'draft', challengePreset: PRESET, challengeName: MODE_LABEL,
      selectedLegendLeague: selectedLeague,
      leagueSelection: { labels:[selectedLeague], keys:[selectedLeague.toLowerCase().replace(/[^a-z0-9]+/g, '_')], playerCount: currentPool().length },
      yearRange: null, userCount: 1, currentUserIndex: 0, excludeDeclines: false,
      users: [{ name:selectedLeague, team:[], declines:0, declinedNames:new Set(), budget:AUCTION_BUDGET, spent:0, bidSkips:0 }],
      acceptedPlayerNames: new Set(), history: [], bidOrder: [], bidRoundIndex: 0, leaderboardSubmitted: false
    };
    show(ensureLobby(), false);
    show(els.setupPanel, false);
    show(els.gamePanel, true);
    show(els.resultsPanel, false);
    if (els.resetBtn) els.resetBtn.style.display = '';
    if (els.pickBtn) els.pickBtn.textContent = 'Randomise player';
    clearCandidate('Click Randomise player to begin.');
    render();
  }
  function setLegendButtons(){
    if (!isActive()) return;
    const user = state?.users?.[0];
    if (els.pickBtn) els.pickBtn.disabled = !!currentCandidate || neededRoles().length === 0;
    if (els.acceptBtn) els.acceptBtn.disabled = !currentCandidate || !currentCandidate.legendRole;
    if (els.declineBtn) els.declineBtn.disabled = !currentCandidate || (user?.declines || 0) >= DECLINES_ALLOWED;
  }
  async function pickLegend(){
    await loadLegends();
    if (!isActive()) return;
    if (neededRoles().length === 0) { completeLegendGame(); return; }
    if (currentCandidate) { setMessage('Place or decline the current player first.'); return; }
    const pool = availableCandidates();
    if (!pool.length) { clearCandidate('No available player found for the remaining position.'); return; }
    currentCandidate = { ...pool[Math.floor(Math.random() * pool.length)], legendRole: null };
    if (currentCandidate.naturalMainPosition === 'GK') currentCandidate.legendRole = 'GK';
    renderCandidate(currentCandidate);
    render();
    setMessage(currentCandidate.naturalMainPosition === 'GK' ? 'Goalkeeper candidate - accept to place in GK.' : `Choose an empty pitch slot. Remaining: ${neededRoles().map(roleLabel).join(', ')}`);
    setLegendButtons();
  }
  function chooseLegendRole(role){
    if (!currentCandidate || !isActive()) return;
    if (currentCandidate.naturalMainPosition === 'GK' && role !== 'GK') return;
    if (currentCandidate.naturalMainPosition !== 'GK' && role === 'GK') return;
    if (!neededRoles().includes(role)) return;
    currentCandidate.legendRole = role;
    renderCandidate(currentCandidate);
    render();
    setMessage(`${currentCandidate.player} selected for ${roleLabel(role)}. Click Accept to confirm.`);
    setLegendButtons();
  }
  async function acceptLegend(){
    if (!currentCandidate || !isActive()) return;
    const role = currentCandidate.legendRole;
    if (!role) { setMessage('Choose a pitch position first.'); return; }
    const user = state.users[0];
    const picked = adjustedPlayer(currentCandidate, role);
    user.team.push(picked);
    state.acceptedPlayerNames.add(picked.player);
    state.history.push({ user:user.name, decision:'ACCEPT', player:picked, selectedRole:role });
    currentCandidate = null;
    if (neededRoles().length === 0) { completeLegendGame(); render(); return; }
    render();
    await pickLegend();
  }
  async function declineLegend(){
    if (!currentCandidate || !isActive()) return;
    const user = state.users[0];
    if ((user.declines || 0) >= DECLINES_ALLOWED) { setMessage('No declines left - choose a position and accept this player.'); setLegendButtons(); return; }
    user.declines += 1;
    user.declinedNames.add(currentCandidate.player);
    user.declinedNames.add(legendPlayerKey(currentCandidate.player));
    state.history.push({ user:user.name, decision:'DECLINE', player:currentCandidate });
    currentCandidate = null;
    render();
    await pickLegend();
  }
  function completeLegendGame(){
    currentCandidate = null;
    clearCandidate('Team complete. Reveal ratings to see the adjusted score.');
    els.revealBtn?.classList.remove('hidden');
    if (els.pickBtn) els.pickBtn.disabled = true;
    if (els.acceptBtn) els.acceptBtn.disabled = true;
    if (els.declineBtn) els.declineBtn.disabled = true;
  }
  const previousRenderCandidate = renderCandidate;
  renderCandidate = function(p){
    if (!isActive()) return previousRenderCandidate.apply(this, arguments);
    if (!els.candidateCard || !p) return;
    els.candidateCard.classList.remove('blank');
    els.candidateCard.innerHTML = `<p class="eyebrow">${MODE_LABEL}</p><h3 class="player-name">${esc(p.player)}</h3><div class="badge-row"><span class="badge dark">${esc(p.league)}</span><span class="badge">Natural: ${esc(p.naturalPosition || p.position)}</span></div><div class="detail-grid"><div class="detail"><span>Club(s)</span>${esc(p.club)}</div><div class="detail"><span>Selected role</span>${p.legendRole ? esc(roleLabel(p.legendRole)) : (p.naturalMainPosition === 'GK' ? 'GK' : 'Pick from pitch')}</div></div>`;
  };
  function slotPlayer(role, midIndex = 0){
    if (role === 'MID') return currentTeam().filter(p => (p.selectedRole || p.mainPosition) === 'MID')[midIndex] || null;
    return currentTeam().find(p => (p.selectedRole || p.mainPosition) === role) || null;
  }
  function slotMarkup(role, cls, midIndex = 0){
    const p = slotPlayer(role, midIndex);
    const can = !!currentCandidate && !p && neededRoles().includes(role) && ((currentCandidate.naturalMainPosition === 'GK' && role === 'GK') || (currentCandidate.naturalMainPosition !== 'GK' && role !== 'GK'));
    if (!p) return `<button type="button" class="pitch-player ${cls} empty-slot legend-slot ${can ? 'selectable' : ''} ${currentCandidate?.legendRole === role && can ? 'selected' : ''}" data-legend-slot="${role}" ${can ? '' : 'disabled'}><span class="pos">${roleLabel(role)}</span><span class="name">${can ? 'Place here' : 'Empty'}</span></button>`;
    const rating = ratingsRevealed ? `<span class="rating">${p.adjustedRating} (${p.baseRating} x ${Number(p.positionMultiplier || 0).toFixed(2)})</span>` : '';
    return `<div class="pitch-player ${cls} legend-filled"><span class="pos">${roleLabel(role)}</span><span class="name">${esc(shortenName(p.player))}</span><span class="club">${esc(shortenClub(p.club))}</span><span class="year">${esc(p.naturalPosition || p.position)}</span>${rating}</div>`;
  }
  const previousRenderTeams = renderTeams;
  renderTeams = function(){
    if (!isActive()) return previousRenderTeams.apply(this, arguments);
    const user = state?.users?.[0];
    if (!els.teamsContainer || !user) return;
    const needText = neededRoles().map(roleLabel);
    els.teamsContainer.innerHTML = `<article class="team-card legend-team"><div class="team-top-row"><div><h3>${esc(selectedLeague)}</h3><div class="team-meta">${needText.length ? `Needs ${needText.join(', ')}` : 'Complete'}</div></div><div class="score">${ratingsRevealed ? finalScore(user) : 'Hidden'}</div></div><div class="pitch legend-pitch"><div class="penalty-box top"></div><div class="penalty-box bottom"></div>${slotMarkup('GK','gk')}${slotMarkup('DEF','def')}${slotMarkup('MID','mid1',0)}${slotMarkup('MID','mid2',1)}${slotMarkup('FWD','fwd')}</div><div class="score">Declines used: ${user.declines}/${DECLINES_ALLOWED}</div></article>`;
    setLegendButtons();
  };
  const previousRender = render;
  render = function(...args){
    const result = previousRender.apply(this, args);
    if (isActive()) {
      if (els.turnEyebrow) els.turnEyebrow.textContent = MODE_LABEL;
      if (els.currentUserLabel) els.currentUserLabel.textContent = state?.selectedLegendLeague || selectedLeague;
      if (els.pickBtn) els.pickBtn.textContent = 'Randomise player';
      document.getElementById('activeYearRangePillStep5')?.remove();
      document.getElementById('soloSetupIntroStep7')?.remove();
    }
    return result;
  };
  const previousGetFinalScores = getFinalScores;
  getFinalScores = function(){
    if (!isActive()) return previousGetFinalScores.apply(this, arguments);
    const user = state?.users?.[0] || { name:selectedLeague, team:[] };
    return [{ user, total: finalScore(user) }];
  };
  const previousRenderResults = renderResults;
  renderResults = function(...args){
    const result = previousRenderResults.apply(this, args);
    if (state?.challengePreset === PRESET) {
      const eyebrow = document.querySelector('#resultsPanel .finished-hero .eyebrow');
      if (eyebrow) eyebrow.textContent = MODE_LABEL;
      const btn = document.getElementById('submitLeaderboardBtnStep19');
      if (btn) btn.onclick = safe(submitLegendLeaderboard);
      document.querySelectorAll('.finished-player-row').forEach((row, index) => {
        const p = currentTeam()[index];
        const meta = row.querySelector('.finished-player-meta');
        if (p && meta) meta.textContent = `${roleLabel(p.selectedRole || p.mainPosition)} from ${p.naturalPosition}`;
        const rating = row.querySelector('.finished-player-rating');
        if (p && rating) {
          row.classList.add('league-legends-result-row');
          rating.innerHTML = `<span class="league-legends-score-main">${p.adjustedRating}</span><span class="league-legends-score-multiplier">${Number(p.positionMultiplier || 0).toFixed(2)} x ${p.baseRating}</span>`;
        }
      });
    }
    return result;
  };
  async function submitLegendLeaderboard(){
    if (!state || !ratingsRevealed) { alert('Reveal the ratings first.'); return; }
    if (state.leaderboardSubmitted) { alert('This result has already been submitted from this screen.'); return; }
    const username = prompt('Enter leaderboard name (3-18 letters/numbers):', '');
    if (username === null) return;
    if (!validateUsername(username)) { alert('Invalid username. Use 3-18 characters: letters, numbers, spaces, underscores or hyphens. Avoid reserved names.'); return; }
    await ensureFirebase();
    await firebase.database().ref('leaderboard').push({ username:username.trim(), score:finalScore(state.users[0]), gameMode:MODE_LABEL, online:false, roomId:'', yearRange:null, selectedLegendLeague:state.selectedLegendLeague || selectedLeague || '', league:state.selectedLegendLeague || selectedLeague || '', leagueSelection:state.leagueSelection || { labels:[state.selectedLegendLeague || selectedLeague].filter(Boolean) }, team:currentTeam().map(p => ({ name:p.player, selectedRole:roleLabel(p.selectedRole || p.mainPosition), naturalPosition:p.naturalPosition, baseRating:p.baseRating, multiplier:p.positionMultiplier, rating:p.adjustedRating, club:p.club, league:p.league || state.selectedLegendLeague || selectedLeague || '' })), timestamp:Date.now() });
    state.leaderboardSubmitted = true;
    const btn = document.getElementById('submitLeaderboardBtnStep19');
    if (btn) { btn.textContent = 'Submitted ✅'; btn.disabled = true; }
    alert('League Legends Challenge score submitted to leaderboard.');
  }
  const previousReset = resetGame;
  resetGame = function(...args){
    if (isActive()) {
      window.challengePreset = null;
      document.getElementById('leagueLegendsSelector')?.remove();
      if (els.pickBtn) els.pickBtn.textContent = 'Pick player';
    }
    return previousReset.apply(this, args);
  };
  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-challenge="leaguelegends"]');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openLeagueLegendsSetup().catch(err => { console.error(err); alert(err.message || err); });
  }, true);
  document.addEventListener('click', event => {
    if (!isActive()) return;
    const slot = event.target?.closest?.('[data-legend-slot]');
    if (!slot) return;
    event.preventDefault(); event.stopImmediatePropagation(); chooseLegendRole(slot.dataset.legendSlot);
  }, true);
  document.addEventListener('click', event => {
    const id = event.target?.id;
    if (!['startBtn','pickBtn','acceptBtn','declineBtn'].includes(id)) return;
    const leagueLegendsSetupIsVisible = !!document.getElementById('leagueLegendsSelector');
    const leagueLegendsGameIsRunning = state?.challengePreset === PRESET;
    if (!isActive() || (!leagueLegendsSetupIsVisible && !leagueLegendsGameIsRunning)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const fn = { startBtn:startLeagueLegendsGame, pickBtn:pickLegend, acceptBtn:acceptLegend, declineBtn:declineLegend }[id];
    fn().catch(err => { console.error(err); setMessage(err.message || String(err)); });
  }, true);
  document.addEventListener('click', event => { if (event.target?.closest?.('#leaderboardBtn')) setTimeout(addLeaderboardTab, 0); }, true);
  const previousInjectEntry = injectEntryPanel;
  injectEntryPanel = function(...args){ const result = previousInjectEntry.apply(this, args); addStandaloneSection(); addLeaderboardTab(); return result; };
  setTimeout(() => { addStandaloneSection(); addLeaderboardTab(); }, 80);
})();


// --- League Legends leaderboard separation hotfix ---
// Keeps League Legends out of the All Time/Solo leaderboards and submits it under its own main leaderboard tab.
(function leagueLegendsLeaderboardSeparation(){
  const MODE = "League Legends Challenge";
  const PRESET = "leaguelegends";
  function isLeagueLegendsActive(){
    return state?.challengePreset === PRESET || window.challengePreset === PRESET;
  }
  function scoreLeagueLegends(){
    const team = Array.isArray(state?.users?.[0]?.team) ? state.users[0].team : [];
    return team.reduce((sum, p) => sum + Number(p.adjustedRating ?? p.rating ?? 0), 0);
  }
  function roleLabel(role){ return role === "FWD" ? "ST" : role; }
  async function submitLeagueLegendsLeaderboard(){
    if (!state || !ratingsRevealed) { alert("Reveal the ratings first."); return; }
    if (state.leaderboardSubmitted) { alert("This result has already been submitted from this screen."); return; }
    const username = prompt("Enter leaderboard name (3-18 letters/numbers):", "");
    if (username === null) return;
    if (!validateUsername(username)) {
      alert("Invalid username. Use 3-18 characters: letters, numbers, spaces, underscores or hyphens. Avoid reserved names.");
      return;
    }
    const team = Array.isArray(state?.users?.[0]?.team) ? state.users[0].team : [];
    await ensureFirebase();
    await firebase.database().ref("leaderboard").push({
      username: username.trim(),
      score: scoreLeagueLegends(),
      gameMode: MODE,
      online: false,
      roomId: "",
      yearRange: null,
      selectedLegendLeague: state.selectedLegendLeague || state.leagueSelection?.labels?.[0] || "",
      league: state.selectedLegendLeague || state.leagueSelection?.labels?.[0] || "",
      leagueSelection: state.leagueSelection || (state.selectedLegendLeague ? { labels: [state.selectedLegendLeague] } : null),
      leaderboardGroup: "leagueLegends",
      separateFromAllTime: true,
      team: team.map(p => ({
        name: p.player || "",
        selectedRole: roleLabel(p.selectedRole || p.mainPosition || p.position || ""),
        naturalPosition: p.naturalPosition || p.position || "",
        baseRating: Number(p.baseRating || 0),
        multiplier: Number(p.positionMultiplier || 0),
        rating: Number(p.adjustedRating ?? p.rating ?? 0),
        club: p.club || "",
        league: p.league || state.selectedLegendLeague || state.leagueSelection?.labels?.[0] || ""
      })),
      timestamp: Date.now()
    });
    state.leaderboardSubmitted = true;
    const btn = document.getElementById("submitLeaderboardBtnStep19");
    if (btn) { btn.textContent = "Submitted ✅"; btn.disabled = true; }
    alert("League Legends Challenge score submitted to leaderboard.");
  }
  function wireLeagueLegendsSubmit(){
    if (!isLeagueLegendsActive()) return;
    const btn = document.getElementById("submitLeaderboardBtnStep19");
    if (btn) btn.onclick = safe(submitLeagueLegendsLeaderboard);
  }
  const previousRenderResults = renderResults;
  renderResults = function(...args){
    const result = previousRenderResults.apply(this, args);
    wireLeagueLegendsSubmit();
    return result;
  };
  if (typeof showFinishedResultsPageV33 === "function") {
    const previousShowFinished = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function(...args){
      const result = previousShowFinished.apply(this, args);
      wireLeagueLegendsSubmit();
      return result;
    };
  }
})();


// --- v73 synchronous League Legends league resolver ---
// This is placed before the active leaderboard renderer uses metadataTextV55, so the selected league is available on the first draw.
window.getLeagueLegendsLeaderboardLeagueV73 = function(entry) {
  const NAME_TO_LEAGUE = {"thierry henry":"Premier League","alan shearer":"Premier League","mohamed salah":"Premier League","steven gerrard":"Premier League","wayne rooney":"Premier League","frank lampard":"Premier League","cristiano ronaldo":"Premier League","kevin de bruyne":"Premier League","roy keane":"Premier League","sergio aguero":"Premier League","paul scholes":"Premier League","john terry":"Premier League","eric cantona":"Premier League","virgil van dijk":"Premier League","patrick vieira":"Premier League","david silva":"Premier League","dennis bergkamp":"Premier League","harry kane":"Premier League","rio ferdinand":"Premier League","petr cech":"Premier League","ryan giggs":"Premier League","eden hazard":"Premier League","peter schmeichel":"Premier League","ashley cole":"Premier League","robin van persie":"Premier League","n golo kante":"Premier League","didier drogba":"Premier League","cesc fabregas":"Premier League","sol campbell":"Premier League","rodri":"Premier League","yaya toure":"Premier League","nemanja vidic":"Premier League","michael owen":"Premier League","vincent kompany":"Premier League","andrew cole":"Premier League","luis suarez":"Premier League","ruud van nistelrooy":"Premier League","robert pires":"Premier League","alisson becker":"Premier League","sadio mane":"Premier League","son heung min":"Premier League","david beckham":"Premier League","tony adams":"Premier League","david seaman":"Premier League","gareth bale":"Premier League","riyad mahrez":"Premier League","carlos tevez":"Premier League","robbie fowler":"Premier League","ian wright":"Premier League","jamie vardy":"Premier League","dwight yorke":"Premier League","edwin van der sar":"Premier League","jamie carragher":"Premier League","gary neville":"Premier League","michael essien":"Premier League","david de gea":"Premier League","claude makelele":"Premier League","mesut ozil":"Premier League","matt le tissier":"Premier League","jimmy floyd hasselbaink":"Premier League","bruno fernandes":"Premier League","dimitar berbatov":"Premier League","bernardo silva":"Premier League","trent alexander arnold":"Premier League","pepe reina":"Premier League","juan mata":"Premier League","kyle walker":"Premier League","marcus rashford":"Premier League","joe hart":"Premier League","raheem sterling":"Premier League","jermain defoe":"Premier League","teddy sheringham":"Premier League","gary speed":"Premier League","gareth barry":"Premier League","james milner":"Premier League","fernando torres":"Premier League","alexis sanchez":"Premier League","david ginola":"Premier League","luka modric":"Premier League","juninho paulista":"Premier League","xabi alonso":"Premier League","marcel desailly":"Premier League","coutinho":"Premier League","ricardo carvalho":"Premier League","andy robertson":"Premier League","les ferdinand":"Premier League","nicolas anelka":"Premier League","cesar azpilicueta":"Premier League","denis irwin":"Premier League","gianfranco zola":"Premier League","ledley king":"Premier League","kevin phillips":"Premier League","steve mcmanaman":"Premier League","paolo di canio":"Premier League","emmanuel adebayor":"Premier League","branislav ivanovic":"Premier League","laurent koscielny":"Premier League","chris sutton":"Premier League","ilkay gundogan":"Premier League","christian eriksen":"Premier League","lionel messi":"La Liga","alfredo di stefano":"La Liga","xavi":"La Liga","andres iniesta":"La Liga","johan cruyff":"La Liga","zinedine zidane":"La Liga","ronaldinho":"La Liga","karim benzema":"La Liga","raul":"La Liga","ferenc puskas":"La Liga","sergio ramos":"La Liga","iker casillas":"La Liga","sergio busquets":"La Liga","neymar":"La Liga","ronaldo nazario":"La Liga","romario":"La Liga","samuel eto o":"La Liga","ladislav kubala":"La Liga","luis figo":"La Liga","hugo sanchez":"La Liga","telmo zarra":"La Liga","paco gento":"La Liga","pirri":"La Liga","emilio butragueno":"La Liga","santillana":"La Liga","fernando hierro":"La Liga","carles puyol":"La Liga","dani alves":"La Liga","roberto carlos":"La Liga","marcelo":"La Liga","gerard pique":"La Liga","david villa":"La Liga","antoine griezmann":"La Liga","diego godin":"La Liga","jan oblak":"La Liga","thibaut courtois":"La Liga","diego simeone":"La Liga","koke":"La Liga","luis aragones":"La Liga","quini":"La Liga","cesar rodriguez":"La Liga","rivaldo":"La Liga","hristo stoichkov":"La Liga","michael laudrup":"La Liga","bernd schuster":"La Liga","gheorghe hagi":"La Liga","fernando redondo":"La Liga","deco":"La Liga","juan roman riquelme":"La Liga","diego forlan":"La Liga","joaquin":"La Liga","toni kroos":"La Liga","santi cazorla":"La Liga","juan carlos valeron":"La Liga","gaizka mendieta":"La Liga","pablo aimar":"La Liga","ivan rakitic":"La Liga","dani carvajal":"La Liga","juanito":"La Liga","luis enrique":"La Liga","pep guardiola":"La Liga","jordi alba":"La Liga","seydou keita":"La Liga","rafael marquez":"La Liga","javier mascherano":"La Liga","javier saviola":"La Liga","patrick kluivert":"La Liga","rafael van der vaart":"La Liga","arjen robben":"La Liga","isco":"La Liga","marco asensio":"La Liga","casemiro":"La Liga","vinicius junior":"La Liga","rodrygo":"La Liga","jude bellingham":"La Liga","kylian mbappe":"La Liga","robert lewandowski":"La Liga","pedri":"La Liga","gavi":"La Liga","lamine yamal":"La Liga","aritz aduriz":"La Liga","iago aspas":"La Liga","diego tristan":"La Liga","roy makaay":"La Liga","djalminha":"La Liga","fran":"La Liga","mauro silva":"La Liga","donato":"La Liga","jose antonio reyes":"La Liga","diego maradona":"Serie A","paolo maldini":"Serie A","francesco totti":"Serie A","roberto baggio":"Serie A","gianluigi buffon":"Serie A","alessandro del piero":"Serie A","michel platini":"Serie A","marco van basten":"Serie A","franco baresi":"Serie A","giuseppe meazza":"Serie A","silvio piola":"Serie A","gunnar nordahl":"Serie A","gianni rivera":"Serie A","andrea pirlo":"Serie A","gabriel batistuta":"Serie A","kaka":"Serie A","ruud gullit":"Serie A","lothar matthaus":"Serie A","javier zanetti":"Serie A","alessandro nesta":"Serie A","fabio cannavaro":"Serie A","paolo rossi":"Serie A","gigi riva":"Serie A","roberto mancini":"Serie A","christian vieri":"Serie A","zlatan ibrahimovic":"Serie A","andriy shevchenko":"Serie A","clarence seedorf":"Serie A","cafu":"Serie A","pavel nedved":"Serie A","dino zoff":"Serie A","gaetano scirea":"Serie A","sandro mazzola":"Serie A","giampiero boniperti":"Serie A","alessandro altobelli":"Serie A","giacinto facchetti":"Serie A","giuseppe bergomi":"Serie A","tarcisio burgnich":"Serie A","claudio gentile":"Serie A","antonio cabrini":"Serie A","marco tardelli":"Serie A","roberto donadoni":"Serie A","demetrio albertini":"Serie A","filippo inzaghi":"Serie A","ciro immobile":"Serie A","antonio di natale":"Serie A","hernan crespo":"Serie A","edinson cavani":"Serie A","gonzalo higuain":"Serie A","lautaro martinez":"Serie A","mauro icardi":"Serie A","paulo dybala":"Serie A","lorenzo insigne":"Serie A","dries mertens":"Serie A","marek hamsik":"Serie A","fabio quagliarella":"Serie A","alberto gilardino":"Serie A","luca toni":"Serie A","vincenzo montella":"Serie A","giuseppe signori":"Serie A","sinisa mihajlovic":"Serie A","dejan stankovic":"Serie A","juan sebastian veron":"Serie A","edgar davids":"Serie A","frank rijkaard":"Serie A","george weah":"Serie A","maicon":"Serie A","walter samuel":"Serie A","lucio":"Serie A","wesley sneijder":"Serie A","diego milito":"Serie A","esteban cambiasso":"Serie A","julio cesar":"Serie A","samir handanovic":"Serie A","giorgio chiellini":"Serie A","leonardo bonucci":"Serie A","andrea barzagli":"Serie A","paul pogba":"Serie A","arturo vidal":"Serie A","claudio marchisio":"Serie A","federico chiesa":"Serie A","dusan vlahovic":"Serie A","khvicha kvaratskhelia":"Serie A","victor osimhen":"Serie A","kim min jae":"Serie A","kalidou koulibaly":"Serie A","jorginho":"Serie A","thiago silva":"Serie A","zvonimir boban":"Serie A","dejan savicevic":"Serie A","jean pierre papin":"Serie A","oliver bierhoff":"Serie A","just fontaine":"Ligue 1","raymond kopa":"Ligue 1","delio onnis":"Ligue 1","bernard lacombe":"Ligue 1","alain giresse":"Ligue 1","juninho pernambucano":"Ligue 1","pauleta":"Ligue 1","carlos bianchi":"Ligue 1","josip skoblar":"Ligue 1","roger piantoni":"Ligue 1","herve revelli":"Ligue 1","dominique rocheteau":"Ligue 1","didier deschamps":"Ligue 1","laurent blanc":"Ligue 1","lilian thuram":"Ligue 1","fabien barthez":"Ligue 1","hugo lloris":"Ligue 1","steve mandanda":"Ligue 1","marquinhos":"Ligue 1","safet susic":"Ligue 1","mustapha dahleb":"Ligue 1","rai":"Ligue 1","sonny anderson":"Ligue 1","alexandre lacazette":"Ligue 1","wissam ben yedder":"Ligue 1","david trezeguet":"Ligue 1","youri djorkaeff":"Ligue 1","djibril cisse":"Ligue 1","bafetimbi gomis":"Ligue 1","andre pierre gignac":"Ligue 1","dimitri payet":"Ligue 1","florian thauvin":"Ligue 1","franck ribery":"Ligue 1","samir nasri":"Ligue 1","hatem ben arfa":"Ligue 1","ludovic giuly":"Ligue 1","sylvain wiltord":"Ligue 1","emmanuel petit":"Ligue 1","blaise matuidi":"Ligue 1","marco verratti":"Ligue 1","angel di maria":"Ligue 1","ousmane dembele":"Ligue 1","vitinha":"Ligue 1","bradley barcola":"Ligue 1","olivier giroud":"Ligue 1","gervinho":"Ligue 1","pierre emerick aubameyang":"Ligue 1","radamel falcao":"Ligue 1","james rodriguez":"Ligue 1","fabinho":"Ligue 1","joao moutinho":"Ligue 1","nabil fekir":"Ligue 1","memphis depay":"Ligue 1","lisandro lopez":"Ligue 1","mamadou niang":"Ligue 1","moussa sow":"Ligue 1","yoann gourcuff":"Ligue 1","mickael landreau":"Ligue 1","gregory coupet":"Ligue 1","joel bats":"Ligue 1","bernard lama":"Ligue 1","jean tigana":"Ligue 1","marius tresor":"Ligue 1","maxime bossis":"Ligue 1","dominique bathenay":"Ligue 1","luis fernandez":"Ligue 1","jean marc guillou":"Ligue 1","jean michel larque":"Ligue 1","robert herbin":"Ligue 1","salif keita":"Ligue 1","rachid mekhloufi":"Ligue 1","fleury di nallo":"Ligue 1","roger courtois":"Ligue 1","thadee cisowski":"Ligue 1","joseph ujlaki":"Ligue 1","gunnar andersson":"Ligue 1","hassan akesbi":"Ligue 1","jean baratte":"Ligue 1","andre guy":"Ligue 1","jacky vergnes":"Ligue 1","lucien cossou":"Ligue 1","gerd muller":"Bundesliga","franz beckenbauer":"Bundesliga","manuel neuer":"Bundesliga","karl heinz rummenigge":"Bundesliga","philipp lahm":"Bundesliga","oliver kahn":"Bundesliga","uwe seeler":"Bundesliga","matthias sammer":"Bundesliga","thomas muller":"Bundesliga","bastian schweinsteiger":"Bundesliga","jupp heynckes":"Bundesliga","klaus fischer":"Bundesliga","sepp maier":"Bundesliga","jurgen klinsmann":"Bundesliga","kevin keegan":"Bundesliga","miroslav klose":"Bundesliga","paul breitner":"Bundesliga","michael ballack":"Bundesliga","andreas moller":"Bundesliga","rudi voller":"Bundesliga","marco reus":"Bundesliga","gunter netzer":"Bundesliga","wolfgang overath":"Bundesliga","dieter muller":"Bundesliga","claudio pizarro":"Bundesliga","giovane elber":"Bundesliga","mario gomez":"Bundesliga","ulf kirsten":"Bundesliga","stefan kuntz":"Bundesliga","klaus allofs":"Bundesliga","manfred burgsmuller":"Bundesliga","horst hrubesch":"Bundesliga","hannes lohr":"Bundesliga","bernd holzenbein":"Bundesliga","mehmet scholl":"Bundesliga","stefan effenberg":"Bundesliga","mats hummels":"Bundesliga","jerome boateng":"Bundesliga","david alaba":"Bundesliga","joshua kimmich":"Bundesliga","florian wirtz":"Bundesliga","erling haaland":"Bundesliga","l cio":"Bundesliga","z roberto":"Bundesliga","tom rosick":"Bundesliga","sebastian deisler":"Bundesliga","franck rib ry":"Bundesliga","christoph metzelder":"Bundesliga","daniel van buyten":"Bundesliga","marcelinho":"Bundesliga","christian w rns":"Bundesliga","j r me boateng":"Bundesliga","michael olise":"Bundesliga","andr s d alessandro":"Bundesliga","fernando meira":"Bundesliga","jens nowotny":"Bundesliga","timo hildebrand":"Bundesliga","marcelo bordon":"Bundesliga","jon dahl tomasson":"Bundesliga","lukas podolski":"Bundesliga","marek mintal":"Bundesliga","diego":"Bundesliga","thiago alc ntara":"Bundesliga","leon goretzka":"Bundesliga","jamal musiala":"Bundesliga","willy sagnol":"Bundesliga","val rien isma l":"Bundesliga","bernd schneider":"Bundesliga","per mertesacker":"Bundesliga","thomas m ller":"Bundesliga","james rodr guez":"Bundesliga","jadon sancho":"Bundesliga","sadio man":"Bundesliga","gregor kobel":"Bundesliga","jonathan tah":"Bundesliga","luis d az":"Bundesliga","ailton":"Bundesliga","d d":"Bundesliga","markus babbel":"Bundesliga","mladen krstajic":"Bundesliga","roman weidenfeller":"Bundesliga","torsten frings":"Bundesliga","ren adler":"Bundesliga","bernd leno":"Bundesliga","yann sommer":"Bundesliga","serge gnabry":"Bundesliga","timo werner":"Bundesliga"};
  function clean(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    if (["selected league", "selected leagues", "unknown league", "undefined", "null"].includes(text.toLowerCase())) return "";
    return text;
  }
  function normName(value) {
    return clean(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  const selection = entry?.leagueSelection || {};
  const values = [
    entry?.selectedLegendLeague,
    entry?.legendLeague,
    entry?.selectedLeague,
    entry?.league,
    selection.labels,
    selection.label,
    selection.selectedLegendLeague,
    selection.selectedLeague,
    selection.league
  ];
  const direct = [];
  values.forEach(value => {
    if (Array.isArray(value)) direct.push(...value);
    else if (value && typeof value === "object") direct.push(...Object.values(value));
    else direct.push(value);
  });
  if (Array.isArray(entry?.team)) {
    entry.team.forEach(player => direct.push(player?.league, player?.League, player?.selectedLegendLeague, player?.legendLeague));
  }
  const cleanDirect = [...new Set(direct.map(clean).filter(Boolean))];
  if (cleanDirect.length) return cleanDirect.join(", ");

  const counts = new Map();
  const team = Array.isArray(entry?.team) ? entry.team : [];
  team.forEach(player => {
    const name = normName(player?.name || player?.player || player?.Player);
    const league = NAME_TO_LEAGUE[name];
    if (league) counts.set(league, (counts.get(league) || 0) + 1);
  });
  if (!counts.size) return "";
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
};

// --- v55 leaderboard tab restructure ---
// Replaces the previous mixed leaderboard tabs with four clean categories:
// Solo Mode, Online Battles, League Legends, Monthly Challenges.
(function leaderboardTabRestructureV55(){
  const GROUPS = {
    solo: {
      label: "Solo Mode",
      defaultSub: "all",
      subs: [
        { key: "all", label: "All", modes: ["Solo Challenge", "Ultimate Solo Mode", "Easy Solo Challenge", "League Challenge"] },
        { key: "standard", label: "Standard Solo", modes: ["Solo Challenge"] },
        { key: "ultimate", label: "Ultimate Solo", modes: ["Ultimate Solo Mode"] },
        { key: "easy", label: "Easy Solo", modes: ["Easy Solo Challenge"] },
        { key: "league", label: "League Challenge", modes: ["League Challenge"] }
      ]
    },
    online: {
      label: "Online Battles",
      defaultSub: "all",
      subs: [
        { key: "all", label: "All", modes: ["Online Ultimate Draft", "Online Blind Bidding", "Online Live Auction"] },
        { key: "draft", label: "Ultimate Draft", modes: ["Online Ultimate Draft"] },
        { key: "blind", label: "Blind Bidding", modes: ["Online Blind Bidding"] },
        { key: "live", label: "Live Auction", modes: ["Online Live Auction"] }
      ]
    },
    legends: {
      label: "League Legends",
      defaultSub: "all",
      subs: [
        { key: "all", label: "All", modes: ["League Legends Challenge"] }
      ]
    },
    monthly: {
      label: "Monthly Challenges",
      defaultSub: "all",
      subs: [
        { key: "all", label: "All", modes: ["World Cup 2026 Challenge"] },
        { key: "worldcup2026", label: "World Cup 2026", modes: ["World Cup 2026 Challenge"] }
      ]
    }
  };

  let activeGroup = "solo";
  let activeSubByGroup = { solo: "all", online: "all", legends: "all", monthly: "all" };

  function escV55(value) {
    return String(value ?? "").replace(/[&<>'\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));
  }
  function modeV55(entry) { return String(entry?.gameMode || "Unknown").trim() || "Unknown"; }
  function yearRangeTextV55(entry) {
    const range = entry?.yearRange;
    if (!range || typeof range !== "object") return "";
    const start = Number(range.start ?? range.from ?? range.min ?? 0);
    const end = Number(range.end ?? range.to ?? range.max ?? 0);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !start || !end) return "";
    const a = Math.min(start, end); const b = Math.max(start, end);
    return a === b ? `Year: ${a}` : `Years: ${a} - ${b}`;
  }
  function leagueLabelsV55(entry) {
    const selection = entry?.leagueSelection || {};
    const candidates = [
      selection.labels,
      selection.label,
      selection.selectedLeague,
      selection.league,
      entry?.selectedLegendLeague,
      entry?.legendLeague,
      entry?.league
    ];
    let output = [];
    candidates.forEach(value => {
      if (Array.isArray(value)) output.push(...value);
      else if (value && typeof value === "object") output.push(...Object.values(value));
      else if (typeof value === "string") output.push(value);
    });
    if (Array.isArray(entry?.team)) {
      output.push(...entry.team.map(player => player?.league));
    }
    return [...new Set(output.map(x => String(x || "").trim()).filter(Boolean))];
  }
  function metadataTextV55(entry) {
    const mode = modeV55(entry);
    if (mode === "League Challenge") {
      const labels = leagueLabelsV55(entry).filter(label => !/^unknown league$/i.test(String(label || "").trim()));
      return labels.length ? `Leagues: ${labels.join(", ")}` : "";
    }
    if (mode === "League Legends Challenge") {
      const resolvedLeague = typeof window.getLeagueLegendsLeaderboardLeagueV73 === "function"
        ? window.getLeagueLegendsLeaderboardLeagueV73(entry)
        : "";
      if (resolvedLeague) return `League: ${resolvedLeague}`;
      const labels = leagueLabelsV55(entry).filter(label => !/^(selected league|unknown league)$/i.test(String(label || "").trim()));
      return labels.length ? `League: ${labels.join(", ")}` : "";
    }
    if (mode === "World Cup 2026 Challenge") return "Player pool: World Cup 2026";
    const yearText = yearRangeTextV55(entry);
    if (yearText) return yearText;
    if (mode === "Ultimate Solo Mode") return "Years: all years";
    return "";
  }
  function currentSubConfigV55() {
    const group = GROUPS[activeGroup] || GROUPS.solo;
    const subKey = activeSubByGroup[activeGroup] || group.defaultSub || "all";
    return group.subs.find(sub => sub.key === subKey) || group.subs[0];
  }
  function ensureStylesV55() {
    if (document.getElementById("leaderboardStructureStylesV55")) return;
    const style = document.createElement("style");
    style.id = "leaderboardStructureStylesV55";
    style.textContent = `
      .leaderboard-main-tabs-v55{margin-bottom:10px!important}.leaderboard-subtabs-v55{margin-top:-4px!important;margin-bottom:16px!important;padding:10px 12px!important;background:rgba(248,250,252,.92)!important;border:1px solid rgba(226,232,240,.95)!important;border-radius:16px!important}.leaderboard-tab-v55.active{background:linear-gradient(135deg,var(--primary),var(--primary-dark))!important;color:#fff!important;border-color:transparent!important;box-shadow:0 10px 24px rgba(37,99,235,.22)!important}.leaderboard-tab-v55[data-leaderboard-group="legends"].active{background:linear-gradient(135deg,#f59e0b,#ea580c)!important;color:#111827!important}.leaderboard-row.leaderboard-row-v55{grid-template-columns:54px minmax(0,1fr) minmax(170px,max-content) 74px!important;align-items:center!important;column-gap:14px!important;row-gap:3px}.leaderboard-row.leaderboard-row-v55 .leaderboard-mode{text-align:right!important;justify-self:end!important;white-space:nowrap!important}.leaderboard-row.leaderboard-row-v55 .leaderboard-score{text-align:right!important;justify-self:end!important;min-width:58px!important;font-variant-numeric:tabular-nums}.leaderboard-meta-v55{grid-column:2 / span 3;color:#64748b;font-size:.78rem;font-weight:850;line-height:1.25;overflow-wrap:anywhere}@media(max-width:720px){.leaderboard-row.leaderboard-row-v55{grid-template-columns:44px minmax(0,1fr) 72px!important;column-gap:10px!important}.leaderboard-row.leaderboard-row-v55 .leaderboard-name{grid-column:2}.leaderboard-row.leaderboard-row-v55 .leaderboard-score{grid-column:3;grid-row:1;text-align:right!important}.leaderboard-row.leaderboard-row-v55 .leaderboard-mode{grid-column:2 / span 2;grid-row:2;text-align:left!important;justify-self:start!important;white-space:normal!important}.leaderboard-meta-v55{grid-column:2 / span 2}}
    `;
    document.head.appendChild(style);
  }
  function rebuildLeaderboardTabsV55() {
    ensureStylesV55();
    const panel = document.getElementById("leaderboardPanel"); if (!panel) return false;
    const rows = panel.querySelectorAll(".leaderboard-tabs");
    const mainTabs = rows[0]; const subTabs = document.getElementById("soloLeaderboardSubTabs") || rows[1];
    if (!mainTabs || !subTabs) return false;
    mainTabs.classList.add("leaderboard-main-tabs-v55");
    mainTabs.innerHTML = Object.entries(GROUPS).map(([key, group]) => `<button type="button" class="leaderboard-tab leaderboard-tab-v55 ${key === activeGroup ? "active" : ""}" data-leaderboard-group="${escV55(key)}">${escV55(group.label)}</button>`).join("");
    const group = GROUPS[activeGroup] || GROUPS.solo;
    const activeSub = activeSubByGroup[activeGroup] || group.defaultSub || "all";
    subTabs.className = "leaderboard-tabs solo-leaderboard-subtabs leaderboard-subtabs-v55";
    subTabs.classList.remove("hidden");
    subTabs.setAttribute("aria-label", `${group.label} leaderboard filters`);
    subTabs.innerHTML = group.subs.map(sub => `<button type="button" class="leaderboard-tab leaderboard-tab-v55 leaderboard-sub-tab-v55 ${sub.key === activeSub ? "active" : ""}" data-leaderboard-sub="${escV55(sub.key)}">${escV55(sub.label)}</button>`).join("");
    return true;
  }
  async function loadLeaderboardV55() {
    const list = document.getElementById("leaderboardList"); if (!list) return;
    const allowedModes = new Set(currentSubConfigV55().modes || []);
    list.innerHTML = `<div class="leaderboard-empty">Loading leaderboard...</div>`;
    try {
      await ensureFirebase();
      const snapshot = await firebase.database().ref("leaderboard").once("value");
      if (!snapshot.exists()) { list.innerHTML = `<div class="leaderboard-empty">No scores submitted yet.</div>`; return; }
      let entries = Object.values(snapshot.val() || {})
        .filter(entry => Number.isFinite(Number(entry.score)))
        .map(entry => ({ ...entry, username: String(entry.username || "Player").trim() || "Player", score: Number(entry.score || 0), gameMode: modeV55(entry), timestamp: Number(entry.timestamp || 0) }))
        .filter(entry => allowedModes.has(entry.gameMode));
      entries.sort((a,b) => b.score !== a.score ? b.score - a.score : b.timestamp - a.timestamp);
      const top20 = entries.slice(0,20);
      if (!top20.length) { list.innerHTML = `<div class="leaderboard-empty">No scores yet for this leaderboard.</div>`; return; }
      list.innerHTML = top20.map((entry, index) => {
        const meta = metadataTextV55(entry);
        return `<div class="leaderboard-row leaderboard-row-v55"><span class="leaderboard-rank">#${index + 1}</span><span class="leaderboard-name">${escV55(entry.username)}</span><span class="leaderboard-mode">${escV55(entry.gameMode)}</span><span class="leaderboard-score">${entry.score}</span>${meta ? `<span class="leaderboard-meta-v55">${escV55(meta)}</span>` : ""}</div>`;
      }).join("");
    } catch (error) {
      list.innerHTML = `<div class="leaderboard-error">Could not load leaderboard. ${escV55(error.message || error)}</div>`;
    }
  }
  function refreshLeaderboardV55() { if (rebuildLeaderboardTabsV55()) loadLeaderboardV55(); }
  window.addEventListener("click", function(event){
    const panel = document.getElementById("leaderboardPanel"); if (!panel || panel.classList.contains("hidden")) return;
    const mainTab = event.target?.closest?.("[data-leaderboard-group]");
    const subTab = event.target?.closest?.("[data-leaderboard-sub]");
    if (!mainTab && !subTab) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (mainTab) { const next = mainTab.dataset.leaderboardGroup; if (GROUPS[next]) { activeGroup = next; activeSubByGroup[activeGroup] = activeSubByGroup[activeGroup] || GROUPS[activeGroup].defaultSub || "all"; } }
    if (subTab) { const group = GROUPS[activeGroup] || GROUPS.solo; const next = subTab.dataset.leaderboardSub || group.defaultSub || "all"; activeSubByGroup[activeGroup] = group.subs.some(sub => sub.key === next) ? next : group.defaultSub || "all"; }
    refreshLeaderboardV55();
  }, true);
  window.addEventListener("click", function(event){
    if (!event.target?.closest?.("#leaderboardBtn")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    hideEntryPanel();
    show(ensureLobby(), false);
    show(els.setupPanel, false);
    show(els.gamePanel, false);
    show(els.resultsPanel, false);
    show(document.getElementById("leaderboardPanel"), true);
    refreshLeaderboardV55();
    setTimeout(() => document.getElementById("leaderboardPanel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }, true);
  setTimeout(rebuildLeaderboardTabsV55, 0);
})();


// --- homepage layout polish: League Legends above Popular Challenges ---
(function homepageLeagueLegendsLayoutPolish(){
  function tidyHomepageLayout(){
    const entry = document.getElementById("gameEntryPanel");
    if (!entry) return;

    const popular = entry.querySelector(".popular-challenges-v2");
    const legends = document.getElementById("leagueLegendsHome");
    if (popular && legends && legends.nextElementSibling !== popular) {
      entry.insertBefore(legends, popular);
    }

    if (legends) {
      const title = legends.querySelector(".league-legends-hero-copy h3");
      if (title) title.textContent = "League Legends";
      const eyebrow = legends.querySelector(".league-legends-title-line .eyebrow");
      if (eyebrow) eyebrow.textContent = "Game mode";
      const button = legends.querySelector('[data-challenge="leaguelegends"]');
      if (button) button.textContent = "Play League Legends";
      legends.setAttribute("aria-label", "League Legends game mode");
    }

    entry.querySelectorAll(".challenge-card-v2").forEach(card => {
      const text = (card.textContent || "").toLowerCase();
      if (text.includes("nostalgia challenge")) card.remove();
    });
  }

  const previousInjectEntryPanelHomepagePolish = injectEntryPanel;
  injectEntryPanel = function(...args){
    const result = previousInjectEntryPanelHomepagePolish.apply(this, args);
    setTimeout(tidyHomepageLayout, 0);
    setTimeout(tidyHomepageLayout, 80);
    return result;
  };

  document.addEventListener("DOMContentLoaded", () => setTimeout(tidyHomepageLayout, 0));
  setTimeout(tidyHomepageLayout, 120);
})();


// --- homepage title casing polish ---
(function homepageTitleCasingPolish(){
  function fixOnlineGameTitle(){
    const heading = document.querySelector('#gameEntryPanel .online-card h3');
    if (heading && heading.textContent.trim() === 'Online game') heading.textContent = 'Online Game';
  }
  const previousInjectEntryPanelTitleCase = injectEntryPanel;
  injectEntryPanel = function(...args){
    const result = previousInjectEntryPanelTitleCase.apply(this, args);
    setTimeout(fixOnlineGameTitle, 0);
    return result;
  };
  setTimeout(fixOnlineGameTitle, 120);
})();


// --- League Legends reset button visibility fix ---
// Ensures League Legends shows the same top-right Reset game button as the other modes.
(function leagueLegendsResetButtonVisibilityV61(){
  const PRESET = "leaguelegends";
  function ensureResetVisibleForLeagueLegends(){
    if ((window.challengePreset === PRESET || state?.challengePreset === PRESET) && els?.resetBtn) {
      els.resetBtn.style.display = "";
    }
  }
  const previousRenderLeagueLegendsResetV61 = render;
  render = function(...args){
    const result = previousRenderLeagueLegendsResetV61.apply(this, args);
    ensureResetVisibleForLeagueLegends();
    return result;
  };
  document.addEventListener("click", event => {
    if (event.target?.closest?.('[data-challenge="leaguelegends"]')) {
      setTimeout(ensureResetVisibleForLeagueLegends, 0);
    }
  }, true);
})();


// --- Global mode transition cleanup and all-mode Firebase stats fix ---
// Keeps mode-specific setup UIs isolated and records completed games for all current game modes.
(function allModesCleanupAndStatsV63(){
  const LEGENDS_PRESET = "leaguelegends";
  const STATS_NODE = "stats";

  function statsKey(label){
    return String(label || "unknown")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "unknown";
  }

  function ukDateKey(date = new Date()){
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(date);
    } catch (err) {
      return date.toISOString().slice(0, 10);
    }
  }

  function detectCurrentModeLabel(){
    if (!state) return "Unknown";

    const preset = state.challengePreset || window.challengePreset || "";

    if (!online.enabled && state.gameMode === "draft" && Number(state.userCount || 0) === 1) {
      if (preset === "leaguelegends") return "League Legends Challenge";
      if (preset === "league") return "League Challenge";
      if (preset === "worldcup2026") return "World Cup 2026 Challenge";
      if (preset === "ultimate") return "Ultimate Solo Mode";
      if (preset === "easy") return "Easy Solo Challenge";
      return "Solo Challenge";
    }

    if (online.enabled && state.gameMode === "draft") return "Online Ultimate Draft";
    if (online.enabled && state.gameMode === "bid" && state.onlineBidMode === "live") return "Online Live Auction";
    if (online.enabled && state.gameMode === "bid") return "Online Blind Bidding";
    if (!online.enabled && state.gameMode === "bid") return "Local Bidding";
    if (!online.enabled && state.gameMode === "draft") return "Local Ultimate Draft";

    return state.challengeName || state.gameMode || "Unknown";
  }

  function topScoreForStats(){
    try {
      if (typeof getFinalScores === "function") {
        const scored = getFinalScores();
        const total = Number(scored?.[0]?.total || 0);
        if (total) return total;
      }
    } catch (err) {}

    const teams = Array.isArray(state?.users) ? state.users : [];
    return teams.reduce((best, user) => {
      const team = Array.isArray(user?.team) ? user.team : [];
      const total = team.reduce((sum, player) => sum + Number(player.adjustedRating ?? player.rating ?? 0), 0);
      return Math.max(best, total);
    }, 0);
  }

  function isCompleteEnoughForStats(){
    if (!state || state.statsRecorded) return false;
    if (typeof isGameComplete === "function") {
      try { if (isGameComplete()) return true; } catch (err) {}
    }
    if (state.challengePreset === LEGENDS_PRESET) {
      const team = Array.isArray(state.users?.[0]?.team) ? state.users[0].team : [];
      return team.length >= 5 && !!ratingsRevealed;
    }
    return !!ratingsRevealed;
  }

  async function recordCompletedGameStatsFallback(){
    if (!isCompleteEnoughForStats()) return;

    const label = detectCurrentModeLabel();
    const key = statsKey(label);
    const today = ukDateKey();
    const now = Date.now();

    state.statsRecorded = true;
    state.statsRecordedAt = now;
    state.statsMode = label;

    try {
      await ensureFirebase();
      const increment = firebase.database.ServerValue.increment(1);
      const recentRef = firebase.database().ref(`${STATS_NODE}/recent`).push();
      const updates = {};

      updates[`${STATS_NODE}/totals/all`] = increment;
      updates[`${STATS_NODE}/totals/byMode/${key}`] = increment;
      updates[`${STATS_NODE}/modeLabels/${key}`] = label;
      updates[`${STATS_NODE}/daily/${today}/total`] = increment;
      updates[`${STATS_NODE}/daily/${today}/byMode/${key}`] = increment;
      updates[`${STATS_NODE}/lastCompletedAt`] = now;
      updates[`${STATS_NODE}/lastCompletedMode`] = label;
      updates[`${STATS_NODE}/daily/${today}/lastCompletedAt`] = now;
      updates[`${STATS_NODE}/recent/${recentRef.key}`] = {
        mode: label,
        modeKey: key,
        online: !!online.enabled,
        roomId: online.enabled ? (online.roomId || "") : "",
        userCount: Number(state.userCount || (Array.isArray(state.users) ? state.users.length : 0) || 0),
        topScore: topScoreForStats(),
        challengePreset: state.challengePreset || window.challengePreset || "",
        leagueSelection: state.leagueSelection || null,
        yearRange: state.yearRange || null,
        completedAt: now,
        dateKey: today
      };

      await firebase.database().ref().update(updates);
      console.log("Completed game stats recorded:", label);
    } catch (err) {
      state.statsRecorded = false;
      console.warn("Could not record completed game stats", err);
    }
  }

  function cleanupLeagueLegendsUiIfInactive(){
    if (window.challengePreset === LEGENDS_PRESET || state?.challengePreset === LEGENDS_PRESET) return;

    document.getElementById("leagueLegendsSelector")?.remove();

    const year = document.getElementById("localYearSlicerHolderStep4");
    if (year) {
      year.style.display = "";
      year.style.opacity = "";
      year.style.pointerEvents = "";
      year.querySelectorAll('input[type="range"]').forEach(input => { input.disabled = false; });
    }

    if (els?.pickBtn && els.pickBtn.textContent === "Randomise player") {
      els.pickBtn.textContent = "Pick player";
    }
  }

  function leavingLegendsFromClick(event){
    const challengeCard = event.target?.closest?.("[data-challenge]");
    if (challengeCard && challengeCard.dataset.challenge !== LEGENDS_PRESET) return true;
    if (event.target?.closest?.("#startLocalGameBtn, #createOnlineRoomBtn, #joinOnlineRoomBtn, #leaderboardBtn")) return true;
    return false;
  }

  document.addEventListener("click", event => {
    if (!leavingLegendsFromClick(event)) return;
    const challengeCard = event.target?.closest?.("[data-challenge]");
    if (!challengeCard && window.challengePreset === LEGENDS_PRESET && !state) {
      window.challengePreset = "standard";
    }
    setTimeout(cleanupLeagueLegendsUiIfInactive, 0);
  }, true);

  const previousUpdateSetupForModeAllModesV63 = updateSetupForMode;
  updateSetupForMode = function(...args){
    const result = previousUpdateSetupForModeAllModesV63.apply(this, args);
    setTimeout(cleanupLeagueLegendsUiIfInactive, 0);
    return result;
  };

  const previousRenderResultsAllModesV63 = renderResults;
  renderResults = function(...args){
    const result = previousRenderResultsAllModesV63.apply(this, args);
    setTimeout(recordCompletedGameStatsFallback, 0);
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const previousShowFinishedAllModesV63 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function(...args){
      const result = previousShowFinishedAllModesV63.apply(this, args);
      setTimeout(recordCompletedGameStatsFallback, 0);
      return result;
    };
  }

  const previousResetAllModesV63 = resetGame;
  resetGame = function(...args){
    const result = previousResetAllModesV63.apply(this, args);
    setTimeout(cleanupLeagueLegendsUiIfInactive, 0);
    return result;
  };
})();


// --- v65 leaderboard subtab polish and duplicate cleanup ---
// Keeps the new v55 leaderboard structure tidy after older leaderboard patches and makes subtabs visually distinct.
(function leaderboardSubtabPolishAndLegendsLeagueV65(){
  function injectSubtabPolishStylesV65(){
    if (document.getElementById("leaderboardSubtabPolishStylesV65")) return;
    const style = document.createElement("style");
    style.id = "leaderboardSubtabPolishStylesV65";
    style.textContent = `
      .leaderboard-subtabs-v55{
        gap:8px!important;
        padding:8px 10px!important;
        background:#f8fbff!important;
        border-color:#dbeafe!important;
      }
      .leaderboard-subtabs-v55 .leaderboard-tab-v55{
        min-height:34px!important;
        padding:7px 11px!important;
        border-radius:14px!important;
        font-size:.78rem!important;
        line-height:1!important;
        background:#f1f7ff!important;
        border-color:#bfdbfe!important;
        color:#1e3a8a!important;
        box-shadow:none!important;
      }
      .leaderboard-subtabs-v55 .leaderboard-tab-v55.active{
        background:linear-gradient(135deg,#dbeafe,#bfdbfe)!important;
        border-color:#93c5fd!important;
        color:#0f3b75!important;
        box-shadow:0 6px 14px rgba(37,99,235,.12)!important;
      }
      .leaderboard-subtabs-v55 .leaderboard-tab-v55:hover{
        background:#e0efff!important;
      }
      @media(max-width:720px){
        .leaderboard-subtabs-v55{gap:6px!important;padding:7px!important;}
        .leaderboard-subtabs-v55 .leaderboard-tab-v55{font-size:.74rem!important;padding:7px 9px!important;min-height:32px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function removeLegacyDuplicateSubtabsV65(){
    const holder = document.getElementById("soloLeaderboardSubTabs");
    if (!holder) return;

    // Older code appends legacy solo-sub-tab buttons using data-solo-leaderboard-filter.
    // The current v55 subtabs use data-leaderboard-sub. Remove the legacy duplicate buttons.
    holder.querySelectorAll('[data-solo-leaderboard-filter="League Challenge"]').forEach(button => button.remove());

    // Extra safety: if duplicate visual labels still exist in the current v55 set, keep the first one only.
    const seen = new Set();
    holder.querySelectorAll('[data-leaderboard-sub]').forEach(button => {
      const key = `${button.dataset.leaderboardSub || ""}|${(button.textContent || "").trim().toLowerCase()}`;
      if (seen.has(key)) button.remove();
      else seen.add(key);
    });
  }

  function applyV65(){
    injectSubtabPolishStylesV65();
    removeLegacyDuplicateSubtabsV65();
  }

  document.addEventListener("click", event => {
    if (!event.target?.closest?.("#leaderboardPanel, #leaderboardBtn")) return;
    setTimeout(applyV65, 0);
    setTimeout(applyV65, 80);
    setTimeout(applyV65, 180);
  }, true);

  setTimeout(applyV65, 0);
  setTimeout(applyV65, 150);
})();


// --- v66 authoritative results mode labels + League Legends league persistence ---
// Fixes any final-results/saved-image label that is overwritten by older solo-result patches.
// Also keeps the selected League Legends league explicit in state before leaderboard/stats saves.
(function resultsModeLabelsAndLegendLeagueV66(){
  const PRESET_LABELS_V66 = {
    leaguelegends: "League Legends Challenge",
    league: "League Challenge",
    worldcup2026: "World Cup 2026 Challenge",
    ultimate: "Ultimate Solo Mode",
    easy: "Easy Solo Challenge",
    standard: "Solo Challenge"
  };

  function cleanTextV66(value){
    return String(value || "").trim();
  }

  function getPresetV66(){
    return cleanTextV66(state?.challengePreset || window.challengePreset || "").toLowerCase();
  }

  function getModeLabelV66(){
    if (!state) return "Ultimate 5-a-side Draft";

    const preset = getPresetV66();
    if (PRESET_LABELS_V66[preset]) return PRESET_LABELS_V66[preset];
    if (state.challengeName) return cleanTextV66(state.challengeName);

    if (online.enabled && state.gameMode === "draft") return "Online Ultimate Draft";
    if (online.enabled && state.gameMode === "bid" && state.onlineBidMode === "live") return "Online Live Auction";
    if (online.enabled && state.gameMode === "bid") return "Online Blind Bidding";
    if (!online.enabled && state.gameMode === "bid") return "Local Bidding";
    if (!online.enabled && state.gameMode === "draft" && Number(state.userCount || state.users?.length || 0) === 1) return "Solo Challenge";
    if (!online.enabled && state.gameMode === "draft") return "Local Ultimate Draft";

    return "Ultimate 5-a-side Draft";
  }

  function selectedLegendLeagueV66(){
    const direct = cleanTextV66(state?.selectedLegendLeague || state?.league || state?.legendLeague);
    if (direct && direct.toLowerCase() !== "selected league") return direct;

    const labels = state?.leagueSelection?.labels;
    if (Array.isArray(labels)) {
      const label = labels.map(cleanTextV66).find(Boolean);
      if (label && label.toLowerCase() !== "selected league") return label;
    }
    if (labels && typeof labels === "object") {
      const label = Object.values(labels).map(cleanTextV66).find(Boolean);
      if (label && label.toLowerCase() !== "selected league") return label;
    }

    const team = Array.isArray(state?.users?.[0]?.team) ? state.users[0].team : [];
    const fromTeam = team.map(player => cleanTextV66(player?.league)).find(Boolean);
    if (fromTeam && fromTeam.toLowerCase() !== "selected league") return fromTeam;

    return "";
  }

  function ensureLegendLeagueStateV66(){
    if (!state || getPresetV66() !== "leaguelegends") return;
    const league = selectedLegendLeagueV66();
    if (!league) return;

    state.selectedLegendLeague = league;
    state.league = league;
    if (!state.leagueSelection || typeof state.leagueSelection !== "object") {
      state.leagueSelection = { labels: [league] };
    }
    if (!Array.isArray(state.leagueSelection.labels) || !state.leagueSelection.labels.length) {
      state.leagueSelection.labels = [league];
    }
    if (!Array.isArray(state.leagueSelection.keys) || !state.leagueSelection.keys.length) {
      state.leagueSelection.keys = [league.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")];
    }

    const team = Array.isArray(state.users?.[0]?.team) ? state.users[0].team : [];
    team.forEach(player => {
      if (player && !cleanTextV66(player.league)) player.league = league;
    });
  }

  function applyResultLabelsV66(){
    if (!state || !ratingsRevealed) return;
    ensureLegendLeagueStateV66();

    const label = getModeLabelV66();
    const league = selectedLegendLeagueV66();

    const hero = document.querySelector("#resultsPanel .finished-hero");
    if (hero) {
      const eyebrow = hero.querySelector(".eyebrow");
      const intro = hero.querySelector(".muted");
      if (eyebrow) eyebrow.textContent = label;
      if (intro && getPresetV66() === "leaguelegends" && league) {
        intro.textContent = `Ratings are revealed. League: ${league}.`;
      }
    }

    const resultsPanel = document.getElementById("resultsPanel");
    if (resultsPanel) {
      resultsPanel.dataset.gameModeLabel = label;
      if (league) resultsPanel.dataset.selectedLegendLeague = league;
    }
  }

  // Keep Firebase writes explicit without changing Firebase rules or schema.
  const previousEnsureFirebaseV66 = ensureFirebase;
  ensureFirebase = async function(...args){
    ensureLegendLeagueStateV66();
    return await previousEnsureFirebaseV66.apply(this, args);
  };

  const previousSerialiseStateV66 = serialiseState;
  serialiseState = function(...args){
    ensureLegendLeagueStateV66();
    const raw = previousSerialiseStateV66.apply(this, args);
    if (raw && raw.challengePreset === "leaguelegends") {
      const league = selectedLegendLeagueV66();
      if (league) {
        raw.selectedLegendLeague = league;
        raw.league = league;
        raw.leagueSelection = raw.leagueSelection || { labels: [league] };
        raw.leagueSelection.labels = Array.isArray(raw.leagueSelection.labels) && raw.leagueSelection.labels.length ? raw.leagueSelection.labels : [league];
      }
    }
    return raw;
  };

  const previousRenderResultsV66 = renderResults;
  renderResults = function(...args){
    const result = previousRenderResultsV66.apply(this, args);
    applyResultLabelsV66();
    return result;
  };

  if (typeof showFinishedResultsPageV33 === "function") {
    const previousShowFinishedResultsPageV66 = showFinishedResultsPageV33;
    showFinishedResultsPageV33 = function(...args){
      ensureLegendLeagueStateV66();
      const result = previousShowFinishedResultsPageV66.apply(this, args);
      applyResultLabelsV66();
      setTimeout(applyResultLabelsV66, 0);
      setTimeout(applyResultLabelsV66, 80);
      return result;
    };
  }

  const previousRevealScoresV66 = revealScores;
  revealScores = async function(...args){
    ensureLegendLeagueStateV66();
    const result = await previousRevealScoresV66.apply(this, args);
    applyResultLabelsV66();
    return result;
  };

  const previousCreateSummaryCanvasV66 = createSummaryCanvas;
  createSummaryCanvas = function(...args){
    ensureLegendLeagueStateV66();
    const canvas = previousCreateSummaryCanvasV66.apply(this, args);
    try {
      const ctx = canvas.getContext("2d");
      const label = getModeLabelV66();
      const league = selectedLegendLeagueV66();
      const subtitle = getPresetV66() === "leaguelegends" && league ? `${label} - ${league}` : label;

      // Cover the old mode text and redraw the authoritative label in the saved/share image header.
      ctx.save();
      ctx.fillStyle = "rgba(15,23,42,.98)";
      ctx.fillRect(195, 92, 980, 48);
      ctx.font = "850 28px Arial";
      ctx.fillStyle = "#d1fae5";
      ctx.fillText(subtitle, 204, 122);
      ctx.restore();
    } catch (err) {
      console.warn("Could not apply saved image mode label fix", err);
    }
    return canvas;
  };

  const previousSubmitLeaderboardScoreV66 = typeof submitLeaderboardScore === "function" ? submitLeaderboardScore : null;
  if (previousSubmitLeaderboardScoreV66) {
    submitLeaderboardScore = async function(...args){
      ensureLegendLeagueStateV66();
      return await previousSubmitLeaderboardScoreV66.apply(this, args);
    };
  }

  document.addEventListener("click", event => {
    if (event.target?.closest?.("#revealBtn, #saveSummaryBtn, #shareSummaryBtn, #submitLeaderboardBtnStep19")) {
      ensureLegendLeagueStateV66();
      setTimeout(applyResultLabelsV66, 0);
      setTimeout(applyResultLabelsV66, 120);
    }
  }, true);
})();


// --- v75 stable leaderboard + Firebase readiness fix ---
// Replaces the heavy observer/interval leaderboard patches with one lightweight, direct implementation.
(function stableLeaderboardFirebaseFixV75(){
  let firebaseReadyPromiseV75 = null;

  function hasFirebaseDatabaseV75(){
    return typeof window.firebase !== "undefined" && typeof firebase.database === "function";
  }

  // Robust Firebase loader: avoids the intermittent "firebase.database is not a function" error.
  const previousEnsureFirebaseV75 = ensureFirebase;
  ensureFirebase = async function(){
    if (hasFirebaseDatabaseV75() && firebase.apps && firebase.apps.length) {
      online.loaded = true;
      return;
    }
    if (firebaseReadyPromiseV75) return firebaseReadyPromiseV75;

    firebaseReadyPromiseV75 = (async () => {
      if (!firebaseConfigured()) throw new Error("Firebase is not configured.");

      await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
      await loadScriptOnce("https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js");

      if (typeof window.firebase === "undefined") {
        online.loaded = false;
        throw new Error("Firebase app script did not load.");
      }
      if (typeof firebase.database !== "function") {
        online.loaded = false;
        firebaseReadyPromiseV75 = null;
        throw new Error("Firebase database script did not load. Please refresh and try again.");
      }
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      online.loaded = true;
    })();

    return firebaseReadyPromiseV75;
  };

  function elV75(id){ return document.getElementById(id); }

  function isVisibleV75(el){
    return !!el && !el.classList.contains("hidden") && el.style.display !== "none";
  }

  function showV75(el){
    if (!el) return;
    el.classList.remove("hidden");
    el.style.display = "";
    el.removeAttribute("aria-hidden");
  }

  function hideV75(el){
    if (!el) return;
    el.classList.add("hidden");
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  function injectStylesV75(){
    if (document.getElementById("stableLeaderboardStylesV75")) return;
    const style = document.createElement("style");
    style.id = "stableLeaderboardStylesV75";
    style.textContent = `
      #soloLeaderboardSubTabs.leaderboard-subtabs-v55::before,
      .leaderboard-subtabs-v55::before{content:""!important;display:none!important;}
      #soloLeaderboardSubTabs [data-solo-leaderboard-filter],
      #soloLeaderboardSubTabs .solo-sub-tab:not([data-leaderboard-sub]){display:none!important;}
      .leaderboard-subtabs-v55{background:linear-gradient(135deg,#eaf3ff,#f7fbff)!important;border:1.5px solid #93c5fd!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 8px 20px rgba(37,99,235,.08)!important;border-radius:18px!important;}
      #leaderboardList .leaderboard-row-v55 .leaderboard-meta-v55{display:block!important;visibility:visible!important;}
    `;
    document.head.appendChild(style);
  }

  function cleanupSubtabsV75(){
    const holder = elV75("soloLeaderboardSubTabs");
    if (!holder) return;
    holder.classList.add("leaderboard-subtabs-v55");
    holder.querySelectorAll('[data-solo-leaderboard-filter], .solo-sub-tab:not([data-leaderboard-sub])').forEach(btn => btn.remove());

    const seen = new Set();
    Array.from(holder.querySelectorAll('button')).forEach(btn => {
      const key = `${btn.dataset.leaderboardSub || ""}|${(btn.textContent || "").trim().toLowerCase()}`;
      if (seen.has(key)) btn.remove();
      else seen.add(key);
    });
  }

  function hideLeaderboardIfHomeVisibleV75(){
    const entry = elV75("gameEntryPanel");
    const panel = elV75("leaderboardPanel");
    if (isVisibleV75(entry) && isVisibleV75(panel) && !document.body.dataset.openingLeaderboardV75) {
      hideV75(panel);
    }
  }

  function backFromLeaderboardV75(event){
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    const entry = elV75("gameEntryPanel");
    const setup = elV75("setupPanel");
    const game = elV75("gamePanel");
    const results = elV75("resultsPanel");
    const leaderboard = elV75("leaderboardPanel");

    hideV75(leaderboard);

    if (state) {
      hideV75(entry);
      hideV75(setup);
      if (ratingsRevealed) { hideV75(game); showV75(results); }
      else { showV75(game); hideV75(results); }
    } else {
      showV75(entry);
      hideV75(setup);
      hideV75(game);
      hideV75(results);
    }
  }

  function openLeaderboardV75(){
    document.body.dataset.openingLeaderboardV75 = "1";
    setTimeout(() => { delete document.body.dataset.openingLeaderboardV75; }, 500);
    injectStylesV75();
    cleanupSubtabsV75();
  }

  document.addEventListener("click", event => {
    if (event.target?.closest?.("#leaderboardBtn")) {
      openLeaderboardV75();
      setTimeout(cleanupSubtabsV75, 0);
      setTimeout(cleanupSubtabsV75, 100);
      return;
    }
    if (event.target?.closest?.("#leaderboardBackBtn")) {
      backFromLeaderboardV75(event);
      return;
    }
    if (event.target?.closest?.("[data-leaderboard-group], [data-leaderboard-sub]")) {
      cleanupSubtabsV75();
      return;
    }
    setTimeout(hideLeaderboardIfHomeVisibleV75, 0);
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    injectStylesV75();
    cleanupSubtabsV75();
    hideLeaderboardIfHomeVisibleV75();
  });

  injectStylesV75();
})();


// --- v76 panel display-state fix after leaderboard navigation ---
// Root cause: recent leaderboard guards used style.display="none" as well as .hidden.
// Older app navigation only removed .hidden, leaving panels stuck invisible.
(function panelDisplayStateFixV76(){
  const originalShowV76 = show;

  show = function(el, visible){
    if (!el) return;
    el.classList.toggle("hidden", !visible);
    if (visible) {
      el.style.display = "";
      el.removeAttribute("aria-hidden");
    } else {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }
  };

  function fixVisiblePanelDisplayV76(){
    [
      "gameEntryPanel",
      "setupPanel",
      "gamePanel",
      "resultsPanel",
      "leaderboardPanel",
      "onlineLobbyPanel",
      "monthlyChallengesPanel"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.classList.contains("hidden") && el.style.display === "none") {
        el.style.display = "";
        el.removeAttribute("aria-hidden");
      }
    });
  }

  function openLeaderboardCleanlyV76(){
    const panel = document.getElementById("leaderboardPanel");
    if (!panel) return;
    panel.classList.remove("hidden");
    panel.style.display = "";
    panel.removeAttribute("aria-hidden");
  }

  document.addEventListener("click", event => {
    if (event.target?.closest?.("#leaderboardBtn")) {
      // Let the existing v55 leaderboard handler do the actual load, then repair any stale inline display state.
      setTimeout(openLeaderboardCleanlyV76, 0);
      setTimeout(openLeaderboardCleanlyV76, 80);
      setTimeout(fixVisiblePanelDisplayV76, 120);
    }

    if (event.target?.closest?.("#leaderboardBackBtn, #startLocalGameBtn, #createOnlineRoomBtn, #joinOnlineRoomBtn, #startBtn, [data-challenge], .challenge-card-v2")) {
      setTimeout(fixVisiblePanelDisplayV76, 0);
      setTimeout(fixVisiblePanelDisplayV76, 100);
      setTimeout(fixVisiblePanelDisplayV76, 300);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", fixVisiblePanelDisplayV76);
  setTimeout(fixVisiblePanelDisplayV76, 0);
})();


// --- v77 Home button rename and current-mode Restart flow ---
// Adds a dedicated Restart button inside the active game/results cards.
// Home still returns to the front page; Restart returns to the current mode setup/lobby.
(function currentModeRestartV77(){
  function byId(id){ return document.getElementById(id); }
  function setHomeButtonLabelV77(){ const btn = byId("resetBtn"); if (btn) { btn.textContent = "Home"; btn.setAttribute("aria-label", "Go back to home screen"); btn.title = "Go back to the home screen"; } }
  function injectRestartStylesV77(){
    if (byId("restartStylesV77")) return;
    const style = document.createElement("style");
    style.id = "restartStylesV77";
    style.textContent = `.game-card-restart-row-v77{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin:-4px 0 14px}.restart-current-btn-v77{background:linear-gradient(135deg,#0ea5e9,#2563eb)!important;color:#fff!important;border:0!important;min-height:42px;padding:10px 16px!important;border-radius:14px!important;box-shadow:0 10px 24px rgba(37,99,235,.22)!important}.finished-actions .restart-current-btn-v77{background:linear-gradient(135deg,#0ea5e9,#2563eb)!important}@media(max-width:720px){.game-card-restart-row-v77{justify-content:stretch;margin:0 0 12px}.game-card-restart-row-v77 .btn{width:100%}}`;
    document.head.appendChild(style);
  }
  function currentPresetV77(){ return state?.challengePreset || window.challengePreset || "standard"; }
  function clickFirstV77(selectors){ for (const selector of selectors){ const el=document.querySelector(selector); if(el){ el.click(); return true; } } return false; }
  function clearTransientGameUiV77(){ byId("turnLockNote")?.remove(); byId("activeYearRangePillStep5")?.remove(); byId("onlineRoomMiniStep12")?.remove(); document.querySelectorAll(".online-action-banner-step16").forEach(el=>el.remove()); document.body.classList.remove("solo-challenge-active-step8","solo-results-centred-step9","online-game-active-step12","worldcup-challenge-active"); }
  async function restartOnlineGameToLobbyV77(){
    const ref=online?.ref; const roomId=online?.roomId; const isHost=!!online?.isHost; const myName=online?.myName || "";
    if(!ref || !roomId){ resetGame(); return; }
    let participants=[];
    try{ const snap=await ref.child("participants").once("value"); participants=participantNamesFromObject(snap.val()); }
    catch(err){ console.warn("Could not read room participants during restart",err); if(myName) participants=[myName]; }
    state=null; currentCandidate=null; ratingsRevealed=false; applyingRemote=false; clearTransientGameUiV77();
    try{ await ref.update({updatedAt:Date.now(),state:null,currentCandidate:null,ratingsRevealed:false,message:"Game restarted. Back in the lobby."}); }
    catch(err){ console.warn("Could not update room during restart",err); }
    const invite=`${location.origin}${location.pathname}?room=${roomId}`;
    showLobby(isHost ? "host" : "player", participants, invite);
    setHomeButtonLabelV77(); setTimeout(refreshRestartButtonsV77,0);
  }
  function reopenCurrentLocalSetupV77(preset){
    window.challengePreset=preset || "standard";
    if(preset==="leaguelegends" && clickFirstV77(['[data-challenge="leaguelegends"]'])) return;
    if(preset==="league" && clickFirstV77(['[data-challenge="league"]'])) return;
    if(preset==="worldcup2026"){
      const monthly=document.querySelector(".active-monthly-challenge"); if(monthly) monthly.click();
      setTimeout(()=>{ if(!clickFirstV77(["#playWorldCup2026ChallengeBtn"])){ window.challengePreset="standard"; byId("startLocalGameBtn")?.click(); } },80);
      return;
    }
    if((preset==="ultimate" || preset==="easy") && clickFirstV77([`[data-challenge="${preset}"]`])) return;
    window.challengePreset="standard"; byId("startLocalGameBtn")?.click();
  }
  async function restartCurrentModeV77(){ const preset=currentPresetV77(); if(online?.enabled){ await restartOnlineGameToLobbyV77(); return; } clearTransientGameUiV77(); resetGame(); setTimeout(()=>reopenCurrentLocalSetupV77(preset),120); }
  function ensureGameRestartButtonV77(){
    injectRestartStylesV77(); setHomeButtonLabelV77();
    const gamePanel=byId("gamePanel"); const draftCard=document.querySelector("#gamePanel .draft-card");
    if(!gamePanel || !draftCard || gamePanel.classList.contains("hidden") || ratingsRevealed){ byId("restartGameTopRowV77")?.remove(); return; }
    let row=byId("restartGameTopRowV77");
    if(!row){ row=document.createElement("div"); row.id="restartGameTopRowV77"; row.className="game-card-restart-row-v77"; row.innerHTML=`<button id="restartCurrentGameBtnV77" type="button" class="btn restart-current-btn-v77">Restart</button>`; draftCard.insertBefore(row,draftCard.firstChild); }
  }
  function ensureResultsRestartButtonV77(){
    injectRestartStylesV77(); setHomeButtonLabelV77(); const actions=document.querySelector("#resultsPanel .finished-actions"); if(!actions) return;
    const oldNewGame=byId("resetBtnResults");
    if(oldNewGame){ oldNewGame.textContent="Restart"; oldNewGame.classList.add("restart-current-btn-v77"); oldNewGame.setAttribute("aria-label","Restart this game mode"); oldNewGame.title="Restart this game mode"; }
    if(!byId("restartResultsBtnV77") && !oldNewGame){ const btn=document.createElement("button"); btn.id="restartResultsBtnV77"; btn.type="button"; btn.className="btn restart-current-btn-v77"; btn.textContent="Restart"; actions.appendChild(btn); }
  }
  function refreshRestartButtonsV77(){ setHomeButtonLabelV77(); ensureGameRestartButtonV77(); ensureResultsRestartButtonV77(); }
  document.addEventListener("click",event=>{ if(event.target?.closest?.("#restartCurrentGameBtnV77, #restartResultsBtnV77, #resetBtnResults")){ event.preventDefault(); event.stopImmediatePropagation(); safe(restartCurrentModeV77)(); return; } if(event.target?.closest?.("#resetBtn")) setHomeButtonLabelV77(); },true);
  const previousRenderV77=render; render=function(...args){ const result=previousRenderV77.apply(this,args); refreshRestartButtonsV77(); return result; };
  const previousStartNewGameV77=startNewGame; startNewGame=function(...args){ const result=previousStartNewGameV77.apply(this,args); refreshRestartButtonsV77(); return result; };
  const previousApplyRemoteDataV77=applyRemoteData; applyRemoteData=function(...args){ const result=previousApplyRemoteDataV77.apply(this,args); refreshRestartButtonsV77(); return result; };
  if(typeof showFinishedResultsPageV33==="function"){ const previousShowFinishedV77=showFinishedResultsPageV33; showFinishedResultsPageV33=function(...args){ const result=previousShowFinishedV77.apply(this,args); refreshRestartButtonsV77(); return result; }; }
  if(typeof renderResults==="function"){ const previousRenderResultsV77=renderResults; renderResults=function(...args){ const result=previousRenderResultsV77.apply(this,args); refreshRestartButtonsV77(); return result; }; }
  const previousResetGameV77=resetGame; resetGame=function(...args){ const result=previousResetGameV77.apply(this,args); setHomeButtonLabelV77(); byId("restartGameTopRowV77")?.remove(); return result; };
  document.addEventListener("DOMContentLoaded",refreshRestartButtonsV77); setTimeout(refreshRestartButtonsV77,0);
})();

// --- v78 leaderboard team display ---
// Adds the submitted 5-a-side team to every leaderboard row where team data exists.
(function leaderboardTeamDisplayV78(){
  const GROUPS={
    solo:{defaultSub:"all",subs:{all:["Solo Challenge","Ultimate Solo Mode","Easy Solo Challenge","League Challenge"],standard:["Solo Challenge"],ultimate:["Ultimate Solo Mode"],easy:["Easy Solo Challenge"],league:["League Challenge"]}},
    online:{defaultSub:"all",subs:{all:["Online Ultimate Draft","Online Blind Bidding","Online Live Auction"],draft:["Online Ultimate Draft"],blind:["Online Blind Bidding"],live:["Online Live Auction"]}},
    legends:{defaultSub:"all",subs:{all:["League Legends Challenge"]}},
    monthly:{defaultSub:"all",subs:{all:["World Cup 2026 Challenge"],worldcup2026:["World Cup 2026 Challenge"]}}
  };
  let cache=null,cacheAt=0,busy=false,timer=null;
  function byId(id){return document.getElementById(id);} 
  function esc(v){return String(v??"").replace(/[&<>'\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));}
  function mode(e){return String(e?.gameMode||"Unknown").trim()||"Unknown";}
  function injectStyles(){
    if(byId("leaderboardTeamStylesV78"))return;
    const style=document.createElement("style");
    style.id="leaderboardTeamStylesV78";
    style.textContent=`#leaderboardList .leaderboard-row.leaderboard-row-v55.leaderboard-row-has-team-v78{align-items:start!important;row-gap:7px!important}.leaderboard-team-v78{grid-column:2 / span 3;display:grid;gap:6px;margin-top:2px;padding-top:7px;border-top:1px solid rgba(203,213,225,.72)}.leaderboard-team-title-v78{display:flex;align-items:center;gap:6px;color:#334155;font-size:.75rem;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.leaderboard-team-chips-v78{display:flex;flex-wrap:wrap;gap:6px}.leaderboard-player-chip-v78{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:6px 9px;border-radius:999px;background:#eef6ff;border:1px solid #bfdbfe;color:#0f172a;font-size:.76rem;font-weight:850;line-height:1.1}.leaderboard-player-pos-v78{color:#1d4ed8;font-weight:1000}.leaderboard-player-rating-v78{color:#166534;font-weight:1000}.leaderboard-team-unavailable-v78{color:#64748b;font-size:.76rem;font-weight:850}@media(max-width:720px){.leaderboard-team-v78{grid-column:2 / span 2}.leaderboard-team-chips-v78{display:grid;grid-template-columns:1fr;gap:5px}.leaderboard-player-chip-v78{justify-content:space-between;border-radius:12px}}`;
    document.head.appendChild(style);
  }
  function activeGroup(){const a=document.querySelector("#leaderboardPanel [data-leaderboard-group].active");const k=a?.dataset?.leaderboardGroup||"solo";return GROUPS[k]?k:"solo";}
  function activeSub(groupKey){const a=document.querySelector("#leaderboardPanel [data-leaderboard-sub].active");const g=GROUPS[groupKey]||GROUPS.solo;const k=a?.dataset?.leaderboardSub||g.defaultSub||"all";return g.subs[k]?k:g.defaultSub||"all";}
  function allowedModes(){const g=activeGroup();const s=activeSub(g);return new Set(GROUPS[g]?.subs?.[s]||GROUPS.solo.subs.all);}
  async function allEntries(){
    const now=Date.now();
    if(cache&&now-cacheAt<2500)return cache;
    await ensureFirebase();
    const snap=await firebase.database().ref("leaderboard").once("value");
    cache=Object.values(snap.val()||{}).filter(e=>Number.isFinite(Number(e?.score))).map(e=>({...e,username:String(e?.username||"Player").trim()||"Player",score:Number(e?.score||0),gameMode:mode(e),timestamp:Number(e?.timestamp||0)}));
    cacheAt=now;
    return cache;
  }
  function visibleEntries(entries){const allowed=allowedModes();return entries.filter(e=>allowed.has(e.gameMode)).sort((a,b)=>b.score!==a.score?b.score-a.score:Number(b.timestamp||0)-Number(a.timestamp||0)).slice(0,20);}
  function playerName(p){return p?.name||p?.player||p?.Player||"Player";}
  function playerRole(p){return String(p?.selectedRole||p?.position||p?.mainPosition||p?.Main_Position||p?.Position||"").trim().toUpperCase();}
  function playerRating(p){const n=Number(p?.rating??p?.adjustedRating??p?.score??p?.baseRating??p?.Rating_OVR??"");return Number.isFinite(n)&&n?Math.round(n):"";}
  function teamHtml(entry){
    const team=Array.isArray(entry?.team)?entry.team.filter(Boolean).slice(0,5):[];
    if(!team.length)return `<span class="leaderboard-team-unavailable-v78">Team used: not available for this older submission.</span>`;
    const chips=team.map(p=>{const pos=playerRole(p);return `<span class="leaderboard-player-chip-v78">${pos?`<span class="leaderboard-player-pos-v78">${esc(pos)}</span>`:""}<span>${esc(playerName(p))}</span></span>`;}).join("");
    return `<span class="leaderboard-team-title-v78">Team used</span><div class="leaderboard-team-chips-v78">${chips}</div>`;
  }
  async function enhance(){
    if(busy)return;
    const panel=byId("leaderboardPanel"),list=byId("leaderboardList");
    if(!panel||!list||panel.classList.contains("hidden"))return;
    const rows=Array.from(list.querySelectorAll(".leaderboard-row-v55"));
    if(!rows.length)return;
    busy=true;
    try{
      injectStyles();
      const entries=visibleEntries(await allEntries());
      rows.forEach((row,i)=>{const entry=entries[i];if(!entry)return;row.classList.add("leaderboard-row-has-team-v78");const html=teamHtml(entry);let holder=row.querySelector(".leaderboard-team-v78");if(!holder){holder=document.createElement("span");holder.className="leaderboard-team-v78";row.appendChild(holder);}if(holder.dataset.htmlV78!==html){holder.innerHTML=html;holder.dataset.htmlV78=html;}});
    }catch(err){console.warn("Could not add teams to leaderboard rows",err);}finally{busy=false;}
  }
  function schedule(delay=80){if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;enhance();},delay);}
  function observe(){const list=byId("leaderboardList");if(!list||list.dataset.teamObserverV78==="1")return;list.dataset.teamObserverV78="1";new MutationObserver(()=>schedule(80)).observe(list,{childList:true,subtree:false});}
  document.addEventListener("DOMContentLoaded",()=>{injectStyles();observe();schedule(250);});
  document.addEventListener("click",event=>{if(event.target?.closest?.("#leaderboardBtn, [data-leaderboard-group], [data-leaderboard-sub]")){schedule(350);setTimeout(()=>schedule(50),900);}},true);
  injectStyles();observe();schedule(250);
})();

// --- v79 compact leaderboard team chips ---
// Makes the team-used section much smaller and keeps it on the same line where space allows.
(function leaderboardTeamCompactV79(){
  function byId(id){return document.getElementById(id);}
  function injectStylesV79(){
    if(byId("leaderboardTeamCompactStylesV79"))return;
    const style=document.createElement("style");
    style.id="leaderboardTeamCompactStylesV79";
    style.textContent=`
      #leaderboardList .leaderboard-row.leaderboard-row-v55.leaderboard-row-has-team-v78{
        row-gap:3px!important;
        padding-top:10px!important;
        padding-bottom:10px!important;
      }
      #leaderboardList .leaderboard-row-v55 .leaderboard-meta-v55{
        margin-top:0!important;
        font-size:.76rem!important;
        line-height:1.12!important;
      }
      #leaderboardList .leaderboard-team-v78{
        grid-column:2 / span 3!important;
        display:flex!important;
        align-items:center!important;
        flex-wrap:wrap!important;
        gap:4px 6px!important;
        margin-top:1px!important;
        padding-top:0!important;
        border-top:0!important;
        min-width:0!important;
        line-height:1.05!important;
      }
      #leaderboardList .leaderboard-team-title-v78{
        display:inline-flex!important;
        flex:0 0 auto!important;
        color:#475569!important;
        font-size:.66rem!important;
        font-weight:950!important;
        letter-spacing:.02em!important;
        text-transform:none!important;
        margin-right:1px!important;
      }
      #leaderboardList .leaderboard-team-chips-v78{
        display:flex!important;
        align-items:center!important;
        flex-wrap:wrap!important;
        gap:4px!important;
        min-width:0!important;
      }
      #leaderboardList .leaderboard-player-chip-v78{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:4px!important;
        padding:3px 6px!important;
        border-radius:999px!important;
        font-size:.68rem!important;
        font-weight:850!important;
        line-height:1!important;
        white-space:nowrap!important;
        max-width:100%!important;
        box-shadow:none!important;
      }
      #leaderboardList .leaderboard-player-pos-v78,
      #leaderboardList .leaderboard-player-rating-v78{
        font-size:.67rem!important;
        line-height:1!important;
      }
      #leaderboardList .leaderboard-team-unavailable-v78{
        font-size:.68rem!important;
        line-height:1.1!important;
      }
      @media(max-width:720px){
        #leaderboardList .leaderboard-row.leaderboard-row-v55.leaderboard-row-has-team-v78{
          row-gap:3px!important;
          padding:10px 12px!important;
        }
        #leaderboardList .leaderboard-team-v78{
          grid-column:2 / span 2!important;
          gap:3px 5px!important;
        }
        #leaderboardList .leaderboard-team-title-v78{
          font-size:.62rem!important;
        }
        #leaderboardList .leaderboard-team-chips-v78{
          display:flex!important;
          grid-template-columns:none!important;
          flex-wrap:wrap!important;
          gap:3px!important;
        }
        #leaderboardList .leaderboard-player-chip-v78{
          width:auto!important;
          justify-content:flex-start!important;
          border-radius:999px!important;
          padding:3px 5px!important;
          gap:3px!important;
          font-size:.62rem!important;
          max-width:calc(50vw - 34px)!important;
          overflow:hidden!important;
          text-overflow:ellipsis!important;
        }
        #leaderboardList .leaderboard-player-chip-v78 span:nth-child(2){
          overflow:hidden!important;
          text-overflow:ellipsis!important;
        }
        #leaderboardList .leaderboard-player-pos-v78,
        #leaderboardList .leaderboard-player-rating-v78{
          font-size:.61rem!important;
          flex:0 0 auto!important;
        }
      }
      @media(max-width:420px){
        #leaderboardList .leaderboard-player-chip-v78{max-width:100%!important;}
      }
    `;
    document.head.appendChild(style);
  }
  function relabelTeamTitlesV79(){
    document.querySelectorAll("#leaderboardList .leaderboard-team-title-v78").forEach(el=>{
      if(el.textContent.trim().toLowerCase()!=="team:") el.textContent="Team:";
    });
  }
  function scheduleV79(delay=80){setTimeout(()=>{injectStylesV79();relabelTeamTitlesV79();},delay);}
  document.addEventListener("DOMContentLoaded",()=>scheduleV79(100));
  document.addEventListener("click",event=>{
    if(event.target?.closest?.("#leaderboardBtn, [data-leaderboard-group], [data-leaderboard-sub]")){
      scheduleV79(250);
      scheduleV79(700);
    }
  },true);
  const list=byId("leaderboardList");
  if(list){new MutationObserver(()=>scheduleV79(40)).observe(list,{childList:true,subtree:true});}
  injectStylesV79();
  relabelTeamTitlesV79();
})();

// --- v80 mobile leaderboard team polish ---
// Mobile-only refinement: make leaderboard metadata bolder, and make the player team list subtler,
// flatter and more professional instead of chunky chips.
(function leaderboardTeamMobilePolishV80(){
  function byId(id){ return document.getElementById(id); }
  function injectStylesV80(){
    if (byId("leaderboardTeamMobilePolishStylesV80")) return;
    const style = document.createElement("style");
    style.id = "leaderboardTeamMobilePolishStylesV80";
    style.textContent = `
      /* Strengthen the important leaderboard info on all screens. */
      #leaderboardList .leaderboard-row-v55 .leaderboard-rank,
      #leaderboardList .leaderboard-row-v55 .leaderboard-name,
      #leaderboardList .leaderboard-row-v55 .leaderboard-score{
        font-weight:1000!important;
      }
      #leaderboardList .leaderboard-row-v55 .leaderboard-mode,
      #leaderboardList .leaderboard-row-v55 .leaderboard-meta-v55{
        font-weight:950!important;
        color:#64748b!important;
      }
      #leaderboardList .leaderboard-row-v55 .leaderboard-name{
        color:#0f172a!important;
      }
      #leaderboardList .leaderboard-row-v55 .leaderboard-score{
        color:#166534!important;
      }

      /* Keep desktop compact, but make player chips a little less visually heavy. */
      #leaderboardList .leaderboard-player-chip-v78{
        font-weight:780!important;
      }
      #leaderboardList .leaderboard-player-chip-v78 span:nth-child(2){
        color:#334155!important;
      }

      /* Mobile: turn the team into a slim text-style line rather than big pill badges. */
      @media(max-width:720px){
        #leaderboardList .leaderboard-row.leaderboard-row-v55.leaderboard-row-has-team-v78{
          grid-template-columns:42px minmax(0,1fr) auto!important;
          gap:4px 10px!important;
          padding:13px 14px!important;
          border-radius:18px!important;
          align-items:start!important;
        }
        #leaderboardList .leaderboard-row-v55 .leaderboard-rank{
          grid-column:1!important;
          grid-row:1!important;
          font-size:1rem!important;
          line-height:1.05!important;
          color:#1e3a8a!important;
        }
        #leaderboardList .leaderboard-row-v55 .leaderboard-name{
          grid-column:2!important;
          grid-row:1!important;
          font-size:1.04rem!important;
          line-height:1.06!important;
          letter-spacing:-.02em!important;
        }
        #leaderboardList .leaderboard-row-v55 .leaderboard-score{
          grid-column:3!important;
          grid-row:1!important;
          font-size:1.08rem!important;
          line-height:1.05!important;
          text-align:right!important;
          min-width:42px!important;
        }
        #leaderboardList .leaderboard-row-v55 .leaderboard-mode{
          grid-column:2 / span 2!important;
          grid-row:2!important;
          margin-top:4px!important;
          font-size:.84rem!important;
          line-height:1.08!important;
          color:#64748b!important;
          text-align:left!important;
        }
        #leaderboardList .leaderboard-row-v55 .leaderboard-meta-v55{
          grid-column:2 / span 2!important;
          grid-row:3!important;
          margin-top:0!important;
          font-size:.82rem!important;
          line-height:1.08!important;
          color:#64748b!important;
        }
        #leaderboardList .leaderboard-team-v78{
          grid-column:2 / span 2!important;
          grid-row:4!important;
          display:block!important;
          margin-top:2px!important;
          padding-top:0!important;
          border-top:0!important;
          line-height:1.28!important;
        }
        #leaderboardList .leaderboard-team-title-v78{
          display:inline!important;
          margin-right:4px!important;
          color:#475569!important;
          font-size:.74rem!important;
          font-weight:1000!important;
          letter-spacing:.01em!important;
          text-transform:none!important;
        }
        #leaderboardList .leaderboard-team-chips-v78{
          display:inline!important;
        }
        #leaderboardList .leaderboard-player-chip-v78{
          display:inline!important;
          width:auto!important;
          max-width:none!important;
          padding:0!important;
          margin:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          color:#64748b!important;
          font-size:.72rem!important;
          font-weight:680!important;
          line-height:1.28!important;
          white-space:normal!important;
        }
        #leaderboardList .leaderboard-player-chip-v78:not(:last-child)::after{
          content:", ";
          color:#94a3b8;
          font-weight:650;
        }
        #leaderboardList .leaderboard-player-pos-v78{
          color:#2563eb!important;
          font-size:.71rem!important;
          font-weight:850!important;
          margin-right:2px!important;
        }
        #leaderboardList .leaderboard-player-rating-v78{
          color:#64748b!important;
          font-size:.71rem!important;
          font-weight:760!important;
          margin-left:2px!important;
        }
        #leaderboardList .leaderboard-team-unavailable-v78{
          color:#64748b!important;
          font-size:.72rem!important;
          font-weight:700!important;
          line-height:1.2!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function relabelV80(){
    document.querySelectorAll("#leaderboardList .leaderboard-team-title-v78").forEach(el => {
      if (el.textContent.trim().toLowerCase() !== "team:") el.textContent = "Team:";
    });
  }
  function runV80(){ injectStylesV80(); relabelV80(); }
  function scheduleV80(delay=80){ setTimeout(runV80, delay); }

  document.addEventListener("DOMContentLoaded", () => scheduleV80(80));
  document.addEventListener("click", event => {
    if (event.target?.closest?.("#leaderboardBtn, [data-leaderboard-group], [data-leaderboard-sub]")) {
      scheduleV80(250);
      scheduleV80(700);
    }
  }, true);

  const list = byId("leaderboardList");
  if (list) new MutationObserver(() => scheduleV80(40)).observe(list, { childList:true, subtree:true });
  runV80();
})();


// --- v81 read-only average score preview ---
// Purpose: display a read-only average 5-a-side score on setup screens.
// This block does NOT attach capture-phase listeners, prevent default actions, modify slider inputs,
// override setup functions, replace filters, or change any game state. It only reads current filter values.
(function readOnlyAverageScorePreviewV81(){
  const BOX_ID = "readOnlyAverageScorePreviewV81";
  const STYLE_ID = "readOnlyAverageScorePreviewStylesV81";
  const NORMAL_JSON = "players.json";
  const WORLDCUP_JSON = "players_worldcup2026.json";

  let normalPoolCache = null;
  let normalPoolPromise = null;
  let worldCupPoolCache = null;
  let worldCupPoolPromise = null;
  let lastRenderKey = "";

  const byId = id => document.getElementById(id);
  const toNumber = value => Number(value || 0) || 0;
  const activePreset = () => String(window.challengePreset || "standard");
  const setupIsVisible = () => !!(els?.setupPanel && !els.setupPanel.classList.contains("hidden") && !online?.enabled);
  const supportedPreset = () => ["standard", "easy", "league", "worldcup2026", ""].includes(activePreset());
  const playerIdentityKey = player => String(
    player?.playerKey ??
    player?.Original_Player ??
    player?.originalPlayer ??
    player?.original_player ??
    player?.Player ??
    player?.player ??
    player?.Name ??
    player?.name ??
    ""
  ).trim().toLowerCase().replace(/\s+/g, " ");

  function injectReadOnlyStyles(){
    if (byId(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .read-only-average-score-v81{
        margin:12px 0 14px;
        padding:12px 14px;
        border:1px solid #bfdbfe;
        border-radius:16px;
        background:linear-gradient(135deg,#eff6ff,#f8fafc);
        box-shadow:0 10px 22px rgba(37,99,235,.08);
        pointer-events:none;
      }
      .read-only-average-score-v81.hidden{display:none!important;}
      .read-only-average-score-row-v81{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        flex-wrap:nowrap;
      }
      .read-only-average-score-row-v81 + .read-only-average-score-row-v81{
        margin-top:8px;
        padding-top:8px;
        border-top:1px solid rgba(191,219,254,.85);
      }
      .read-only-average-score-title-v81{
        margin:0;
        color:#0f172a;
        font-size:.95rem;
        line-height:1.2;
        font-weight:1000;
      }
      .read-only-average-score-value-v81{
        flex:0 0 auto;
        min-width:54px;
        text-align:center;
        padding:7px 12px;
        border-radius:999px;
        background:linear-gradient(135deg,#2563eb,#1d4ed8);
        color:#fff;
        font-size:1rem;
        font-weight:1000;
        box-shadow:0 8px 18px rgba(37,99,235,.20);
      }
      @media(max-width:620px){
        .read-only-average-score-title-v81{font-size:.9rem;}
        .read-only-average-score-value-v81{font-size:.95rem;padding:7px 10px;}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureAverageBox(){
    injectReadOnlyStyles();
    let box = byId(BOX_ID);
    if (!box){
      box = document.createElement("div");
      box.id = BOX_ID;
      box.className = "read-only-average-score-v81 hidden";
    }

    const setupCard = document.querySelector(".setup-panel-card");
    if (!setupCard) return box;

    const leagueSelector = byId("leagueSelectorV52");
    const yearSlicer = byId("localYearSlicerHolderStep4");
    const soloIntro = byId("soloSetupIntroStep7");

    if (leagueSelector && activePreset() === "league") {
      leagueSelector.insertAdjacentElement("afterend", box);
    } else if (yearSlicer && yearSlicer.parentNode === setupCard && activePreset() !== "worldcup2026") {
      yearSlicer.insertAdjacentElement("afterend", box);
    } else if (soloIntro && soloIntro.parentNode === setupCard) {
      soloIntro.insertAdjacentElement("afterend", box);
    } else if (els?.excludeDeclinesLabel && els.excludeDeclinesLabel.parentNode === setupCard) {
      setupCard.insertBefore(box, els.excludeDeclinesLabel);
    } else if (els?.startBtn && els.startBtn.parentNode === setupCard) {
      setupCard.insertBefore(box, els.startBtn);
    } else {
      setupCard.appendChild(box);
    }

    return box;
  }

  function normalisePositionForAverage(player){
    const main = player?.mainPosition ?? player?.Main_Position ?? player?.MainPosition ?? player?.main_position ?? "";
    const raw = player?.position ?? player?.Position ?? "";
    if (typeof normalisePosition === "function") return normalisePosition(main, raw);

    const text = String(main || raw || "").toUpperCase();
    if (text.includes("GK")) return "GK";
    if (["CB", "LB", "RB", "LWB", "RWB", "DEF"].some(token => text.includes(token))) return "DEF";
    if (["CM", "CDM", "CAM", "LM", "RM", "MID"].some(token => text.includes(token))) return "MID";
    return "FWD";
  }

  function normaliseRowsForAverage(rows, sourceName){
    return (Array.isArray(rows) ? rows : []).map((row, index) => {
      const position = row.Position ?? row.position ?? "";
      const main = row.Main_Position ?? row.mainPosition ?? row.MainPosition ?? row.main_position ?? "";
      const rating = toNumber(row.Rating_OVR ?? row.rating ?? row.Rating);
      return {
        id: `average-${sourceName}-${index + 1}`,
        player: String(row.Player ?? row.player ?? row.Name ?? row.name ?? "").trim(),
        playerKey: playerIdentityKey(row),
        year: toNumber(row.Game_Year ?? row.year ?? row.Year),
        rating,
        position: String(position || main || "").trim(),
        mainPosition: normalisePositionForAverage({ mainPosition: main, position }),
        league: String(row.League ?? row.league ?? row.LEAGUE ?? "Unknown League").trim() || "Unknown League"
      };
    }).filter(player => player.player && player.rating > 0 && ["GK", "DEF", "MID", "FWD"].includes(player.mainPosition));
  }

  async function fetchJsonPool(url, sourceName){
    const response = await fetch(url, { cache:"no-store" });
    if (!response.ok) return [];
    return normaliseRowsForAverage(await response.json(), sourceName);
  }

  async function getNormalPool(){
    if (normalPoolCache) return normalPoolCache;

    const currentPlayers = Array.isArray(players) && players.length ? players : null;
    if (currentPlayers && currentPlayers.some(player => player.league || player.League)) {
      normalPoolCache = currentPlayers.map((player, index) => ({
        id: player.id || `runtime-${index + 1}`,
        player: String(player.player ?? player.Player ?? "").trim(),
        playerKey: playerIdentityKey(player),
        year: toNumber(player.year ?? player.Game_Year),
        rating: toNumber(player.rating ?? player.Rating_OVR ?? player.Rating),
        position: String(player.position ?? player.Position ?? ""),
        mainPosition: normalisePositionForAverage(player),
        league: String(player.league ?? player.League ?? "Unknown League").trim() || "Unknown League"
      })).filter(player => player.player && player.rating > 0 && ["GK", "DEF", "MID", "FWD"].includes(player.mainPosition));
      return normalPoolCache;
    }

    if (normalPoolPromise) return normalPoolPromise;
    normalPoolPromise = fetchJsonPool(NORMAL_JSON, "normal").then(pool => {
      normalPoolCache = pool;
      return normalPoolCache;
    }).catch(err => {
      console.warn("Could not load player pool for average score", err);
      return [];
    });
    return normalPoolPromise;
  }

  async function getWorldCupPool(){
    if (typeof window.getWorldCup2026Players === "function") {
      const existingPool = window.getWorldCup2026Players();
      if (Array.isArray(existingPool) && existingPool.length) {
        return existingPool.map((player, index) => ({
          id: player.id || `wc-runtime-${index + 1}`,
          player: String(player.player ?? player.Player ?? "").trim(),
          playerKey: playerIdentityKey(player),
          year: toNumber(player.year ?? player.Game_Year ?? 2026),
          rating: toNumber(player.rating ?? player.Rating_OVR ?? player.Rating),
          position: String(player.position ?? player.Position ?? ""),
          mainPosition: normalisePositionForAverage(player),
          league: "World Cup 2026"
        })).filter(player => player.player && player.rating > 0 && ["GK", "DEF", "MID", "FWD"].includes(player.mainPosition));
      }
    }

    if (worldCupPoolCache) return worldCupPoolCache;
    if (worldCupPoolPromise) return worldCupPoolPromise;
    worldCupPoolPromise = fetchJsonPool(WORLDCUP_JSON, "worldcup").then(pool => {
      worldCupPoolCache = pool;
      return worldCupPoolCache;
    }).catch(err => {
      console.warn("Could not load World Cup pool for average score", err);
      return [];
    });
    return worldCupPoolPromise;
  }

  function selectedYearRange(pool){
    const years = pool.map(player => player.year).filter(Boolean);
    const min = years.length ? Math.min(...years) : 2005;
    const max = years.length ? Math.max(...years) : 2026;
    let start = toNumber(byId("localYearStartStep4")?.value || min);
    let end = toNumber(byId("localYearEndStep4")?.value || max);
    if (start > end) [start, end] = [end, start];
    return { start, end };
  }

  function standardPool(pool){
    const range = selectedYearRange(pool);
    return pool.filter(player => player.year >= range.start && player.year <= range.end);
  }

  function easyPool(pool){
    const byYearAndPosition = {};
    standardPool(pool).forEach(player => {
      const key = `${player.year}_${player.mainPosition}`;
      (byYearAndPosition[key] ||= []).push(player);
    });

    return Object.entries(byYearAndPosition).flatMap(([key, group]) => {
      const limit = key.endsWith("_MID") ? 10 : 5;
      return group.slice().sort((a, b) => b.rating - a.rating).slice(0, limit);
    });
  }

  function qualifiedLeagueSet(pool){
    const countsByLeague = new Map();
    pool.forEach(player => {
      const counts = countsByLeague.get(player.league) || { GK:0, DEF:0, MID:0, FWD:0 };
      if (counts[player.mainPosition] !== undefined) counts[player.mainPosition] += 1;
      countsByLeague.set(player.league, counts);
    });

    return new Set([...countsByLeague.entries()]
      .filter(([, counts]) => counts.GK >= 5 && counts.DEF >= 5 && counts.MID >= 10 && counts.FWD >= 5)
      .map(([league]) => league));
  }

  function leaguePool(pool){
    const selectedButtons = [...document.querySelectorAll(".league-button-v52.selected")];
    if (!selectedButtons.length) return [];

    const selectedLabels = selectedButtons.map(button => button.textContent.trim());
    const selectedKeys = selectedButtons.map(button => button.dataset.leagueKey || "");
    const includeOther = selectedLabels.includes("All Other Leagues") || selectedKeys.includes("__other__");
    const qualifiedLeagues = qualifiedLeagueSet(pool);

    return pool.filter(player => selectedLabels.includes(player.league) || (includeOther && !qualifiedLeagues.has(player.league)));
  }

  async function activePoolForCurrentSetup(){
    if (activePreset() === "worldcup2026") return await getWorldCupPool();

    const pool = await getNormalPool();
    if (activePreset() === "easy") return easyPool(pool);
    if (activePreset() === "league") return leaguePool(pool);
    return standardPool(pool);
  }

  function dedupeBestYearPerPlayerAndPosition(pool){
    const bestByPlayerAndPosition = new Map();

    pool.forEach(player => {
      const identity = player.playerKey || playerIdentityKey(player);
      if (!identity || !player.mainPosition) return;
      const key = `${identity}|${player.mainPosition}`;
      const existing = bestByPlayerAndPosition.get(key);

      if (!existing || player.rating > existing.rating || (player.rating === existing.rating && player.year > existing.year)) {
        bestByPlayerAndPosition.set(key, player);
      }
    });

    return [...bestByPlayerAndPosition.values()];
  }

  function averageFiveAsideScore(pool){
    const uniquePool = dedupeBestYearPerPlayerAndPosition(pool);
    const groupedRatings = { GK:[], DEF:[], MID:[], FWD:[] };

    uniquePool.forEach(player => {
      if (groupedRatings[player.mainPosition]) groupedRatings[player.mainPosition].push(player.rating);
    });

    const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const gk = average(groupedRatings.GK);
    const def = average(groupedRatings.DEF);
    const mid = average(groupedRatings.MID);
    const fwd = average(groupedRatings.FWD);

    if ([gk, def, mid, fwd].some(value => value === null)) return null;
    return Math.ceil(gk + def + mid + mid + fwd);
  }

  function maximumFiveAsideScore(pool){
    const uniquePool = dedupeBestYearPerPlayerAndPosition(pool);
    const candidatesBySlot = {
      GK: uniquePool.filter(player => player.mainPosition === "GK").sort((a, b) => b.rating - a.rating || b.year - a.year),
      DEF: uniquePool.filter(player => player.mainPosition === "DEF").sort((a, b) => b.rating - a.rating || b.year - a.year),
      MID: uniquePool.filter(player => player.mainPosition === "MID").sort((a, b) => b.rating - a.rating || b.year - a.year),
      FWD: uniquePool.filter(player => player.mainPosition === "FWD").sort((a, b) => b.rating - a.rating || b.year - a.year)
    };

    if (!candidatesBySlot.GK.length || !candidatesBySlot.DEF.length || candidatesBySlot.MID.length < 2 || !candidatesBySlot.FWD.length) return null;

    const slotOrder = ["GK", "DEF", "MID", "MID", "FWD"];
    const candidatesByOrderedSlot = slotOrder.map(slot => candidatesBySlot[slot]);
    const maximumRemainingFromSlot = candidatesByOrderedSlot.map((candidates, index) => {
      return candidatesByOrderedSlot.slice(index).reduce((sum, remainingCandidates) => sum + (remainingCandidates[0]?.rating || 0), 0);
    });

    let bestScore = null;

    function search(slotIndex, usedPlayerKeys, runningScore){
      if (slotIndex === slotOrder.length) {
        if (bestScore === null || runningScore > bestScore) bestScore = runningScore;
        return;
      }

      if (bestScore !== null && runningScore + maximumRemainingFromSlot[slotIndex] <= bestScore) return;

      const candidates = candidatesByOrderedSlot[slotIndex];
      for (const candidate of candidates) {
        const identity = candidate.playerKey || playerIdentityKey(candidate);
        if (!identity || usedPlayerKeys.has(identity)) continue;

        const possibleBest = runningScore + candidate.rating + (maximumRemainingFromSlot[slotIndex + 1] || 0);
        if (bestScore !== null && possibleBest <= bestScore) break;

        usedPlayerKeys.add(identity);
        search(slotIndex + 1, usedPlayerKeys, runningScore + candidate.rating);
        usedPlayerKeys.delete(identity);
      }
    }

    search(0, new Set(), 0);
    return bestScore === null ? null : Math.ceil(bestScore);
  }

  async function renderAverageScore(){
    const box = ensureAverageBox();

    if (!setupIsVisible() || !supportedPreset()) {
      box.classList.add("hidden");
      lastRenderKey = "";
      return;
    }

    const pool = await activePoolForCurrentSetup();
    const averageScore = averageFiveAsideScore(pool);
    const maximumScore = maximumFiveAsideScore(pool);
    const renderKey = `${activePreset()}|${byId("localYearStartStep4")?.value || ""}|${byId("localYearEndStep4")?.value || ""}|${[...document.querySelectorAll(".league-button-v52.selected")].map(button => button.textContent.trim()).join(",")}|${averageScore}|${maximumScore}`;

    if (renderKey === lastRenderKey && !box.classList.contains("hidden")) return;
    lastRenderKey = renderKey;

    box.classList.remove("hidden");
    box.innerHTML = `
      <div class="read-only-average-score-row-v81">
        <p class="read-only-average-score-title-v81">Average 5-a-side score for this setup</p>
        <span class="read-only-average-score-value-v81">${averageScore === null ? "N/A" : averageScore}</span>
      </div>
      <div class="read-only-average-score-row-v81">
        <p class="read-only-average-score-title-v81">Maximum 5-a-side score for this setup</p>
        <span class="read-only-average-score-value-v81">${maximumScore === null ? "N/A" : maximumScore}</span>
      </div>
    `;
  }

  function scheduleAverageRender(delay = 0){
    window.setTimeout(renderAverageScore, delay);
  }

  // Passive listeners only. No capture phase, no preventDefault, no slider/input modification.
  document.addEventListener("input", event => {
    if (event.target?.matches?.("#localYearStartStep4,#localYearEndStep4")) scheduleAverageRender(0);
  });

  document.addEventListener("change", event => {
    if (event.target?.matches?.("#localYearStartStep4,#localYearEndStep4")) scheduleAverageRender(0);
  });

  document.addEventListener("click", event => {
    if (event.target?.closest?.("#startLocalGameBtn,.active-challenge,.active-monthly-challenge,#playWorldCup2026ChallengeBtn,.league-button-v52")) {
      scheduleAverageRender(0);
      scheduleAverageRender(250);
      scheduleAverageRender(700);
    }
  });

  window.setInterval(() => {
    if (setupIsVisible()) renderAverageScore();
  }, 600);

  scheduleAverageRender(400);
})();
