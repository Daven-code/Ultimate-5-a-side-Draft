// Ultimate 5-a-side Draft
// app.js v36
// Fixes:
// - Online/local split front screen
// - Online room/lobby flow
// - Online Pick Player issue
// - Firebase state safety issue: Cannot read properties of undefined reading 'map'
// - Safe team arrays, safe declinedNames, safe acceptedPlayerNames

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

function setMessage(text) {
  if (els.message) {
    els.message.textContent = text || "";
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[ch]));
}

function safeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.#$\/[\]]/g, "_");
}

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

async function ensurePlayersReady() {
  await loadPlayers();
  return Array.isArray(players) && players.length > 0;
}

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

function show(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

function hideEntryPanel() {
  show($("gameEntryPanel"), false);
}

function injectEntryPanel() {
  injectStyles();

  if ($("gameEntryPanel")) return;

  const shell = document.querySelector(".app-shell") || document.body;

  const entry = document.createElement("section");
  entry.id = "gameEntryPanel";
  entry.className = "game-entry-panel";

  entry.innerHTML = `
    <div class="game-entry-heading">
      <h2>Choose how to play</h2>
      <p>Start a quick local game, or create/join an online room with friends.</p>
    </div>

    <div class="game-entry-grid">
      <article class="entry-card online-card">
        <h3>Online game</h3>
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

  await saveOnlineState("Online game started.");
}

function serialiseState() {
  if (!state) return null;

  return {
    ...state,
    acceptedPlayerNames: state.acceptedPlayerNames instanceof Set
      ? [...state.acceptedPlayerNames]
      : [],
    users: Array.isArray(state.users)
      ? state.users.map(user => ({
          ...user,
          team: Array.isArray(user.team) ? user.team : [],
          declinedNames: user.declinedNames instanceof Set
            ? [...user.declinedNames]
            : []
        }))
      : []
  };
}

function restoreState(raw) {
  if (!raw) return null;

  const users = Array.isArray(raw.users)
    ? raw.users.map((user, index) => ({
        name: user?.name || `User ${index + 1}`,
        team: Array.isArray(user?.team) ? user.team : [],
        declines: Number(user?.declines || 0),
        declinedNames: new Set(Array.isArray(user?.declinedNames) ? user.declinedNames : []),
        budget: Number(user?.budget ?? AUCTION_BUDGET),
        spent: Number(user?.spent || 0),
        bidSkips: Number(user?.bidSkips || 0)
      }))
    : [];

  const safeIndex = users.length
    ? Math.min(Math.max(Number(raw.currentUserIndex || 0), 0), users.length - 1)
    : 0;

  return {
    ...raw,
    users,
    currentUserIndex: safeIndex,
    acceptedPlayerNames: new Set(Array.isArray(raw.acceptedPlayerNames) ? raw.acceptedPlayerNames : [])
  };
}

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

function applyRemoteData(data) {
  applyingRemote = true;

  state = restoreState(data.state);
  currentCandidate = data.currentCandidate || null;
  ratingsRevealed = !!data.ratingsRevealed;

  hideEntryPanel();

  show(ensureLobby(), false);
  show(els.setupPanel, false);
  show(els.gamePanel, true);
  show(els.resultsPanel, ratingsRevealed);

  updateGameControls();
  render();

  if (currentCandidate) {
    renderCandidate(currentCandidate);
  } else {
    clearCandidate(data.message || "Waiting for the next action...");
  }

  renderTeams();

  if (ratingsRevealed) {
    renderResults();
  }

  setMessage(data.message || "");

  applyingRemote = false;

  applyOnlinePermissions();
}

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

async function startGame() {
  await ensurePlayersReady();

  online.enabled = false;

  startNewGame(selectedGameMode, getLocalUserNames(), false);
}

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

function resetGame() {
  state = null;
  currentCandidate = null;
  ratingsRevealed = false;

  show(ensureLobby(), false);
  show(els.gamePanel, false);
  show(els.resultsPanel, false);

  setMessage("");

  if (online.enabled) {
    hideEntryPanel();
    show(els.setupPanel, false);
    saveOnlineState("Game reset.");

    showLobby(
      online.isHost ? "host" : "player",
      online.myName ? [online.myName] : [],
      `${location.origin}${location.pathname}?room=${online.roomId}`
    );
  } else {
    show(els.setupPanel, false);
    show($("gameEntryPanel"), true);
  }
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

function getNeededPositions(user) {
  if (!user) return [];

  if (!Array.isArray(user.team)) {
    user.team = [];
  }

  const counts = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0
  };

  user.team.filter(Boolean).forEach(player => {
    const pos = player.mainPosition || player.Main_Position || player.position || player.Position;
    const normalised = normalisePosition(pos);

    if (counts[normalised] !== undefined) {
      counts[normalised] += 1;
    }
  });

  const needed = [];

  TEAM_SHAPE.forEach(pos => {
    if (counts[pos] > 0) {
      counts[pos] -= 1;
    } else {
      needed.push(pos);
    }
  });

  return needed;
}

function isGameComplete() {
  return !!state && Array.isArray(state.users) && state.users.every(user => {
    return getNeededPositions(user).length === 0;
  });
}

function currentPlayerCanAct() {
  if (!online.enabled) return true;

  const user = currentUser();

  return online.isHost || (user && safeKey(user.name) === safeKey(online.myName));
}

async function pickRandomPlayer() {
  await ensurePlayersReady();

  if (!state || state.gameMode !== "draft") return;

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
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];

  renderCandidate(currentCandidate);

  setMessage(`${user.name} needs: ${needs.join(", ")}`);

  render();

  await saveOnlineState();

  applyOnlinePermissions();
}

async function acceptPlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();

  if (!user) return;

  if (!Array.isArray(user.team)) {
    user.team = [];
  }

  user.team.push(currentCandidate);
  state.acceptedPlayerNames.add(currentCandidate.player);

  state.history.push({
    user: user.name,
    decision: "ACCEPT",
    player: currentCandidate
  });

  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
  } else {
    moveToNextUser();
    clearCandidate("Click Pick player to continue.");
  }

  render();

  await saveOnlineState();
}

async function declinePlayer() {
  if (!state || !currentCandidate || state.gameMode !== "draft") return;

  if (online.enabled && !currentPlayerCanAct()) {
    applyOnlinePermissions();
    return;
  }

  const user = currentUser();

  if (!user) return;

  if (user.declines >= DECLINES_ALLOWED) {
    setMessage(`${user.name} has no declines left and must accept this player.`);
    return;
  }

  user.declines += 1;

  if (!(user.declinedNames instanceof Set)) {
    user.declinedNames = new Set();
  }

  user.declinedNames.add(currentCandidate.player);

  state.history.push({
    user: user.name,
    decision: "DECLINE",
    player: currentCandidate
  });

  currentCandidate = null;

  clearCandidate("Click Pick player to try another player.");

  render();

  await saveOnlineState();
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

function completeGame() {
  currentCandidate = null;

  clearCandidate("Game complete. Reveal ratings to see the winner.");

  if (els.revealBtn) {
    els.revealBtn.classList.remove("hidden");
  }

  if (els.pickBtn) els.pickBtn.disabled = true;
  if (els.acceptBtn) els.acceptBtn.disabled = true;
  if (els.declineBtn) els.declineBtn.disabled = true;

  saveOnlineState("Game complete. Reveal ratings to see the winner.");
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
      ? online.isHost && user && safeKey(user.name) !== safeKey(online.myName)
        ? `Host control enabled. Current player is ${user.name}.`
        : `It is your turn, ${online.myName}.`
      : `Waiting for ${user?.name || "the current player"}. You joined as ${online.myName}.`;
  }

  if (state.gameMode === "draft") {
    if (els.pickBtn) {
      els.pickBtn.disabled = !canAct || !!currentCandidate || isGameComplete();
    }

    if (els.acceptBtn) {
      els.acceptBtn.disabled = !canAct || !currentCandidate;
    }

    if (els.declineBtn) {
      els.declineBtn.disabled = !canAct || !currentCandidate || currentUser().declines >= DECLINES_ALLOWED;
    }
  }
}

function render() {
  if (!state) return;

  updateGameControls();

  const user = currentUser();

  if (els.currentUserLabel) {
    els.currentUserLabel.textContent = user?.name || "";
  }

  if (state.gameMode === "draft" && els.declinesLeft) {
    els.declinesLeft.textContent = DECLINES_ALLOWED - (user?.declines || 0);
  }

  if (state.gameMode === "bid" && els.currentBudgetLeft) {
    els.currentBudgetLeft.textContent = `£${user?.budget || 0}m`;
  }

  renderTeams();
  applyOnlinePermissions();
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

function buildSlots(user) {
  if (!user || !Array.isArray(user.team)) {
    return [
      { label: "GK", player: null },
      { label: "DEF", player: null },
      { label: "MID", player: null },
      { label: "MID", player: null },
      { label: "FWD", player: null }
    ];
  }

  const mids = user.team.filter(p => p.mainPosition === "MID");

  return [
    { label: "GK", player: user.team.find(p => p.mainPosition === "GK") },
    { label: "DEF", player: user.team.find(p => p.mainPosition === "DEF") },
    { label: "MID", player: mids[0] },
    { label: "MID", player: mids[1] },
    { label: "FWD", player: user.team.find(p => p.mainPosition === "FWD") }
  ];
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

function renderTeams() {
  if (!els.teamsContainer || !state || !Array.isArray(state.users)) return;

  els.teamsContainer.innerHTML = state.users.map(user => {
    if (!Array.isArray(user.team)) {
      user.team = [];
    }

    const total = user.team.reduce((sum, p) => sum + Number(p.rating || 0), 0);
    const needs = getNeededPositions(user);

    return `
      <article class="team-card">
        <div class="team-top-row">
          <div>
            <h3>${escapeHtml(user.name)}</h3>
            <div class="team-meta">${needs.length ? `Needs ${needs.join(", ")}` : "Complete"}</div>
          </div>
          <div class="score">${ratingsRevealed ? total : "Hidden"}</div>
        </div>

        ${renderPitch(buildSlots(user))}

        ${state.gameMode === "draft"
          ? `<div class="score">Declines used: ${user.declines}/${DECLINES_ALLOWED}</div>`
          : ""}
      </article>
    `;
  }).join("");
}

function getFinalScores() {
  if (!state || !Array.isArray(state.users)) return [];

  return state.users
    .map(user => ({
      user,
      total: Array.isArray(user.team)
        ? user.team.reduce((sum, p) => sum + Number(p.rating || 0), 0)
        : 0
    }))
    .sort((a, b) => b.total - a.total);
}

function renderResults() {
  if (!els.resultsContainer || !state) return;

  const scored = getFinalScores();
  const top = scored[0]?.total ?? 0;

  els.resultsContainer.innerHTML = scored.map(row => `
    <article class="result-card ${row.total === top ? "winner" : ""}">
      <h3>${escapeHtml(row.user.name)}${row.total === top ? " 🏆" : ""}</h3>
      <p class="score">${row.total}</p>
      <p class="muted">
        ${Array.isArray(row.user.team)
          ? row.user.team.map(p => `${escapeHtml(p.player)} ${p.rating}`).join(" • ")
          : ""}
      </p>
    </article>
  `).join("");
}

async function revealScores() {
  ratingsRevealed = true;

  show(els.resultsPanel, true);

  if (els.revealBtn) {
    els.revealBtn.classList.add("hidden");
  }

  render();
  renderResults();

  await saveOnlineState("Scores revealed.");
}

// Basic host-assisted bid mode retained.
async function bidRandomPlayer() {
  await ensurePlayersReady();

  if (!state || state.gameMode !== "bid") return;

  const user = currentUser();

  if (!user) return;

  const needs = getNeededPositions(user);

  const pool = players.filter(p => {
    return needs.includes(p.mainPosition) && !state.acceptedPlayerNames.has(p.player);
  });

  if (!pool.length) {
    setMessage(`No available player for ${user.name}.`);
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];

  renderCandidate(currentCandidate);
  renderBidInputs();

  await saveOnlineState();
}

function renderBidInputs() {
  if (!els.bidInputs || !state || !currentCandidate) return;

  els.bidInputs.innerHTML = state.users.map((u, i) => `
    <div class="bid-row">
      <label for="bidUser${i}">
        ${escapeHtml(u.name)}
        <span class="bid-help">Budget left: £${u.budget}m</span>
      </label>
      <input id="bidUser${i}" type="number" min="0" max="${u.budget}" step="1" value="0" />
    </div>
  `).join("");
}

function getBid(index) {
  const input = $(`bidUser${index}`);
  return Number(input?.value || 0);
}

async function awardHighestBid() {
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;

  let best = null;

  state.users.forEach((u, i) => {
    const bid = getBid(i);

    if (bid > 0 && bid <= u.budget && (!best || bid > best.bid)) {
      best = { user: u, index: i, bid };
    }
  });

  if (!best) {
    setMessage("Enter at least one valid bid above £0m.");
    return;
  }

  if (!Array.isArray(best.user.team)) {
    best.user.team = [];
  }

  best.user.team.push({
    ...currentCandidate,
    price: best.bid
  });

  best.user.budget -= best.bid;
  best.user.spent += best.bid;

  state.acceptedPlayerNames.add(currentCandidate.player);

  currentCandidate = null;

  if (isGameComplete()) {
    completeGame();
  } else {
    rotateBidNominator();
  }

  clearCandidate("Click Randomise player to continue.");

  render();

  await saveOnlineState();
}

async function skipBidPlayer() {
  if (!state || state.gameMode !== "bid" || !currentCandidate) return;

  currentCandidate = null;

  rotateBidNominator();

  clearCandidate("Player skipped. Click Randomise player to continue.");

  render();

  await saveOnlineState();
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

function createSummaryCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 700;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "900 42px Arial";
  ctx.fillText("5-a-side Results", 50, 70);

  ctx.font = "700 28px Arial";

  getFinalScores().forEach((row, i) => {
    ctx.fillText(`${i + 1}. ${row.user.name} - ${row.total}`, 60, 140 + i * 50);
  });

  return canvas;
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



// --- v29 targeted local draft fix and safe state overrides ---
// These override earlier functions while preserving the existing visual layout and app structure.
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
  } else {
    moveToNextUser();
    clearCandidate("Click Pick player to continue.");
  }

  render();
  setDraftActionButtons();
  await saveOnlineState();
}

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
    setDraftActionButtons();
    return;
  }

  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;

  clearCandidate("Click Pick player to try another player.");
  render();
  setDraftActionButtons();
  await saveOnlineState();
}

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
  setDraftActionButtons();
  applyOnlinePermissions();
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
          : ""}
      </article>
    `;
  }).join("");
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
    await saveOnlineState();
    return;
  }

  moveToNextUser();
  render();
  setDraftActionButtons();
  await saveOnlineState();

  // Smooth flow: automatically pick the next player for the next user's turn.
  await pickRandomPlayer();
}

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
    setDraftActionButtons();
    return;
  }

  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;

  render();
  setDraftActionButtons();
  await saveOnlineState();

  // Smooth flow: automatically pick another player for the same user's turn.
  await pickRandomPlayer();
}



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

function showFinishedResultsPageV33() {
  if (!state) return;
  injectFinishedStylesV33();
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

async function revealScores() {
  ratingsRevealed = true;
  currentCandidate = null;
  showFinishedResultsPageV33();
  await saveOnlineState("Scores revealed.");
}

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
  else clearCandidate(data.message || "Waiting for the next action...");
  renderTeams();
  setMessage(data.message || "");
  applyingRemote = false;
  applyOnlinePermissions();
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

function init() {
  injectEntryPanel();
  wireEvents();
  updateSetupForMode();
  loadPlayers();
}

init();