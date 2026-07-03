const TEAM_TEMPLATE = ["GK", "DEF", "MID", "MID", "FWD"];
const DECLINES_ALLOWED = 3;

const samplePlayers = [
  { Player: "Lionel Messi", Game_Year: 2012, Rating_OVR: 94, Position: "CF", Main_Position: "FWD", Club: "FC Barcelona", Nation: "Argentina" },
  { Player: "Cristiano Ronaldo", Game_Year: 2012, Rating_OVR: 92, Position: "LW", Main_Position: "FWD", Club: "Real Madrid", Nation: "Portugal" },
  { Player: "Gianluigi Buffon", Game_Year: 2005, Rating_OVR: 97, Position: "GK", Main_Position: "GK", Club: "Juventus", Nation: "Italy" },
  { Player: "Sergio Ramos", Game_Year: 2015, Rating_OVR: 87, Position: "CB", Main_Position: "DEF", Club: "Real Madrid", Nation: "Spain" },
  { Player: "Xavi", Game_Year: 2012, Rating_OVR: 92, Position: "CM", Main_Position: "MID", Club: "FC Barcelona", Nation: "Spain" },
  { Player: "Thierry Henry", Game_Year: 2005, Rating_OVR: 97, Position: "ST", Main_Position: "FWD", Club: "Arsenal", Nation: "France" }
];

let players = [];
let state = null;
let currentCandidate = null;
let ratingsRevealed = false;

const els = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  resultsPanel: document.getElementById("resultsPanel"),
  userCount: document.getElementById("userCount"),
  excludeDeclines: document.getElementById("excludeDeclines"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  pickBtn: document.getElementById("pickBtn"),
  acceptBtn: document.getElementById("acceptBtn"),
  declineBtn: document.getElementById("declineBtn"),
  revealBtn: document.getElementById("revealBtn"),
  currentUserLabel: document.getElementById("currentUserLabel"),
  declinesLeft: document.getElementById("declinesLeft"),
  candidateCard: document.getElementById("candidateCard"),
  message: document.getElementById("message"),
  teamsContainer: document.getElementById("teamsContainer"),
  resultsContainer: document.getElementById("resultsContainer"),
  playerCount: document.getElementById("playerCount"),
  loadStatus: document.getElementById("loadStatus")
};

async function loadPlayers() {
  try {
    const response = await fetch("players.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    players = normalisePlayers(data);
    els.loadStatus.textContent = `Loaded ${players.length} players from players.json.`;
  } catch (err) {
    players = normalisePlayers(samplePlayers);
    els.loadStatus.textContent = "Using fallback sample players. Run through Live Server/GitHub Pages and replace players.json with full data.";
  }
  els.playerCount.textContent = `${players.length} players loaded`;
}

function normalisePlayers(data) {
  return data.map((p, idx) => ({
    id: idx + 1,
    player: p.Player ?? p.player,
    year: Number(p.Game_Year ?? p.year),
    rating: Number(p.Rating_OVR ?? p.rating),
    position: p.Position ?? p.position,
    mainPosition: p.Main_Position ?? p.mainPosition,
    club: p.Club ?? p.club,
    nation: p.Nation ?? p.nation
  })).filter(p => p.player && p.mainPosition && p.rating);
}

function startGame() {
  const userCount = Number(els.userCount.value);
  ratingsRevealed = false;
  currentCandidate = null;
  state = {
    userCount,
    currentUserIndex: 0,
    excludeDeclines: els.excludeDeclines.checked,
    users: Array.from({ length: userCount }, (_, i) => ({
      name: `User ${i + 1}`,
      team: [],
      declines: 0,
      declinedNames: new Set()
    })),
    acceptedPlayerNames: new Set(),
    history: []
  };
  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.remove("hidden");
  els.resultsPanel.classList.add("hidden");
  els.revealBtn.classList.add("hidden");
  clearCandidate("Click “Pick player” to begin.");
  render();
}

function resetGame() {
  state = null;
  currentCandidate = null;
  ratingsRevealed = false;
  els.setupPanel.classList.remove("hidden");
  els.gamePanel.classList.add("hidden");
  els.resultsPanel.classList.add("hidden");
  els.message.textContent = "";
}

function currentUser() {
  return state.users[state.currentUserIndex];
}

function getNeededPositions(user) {
  const needs = [];
  const count = pos => user.team.filter(p => p.mainPosition === pos).length;
  if (count("GK") < 1) needs.push("GK");
  if (count("DEF") < 1) needs.push("DEF");
  if (count("MID") < 2) needs.push("MID");
  if (count("FWD") < 1) needs.push("FWD");
  return needs;
}

function pickRandomPlayer() {
  if (!state || isGameComplete()) return;
  const user = currentUser();
  const needs = getNeededPositions(user);
  if (needs.length === 0) {
    moveToNextUser();
    return pickRandomPlayer();
  }

  const pool = players.filter(p => {
    if (!needs.includes(p.mainPosition)) return false;
    if (state.acceptedPlayerNames.has(p.player)) return false;
    if (state.excludeDeclines && user.declinedNames.has(p.player)) return false;
    return true;
  });

  if (pool.length === 0) {
    currentCandidate = null;
    clearCandidate("No available player for the positions this user still needs.");
    els.acceptBtn.disabled = true;
    els.declineBtn.disabled = true;
    return;
  }

  currentCandidate = pool[Math.floor(Math.random() * pool.length)];
  renderCandidate(currentCandidate);
  els.acceptBtn.disabled = false;
  els.declineBtn.disabled = user.declines >= DECLINES_ALLOWED;
  els.message.textContent = `${user.name} needs: ${needs.join(", ")}`;
}

function acceptPlayer() {
  if (!currentCandidate || !state) return;
  const user = currentUser();
  if (!getNeededPositions(user).includes(currentCandidate.mainPosition)) {
    els.message.textContent = `${user.name} does not need another ${currentCandidate.mainPosition}.`;
    pickRandomPlayer();
    return;
  }
  if (state.acceptedPlayerNames.has(currentCandidate.player)) {
    els.message.textContent = `${currentCandidate.player} has already been picked.`;
    pickRandomPlayer();
    return;
  }

  user.team.push(currentCandidate);
  state.acceptedPlayerNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "ACCEPT", player: currentCandidate });
  currentCandidate = null;

  if (isGameComplete()) {
    clearCandidate("Draft complete. Reveal ratings to see the winner.");
    els.revealBtn.classList.remove("hidden");
    els.acceptBtn.disabled = true;
    els.declineBtn.disabled = true;
  } else {
    moveToNextUser();
    pickRandomPlayer();
  }
  render();
}

function declinePlayer() {
  if (!currentCandidate || !state) return;
  const user = currentUser();
  if (user.declines >= DECLINES_ALLOWED) {
    els.message.textContent = `${user.name} has no declines left.`;
    els.declineBtn.disabled = true;
    return;
  }
  user.declines += 1;
  user.declinedNames.add(currentCandidate.player);
  state.history.push({ user: user.name, decision: "DECLINE", player: currentCandidate });
  currentCandidate = null;
  pickRandomPlayer();
  render();
}

function moveToNextUser() {
  for (let offset = 1; offset <= state.userCount; offset++) {
    const nextIndex = (state.currentUserIndex + offset) % state.userCount;
    if (getNeededPositions(state.users[nextIndex]).length > 0) {
      state.currentUserIndex = nextIndex;
      return;
    }
  }
}

function isGameComplete() {
  return state.users.every(user => getNeededPositions(user).length === 0);
}

function revealScores() {
  ratingsRevealed = true;
  render();
  renderResults();
  els.resultsPanel.classList.remove("hidden");
  els.revealBtn.classList.add("hidden");
}

function render() {
  if (!state) return;
  const user = currentUser();
  els.currentUserLabel.textContent = user.name;
  els.declinesLeft.textContent = DECLINES_ALLOWED - user.declines;
  renderTeams();
}

function renderCandidate(p) {
  els.candidateCard.classList.remove("blank");
  els.candidateCard.innerHTML = `
    <p class="eyebrow">Random candidate</p>
    <h3 class="player-name">${escapeHtml(p.player)}</h3>
    <div class="badge-row">
      <span class="badge">${p.mainPosition}</span>
      <span class="badge">${p.position}</span>
      <span class="badge">${p.year}</span>
    </div>
    <div class="detail-grid">
      <div class="detail"><span>Club</span>${escapeHtml(p.club)}</div>
      <div class="detail"><span>Nation</span>${escapeHtml(p.nation)}</div>
    </div>
  `;
}

function clearCandidate(text) {
  els.candidateCard.classList.add("blank");
  els.candidateCard.innerHTML = `<p class="muted">${escapeHtml(text)}</p>`;
  els.acceptBtn.disabled = true;
  els.declineBtn.disabled = true;
}

function renderTeams() {
  els.teamsContainer.innerHTML = state.users.map((user, idx) => {
    const slots = buildSlots(user);
    const total = user.team.reduce((sum, p) => sum + p.rating, 0);
    const inactive = idx >= state.userCount ? " inactive" : "";
    return `
      <article class="team-card${inactive}">
        <h3>${user.name}</h3>
        ${slots.map(slot => `
          <div class="slot">
            <div class="slot-label">${slot.label}</div>
            <div>${slot.player ? formatPlayer(slot.player) : "<span class='empty'>Empty</span>"}</div>
          </div>
        `).join("")}
        <div class="score">Declines used: ${user.declines}/${DECLINES_ALLOWED}</div>
        <div class="score">Total: ${ratingsRevealed ? total : "Hidden"}</div>
      </article>
    `;
  }).join("");
}

function buildSlots(user) {
  const mids = user.team.filter(p => p.mainPosition === "MID");
  return [
    { label: "GK", player: user.team.find(p => p.mainPosition === "GK") },
    { label: "DEF", player: user.team.find(p => p.mainPosition === "DEF") },
    { label: "MID", player: mids[0] },
    { label: "MID", player: mids[1] },
    { label: "FWD", player: user.team.find(p => p.mainPosition === "FWD") }
  ];
}

function formatPlayer(p) {
  const rating = ratingsRevealed ? ` <strong>${p.rating}</strong>` : "";
  return `${escapeHtml(p.player)} <span class="muted">(${p.year})</span>${rating}`;
}

function renderResults() {
  const scored = state.users.map(user => ({
    user,
    total: user.team.reduce((sum, p) => sum + p.rating, 0)
  })).sort((a, b) => b.total - a.total);
  const topScore = scored[0]?.total ?? 0;
  els.resultsContainer.innerHTML = scored.map(row => `
    <article class="result-card ${row.total === topScore ? "winner" : ""}">
      <h3>${row.user.name}${row.total === topScore ? " 🏆" : ""}</h3>
      <p class="score">${row.total}</p>
      <p class="muted">${row.user.team.map(p => `${p.player} ${p.rating}`).join(" • ")}</p>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[ch]));
}

els.startBtn.addEventListener("click", startGame);
els.resetBtn.addEventListener("click", resetGame);
els.pickBtn.addEventListener("click", pickRandomPlayer);
els.acceptBtn.addEventListener("click", acceptPlayer);
els.declineBtn.addEventListener("click", declinePlayer);
els.revealBtn.addEventListener("click", revealScores);

loadPlayers();
