
// ============================================================
// Ultimate 5-a-side Draft Game - streamlined app.js
// Rebuilt as one coherent implementation to remove legacy patch-on-patch overrides.
// Keeps the same public features: home, solo modes, league challenge, monthly challenge,
// League Legends, Player Simulation, online draft/bidding, leaderboards, share/save.
// ============================================================

'use strict';

// ---------- Constants ----------
const DECLINES_ALLOWED = 3;
const AUCTION_BUDGET = 100;
const BID_SKIPS_ALLOWED = 3;
const TEAM_SHAPE = ['GK', 'DEF', 'MID', 'MID', 'FWD'];
const OUTFIELD_ROLES = ['DEF', 'MID', 'FWD'];
const GBP = String.fromCharCode(163);

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAcqef5WtEuICYihdza6l_gcad7UUjIjS0',
  authDomain: 'ultimate-5-a-side-draft.firebaseapp.com',
  databaseURL: 'https://ultimate-5-a-side-draft-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'ultimate-5-a-side-draft',
  storageBucket: 'ultimate-5-a-side-draft.firebasestorage.app',
  messagingSenderId: '947937131392',
  appId: '1:947937131392:web:c2a228b6697cf397439f65',
  measurementId: 'G-22516PSZD7'
};

const MODE_LABELS = {
  solo: 'Solo Challenge',
  ultimate: 'Ultimate Solo Mode',
  easy: 'Easy Solo Challenge',
  league: 'League Challenge',
  worldcup: 'World Cup 2026 Challenge',
  leaguelegends: 'League Legends Challenge',
  localDraft: 'Solo Challenge',
  onlineDraft: 'Online Ultimate Draft',
  onlineBlind: 'Online Blind Bidding',
  onlineLive: 'Online Live Auction',
  playerSim: 'Player Simulation'
};

const LEAGUE_OPTIONS = [
  { key: 'premier_league', label: 'Premier League', aliases: ['Premier League', 'Championship'] },
  { key: 'la_liga', label: 'La Liga', aliases: ['La Liga', 'Segunda Division'] },
  { key: 'serie_a', label: 'Serie A', aliases: ['Serie A', 'Serie B'] },
  { key: 'bundesliga', label: 'Bundesliga', aliases: ['Bundesliga', '2. Bundesliga'] },
  { key: 'ligue_1', label: 'Ligue 1', aliases: ['Ligue 1', 'Ligue 2', 'National'] },
  { key: 'primeira_liga', label: 'Primeira Liga', aliases: ['Primeira Liga'] },
  { key: 'other', label: 'All Other Leagues', aliases: [] }
];
const LEAGUE_LEGENDS = ['Premier League', 'La Liga', 'Serie A', 'Ligue 1', 'Bundesliga'];

const SAMPLE_PLAYERS = [
  { Player: 'Lionel Messi', Game_Year: 2012, Rating_OVR: 94, Position: 'CF', Main_Position: 'FWD', Club: 'FC Barcelona', Nation: 'Argentina' },
  { Player: 'Cristiano Ronaldo', Game_Year: 2012, Rating_OVR: 92, Position: 'LW', Main_Position: 'FWD', Club: 'Real Madrid', Nation: 'Portugal' },
  { Player: 'Gianluigi Buffon', Game_Year: 2005, Rating_OVR: 97, Position: 'GK', Main_Position: 'GK', Club: 'Juventus', Nation: 'Italy' },
  { Player: 'Sergio Ramos', Game_Year: 2015, Rating_OVR: 87, Position: 'CB', Main_Position: 'DEF', Club: 'Real Madrid', Nation: 'Spain' },
  { Player: 'Xavi', Game_Year: 2012, Rating_OVR: 92, Position: 'CM', Main_Position: 'MID', Club: 'FC Barcelona', Nation: 'Spain' },
  { Player: 'Kevin De Bruyne', Game_Year: 2021, Rating_OVR: 91, Position: 'CM', Main_Position: 'MID', Club: 'Manchester City', Nation: 'Belgium' },
  { Player: 'Thierry Henry', Game_Year: 2005, Rating_OVR: 97, Position: 'ST', Main_Position: 'FWD', Club: 'Arsenal', Nation: 'France' }
];

const PLAYER_SIM_CLUBS = [
  ['Real Madrid','La Liga',99,99,'elite'],['Barcelona','La Liga',97,94,'elite'],['Manchester City','Premier League',98,99,'elite'],['Arsenal','Premier League',97,92,'elite'],['Liverpool','Premier League',96,91,'elite'],['Bayern Munich','Bundesliga',97,92,'elite'],['Paris Saint-Germain','Ligue 1',96,98,'elite'],['Inter','Serie A',94,82,'elite'],
  ['Chelsea','Premier League',94,94,'elite'],['Manchester United','Premier League',89,97,'top'],['Newcastle United','Premier League',88,92,'top'],['Tottenham Hotspur','Premier League',86,86,'top'],['Aston Villa','Premier League',85,82,'top'],['Brighton','Premier League',82,70,'upper'],['Bournemouth','Premier League',81,66,'upper'],['Brentford','Premier League',80,66,'upper'],['West Ham United','Championship',76,75,'upper'],['Crystal Palace','Premier League',79,68,'upper'],['Fulham','Premier League',78,66,'upper'],['Everton','Premier League',78,67,'upper'],['Nottingham Forest','Premier League',78,68,'upper'],['Wolves','Championship',74,62,'mid'],['Leeds United','Premier League',76,58,'upper'],['Burnley','Championship',72,52,'mid'],['Sunderland','Premier League',72,50,'mid'],['Ipswich Town','Premier League',72,50,'mid'],['Hull City','Premier League',72,50,'mid'],['Leicester City','League One',65,45,'lower'],['Southampton','Championship',70,50,'mid'],['Middlesbrough','Championship',67,38,'lower'],['Sheffield United','Championship',67,42,'lower'],['Norwich City','Championship',66,39,'lower'],['West Bromwich Albion','Championship',66,39,'lower'],['Coventry City','Premier League',72,45,'mid'],['Blackburn Rovers','Championship',64,34,'lower'],['Stoke City','Championship',64,36,'lower'],['Derby County','Championship',62,33,'lower'],
  ['Atletico Madrid','La Liga',91,80,'top'],['Athletic Club','La Liga',84,62,'top'],['Villarreal','La Liga',83,60,'upper'],['Real Betis','La Liga',82,60,'upper'],['Real Sociedad','La Liga',82,61,'upper'],['Sevilla','La Liga',80,62,'upper'],['Valencia','La Liga',78,56,'upper'],['Girona','La Liga',78,55,'upper'],['Celta Vigo','La Liga',74,47,'mid'],['Osasuna','La Liga',73,44,'mid'],['Getafe','La Liga',72,42,'mid'],['Rayo Vallecano','La Liga',71,40,'mid'],['Espanyol','La Liga',70,43,'mid'],['Mallorca','La Liga',70,42,'mid'],['Real Zaragoza','Segunda Division',64,34,'lower'],['Deportivo La Coruna','Segunda Division',63,33,'lower'],['Malaga','Segunda Division',62,32,'lower'],
  ['Juventus','Serie A',90,82,'top'],['AC Milan','Serie A',89,80,'top'],['Napoli','Serie A',87,73,'top'],['Atalanta','Serie A',85,66,'top'],['Roma','Serie A',84,68,'top'],['Lazio','Serie A',82,62,'upper'],['Bologna','Serie A',80,52,'upper'],['Fiorentina','Serie A',79,55,'upper'],['Torino','Serie A',75,46,'mid'],['Genoa','Serie A',72,42,'mid'],['Udinese','Serie A',71,40,'mid'],['Sassuolo','Serie A',70,39,'mid'],['Parma','Serie A',69,39,'mid'],['Cagliari','Serie A',68,36,'mid'],['Palermo','Serie B',64,32,'lower'],['Sampdoria','Serie B',63,31,'lower'],
  ['Borussia Dortmund','Bundesliga',89,76,'top'],['Bayer Leverkusen','Bundesliga',88,74,'top'],['RB Leipzig','Bundesliga',86,76,'top'],['Eintracht Frankfurt','Bundesliga',83,62,'upper'],['Stuttgart','Bundesliga',82,56,'upper'],['Wolfsburg','Bundesliga',77,58,'upper'],['Freiburg','Bundesliga',76,50,'mid'],['Borussia Monchengladbach','Bundesliga',75,52,'mid'],['Werder Bremen','Bundesliga',74,48,'mid'],['Mainz','Bundesliga',73,44,'mid'],['Hoffenheim','Bundesliga',72,48,'mid'],['Union Berlin','Bundesliga',72,43,'mid'],['Augsburg','Bundesliga',71,42,'mid'],['FC Koln','Bundesliga',70,43,'mid'],['Hamburg','Bundesliga',70,42,'mid'],['Schalke','2. Bundesliga',65,38,'lower'],['Hertha Berlin','2. Bundesliga',65,37,'lower'],['Fortuna Dusseldorf','2. Bundesliga',64,34,'lower'],
  ['Monaco','Ligue 1',85,74,'top'],['Marseille','Ligue 1',82,66,'upper'],['Lyon','Ligue 1',80,64,'upper'],['Lille','Ligue 1',79,56,'upper'],['Nice','Ligue 1',78,55,'upper'],['Lens','Ligue 1',78,52,'upper'],['Rennes','Ligue 1',76,51,'mid'],['Strasbourg','Ligue 1',74,48,'mid'],['Nantes','Ligue 1',71,40,'mid'],['Toulouse','Ligue 1',70,39,'mid'],['Montpellier','Ligue 1',68,36,'lower'],['Auxerre','Ligue 1',68,35,'lower'],['Saint-Etienne','Ligue 2',65,33,'lower'],['Bordeaux','National',61,30,'lower'],
  ['Benfica','Primeira Liga',86,74,'top'],['Sporting CP','Primeira Liga',85,72,'top'],['FC Porto','Primeira Liga',84,70,'top'],['Braga','Primeira Liga',78,52,'upper'],['Vitoria Guimaraes','Primeira Liga',72,40,'mid'],['Galatasaray','Super Lig',80,66,'upper'],['Fenerbahce','Super Lig',80,68,'upper'],['Besiktas','Super Lig',76,58,'mid'],['Trabzonspor','Super Lig',74,52,'mid'],['Al Hilal','Saudi Pro League',86,99,'top'],['Al Nassr','Saudi Pro League',84,97,'top'],['Al Ittihad','Saudi Pro League',82,94,'upper'],['Al Ahli','Saudi Pro League',82,94,'upper'],['Al Qadsiah','Saudi Pro League',76,88,'mid']
].map(r => ({ name:r[0], league:r[1], level:r[2], wealth:r[3], band:r[4] }));

const FIRST_NAMES = 'Alex Leo Jamie Nico Theo Marco Daniel Kai Rafael Luca Elliot Sam Mason Noah Andre Felix Hugo Mateo Enzo Oscar Max Jude Ruben Bruno Luis Diego Pablo Carlos Miguel Sergio Javier Eduardo Ivan Luka Milan Stefan Tomas Viktor Erik Elias Adam Ryan Dylan Connor Liam Owen Callum Archie Toby Finn Harvey Leon Roman Kian Zane Ezra Isaac Jonah Nathan Aaron Joel Reece Blake Ellis Fraser Cameron Finley Sonny Rocco Milo Lorenzo Alessandro Giovanni Federico Fabio Dario Paolo Roberto Gabriel Thiago Matheus Julien Antoine Olivier Maxime Karim Idris Youssef Amir Omar Ibrahim Musa Tariq Jamal Malik Kenji Daichi Ren Haruto Kaito Min Joon Jiho'.split(' ');
const LAST_NAMES = 'Mercer Hart Vale Sterling Archer Silva Stone Bennett Costa Hayes Cruz Rivers Blake King Marin Ward Santos Pereira Oliveira Almeida Ferreira Carvalho Gomes Martins Rodrigues Fernandes Rossi Bianchi Romano Conti Ricci Marino Greco Bruno Moretti Esposito Russo Ferrari Muller Schmidt Schneider Fischer Weber Wagner Becker Hoffmann Schulz Meyer Klein Wolf Dubois Laurent Moreau Simon Lefevre Michel Garcia Martin Bernard Thomas Robert Richard Petit Durand Leroy Davies Williams Wilson Taylor Hughes Edwards Evans Roberts Walker Thompson White Hall Wood Green Clarke Cooper Wright Khan Ahmed Ali Hussain Patel Singh Gallagher OBrien Murphy Kelly Walsh Byrne Doyle Ryan Nakamura Tanaka Sato Suzuki Watanabe Kim Park Lee Choi Nguyen Tran Pham Rodriguez Hernandez Lopez Gonzalez Perez Sanchez Ramirez Torres Flores'.split(' ');

// ---------- Global state ----------
let players = [];
let playersPromise = null;
let legends = [];
let legendsPromise = null;
let worldCupPlayers = [];
let worldCupPromise = null;
let selectedPreset = 'solo';
let selectedGameMode = 'draft';
let selectedYearRange = null;
let selectedLeagueKeys = new Set(['premier_league']);
let selectedLegendLeague = 'Premier League';
let state = null;
let currentCandidate = null;
let ratingsRevealed = false;
let applyingRemote = false;
let playerSim = null;
let playerSimSubmitted = false;
let playerSimNameWasTyped = false;
let playerSimSavedManualName = '';
let playerSimUseSavedManualName = false;

const online = { enabled:false, isHost:false, roomId:null, ref:null, myName:'', loaded:false, subscribed:false, bidMode:'blind' };
let modeBackTarget = '';
let firebaseReadyPromise = null;

// ---------- DOM helpers ----------
const $ = id => document.getElementById(id);
const els = {
  setupPanel: $('setupPanel'), gamePanel: $('gamePanel'), resultsPanel: $('resultsPanel'),
  leaderboardPanel: $('leaderboardPanel'), leaderboardBtn: $('leaderboardBtn'), leaderboardBackBtn: $('leaderboardBackBtn'),
  gameModeCards: $('gameModeCards'), gameModeDescription: $('gameModeDescription'), userCount: $('userCount'),
  userNameFields: $('userNameFields'), excludeDeclines: $('excludeDeclines'), excludeDeclinesLabel: $('excludeDeclinesLabel'),
  startBtn: $('startBtn'), resetBtn: $('resetBtn'), pickBtn: $('pickBtn'), acceptBtn: $('acceptBtn'), declineBtn: $('declineBtn'), revealBtn: $('revealBtn'),
  shareSummaryBtn: $('shareSummaryBtn'), saveSummaryBtn: $('saveSummaryBtn'), draftControls: $('draftControls'), bidControls: $('bidControls'),
  bidPickBtn: $('bidPickBtn'), awardBidBtn: $('awardBidBtn'), skipBidBtn: $('skipBidBtn'), bidInputs: $('bidInputs'), bidOrderDisplay: $('bidOrderDisplay'),
  turnEyebrow: $('turnEyebrow'), currentUserLabel: $('currentUserLabel'), declinesPill: $('declinesPill'), declinesLeft: $('declinesLeft'),
  budgetPill: $('budgetPill'), currentBudgetLeft: $('currentBudgetLeft'), candidateCard: $('candidateCard'), message: $('message'),
  teamsContainer: $('teamsContainer'), resultsContainer: $('resultsContainer'), loadStatus: $('loadStatus')
};

function esc(value){ return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function show(el, visible){ if (el) el.classList.toggle('hidden', !visible); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function rnd(a,b){ return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr){ return arr.slice().sort(() => Math.random() - 0.5); }
function money(v){ return GBP + Math.max(0, Math.round(Number(v) || 0)) + 'm'; }
function safeKey(value){ return String(value || '').trim().toLowerCase().replace(/[.#$/\[\]]/g, '_'); }
function setMessage(text){ if (els.message) els.message.textContent = text || ''; }
function safe(fn){ return async function(...args){ try { await fn.apply(this,args); } catch(e){ console.error(e); setMessage(e.message || String(e)); } }; }
function asSet(value){ return value instanceof Set ? value : new Set(Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.values(value) : [])); }
function firebaseList(value){
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}


function normalisePosition(pos, raw=''){
  const p = String(pos || raw || '').toUpperCase();
  if (p.includes('GK')) return 'GK';
  if (['CB','LB','RB','LWB','RWB','DEF','SW'].some(x => p.includes(x))) return 'DEF';
  if (['CM','CDM','CAM','DM','AM','LM','RM','MID'].some(x => p.includes(x))) return 'MID';
  return 'FWD';
}
function roleLabel(pos){ return pos === 'FWD' ? 'ST' : pos; }
function roleFromLabel(pos){ return pos === 'ST' ? 'FWD' : pos; }
function playerKey(p){ return String(p?.player || p?.Player || '').trim().toLowerCase().replace(/\s+/g,' '); }
function normalisePlayers(data){
  return (Array.isArray(data) ? data : []).map((p, idx) => {
    const position = p.Position ?? p.position ?? p.POS ?? p.pos ?? '';
    const main = p.Main_Position ?? p.MainPosition ?? p.mainPosition ?? p.main_position ?? '';
    return {
      id: p.id ?? idx + 1,
      player: String(p.Player ?? p.player ?? p.Name ?? p.name ?? '').trim(),
      year: Number(p.Game_Year ?? p.year ?? p.Year ?? p.gameYear ?? 0),
      rating: Number(p.Rating_OVR ?? p.rating ?? p.OVR ?? p.ovr ?? p.Rating ?? 0),
      position: String(position || main || '').trim(),
      mainPosition: normalisePosition(main, position),
      club: String(p.Club ?? p.club ?? '').trim(),
      nation: String(p.Nation ?? p.nation ?? '').trim(),
      league: String(p.League ?? p.league ?? '').trim()
    };
  }).filter(p => p.player && p.rating > 0 && TEAM_SHAPE.includes(p.mainPosition));
}

// ---------- Data loading ----------
async function fetchJson(path){
  const res = await fetch(path, { cache:'no-store' });
  if (!res.ok) throw new Error('Could not load ' + path + ' - HTTP ' + res.status);
  return await res.json();
}
async function loadPlayers(){
  if (playersPromise) return playersPromise;
  playersPromise = (async () => {
    try {
      players = normalisePlayers(await fetchJson('players.json'));
      if (!players.length) throw new Error('players.json contained no valid players.');
      if (els.loadStatus) els.loadStatus.style.display = 'none';
    } catch(e) {
      console.warn(e);
      players = normalisePlayers(SAMPLE_PLAYERS);
      if (els.loadStatus) { els.loadStatus.textContent = 'Using fallback sample players. Check players.json if this appears online.'; els.loadStatus.style.display = 'block'; }
    }
    return players;
  })();
  return playersPromise;
}
async function loadLegends(){
  if (legendsPromise) return legendsPromise;
  legendsPromise = (async () => {
    const raw = await fetchJson('league_players.json');
    legends = (Array.isArray(raw) ? raw : []).map((p, idx) => {
      const position = String(p.Position || p.position || '').trim();
      const main = String(p.Main_Position || p.MainPosition || p.mainPosition || normalisePosition(position)).toUpperCase();
      const mult = p.Position_Multipliers || p.positionMultipliers || {};
      const rating = Number(p.Rating_OVR ?? p.rating ?? 0);
      return {
        id:'legend-' + (idx + 1), player:String(p.Player || p.player || '').trim(), year:0,
        rank:Number(p.Rank || p.rank || 0), rating, baseRating:rating, position, mainPosition:main,
        naturalMainPosition:main, naturalPosition:position, club:String(p.Club || p.club || '').trim(),
        nation:String(p.Nation || p.nation || '').trim(), league:String(p.League || p.league || '').trim(),
        multipliers:{ DEF:Number(mult.DEF ?? 0.75), MID:Number(mult.MID ?? 0.75), FWD:Number(mult.FWD ?? mult.ST ?? 0.75), ST:Number(mult.ST ?? mult.FWD ?? 0.75) }
      };
    }).filter(p => p.player && p.rating > 0 && LEAGUE_LEGENDS.includes(p.league));
    return legends;
  })();
  return legendsPromise;
}
async function loadWorldCupPlayers(){
  if (worldCupPromise) return worldCupPromise;
  worldCupPromise = (async () => {
    try { worldCupPlayers = normalisePlayers(await fetchJson('players_worldcup2026.json')); }
    catch(e){ console.warn(e); worldCupPlayers = []; }
    return worldCupPlayers;
  })();
  return worldCupPromise;
}
async function ensurePlayersReady(){ await loadPlayers(); return players.length > 0; }

// ---------- Firebase and online room helpers ----------
function loadScriptOnce(src){
  return new Promise((resolve,reject) => {
    if ([...document.scripts].some(s => s.src === src)) { resolve(); return; }
    const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src)); document.head.appendChild(s);
  });
}
async function ensureFirebase(){
  if (online.loaded) return;
  if (firebaseReadyPromise) return firebaseReadyPromise;
  firebaseReadyPromise = (async () => {
    await loadScriptOnce('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    await loadScriptOnce('https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js');
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    online.loaded = true;
  })();
  try { await firebaseReadyPromise; }
  catch(error) { firebaseReadyPromise = null; throw error; }
}
function randomRoomId(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }
function validateUsername(name){ return /^[a-zA-Z0-9 _-]{3,18}$/.test(String(name || '').trim()); }
function serialiseState(){
  if (!state) return null;
  return {
    ...state,
    acceptedPlayerNames:[...asSet(state.acceptedPlayerNames)],
    users:(state.users || []).map(u => ({ ...u, declinedNames:[...asSet(u.declinedNames)] }))
  };
}
function restoreState(raw){
  if (!raw) return null;
  const users = firebaseList(raw.users).map((u, idx) => ({
    name: String(u?.name || ('Player ' + (idx + 1))),
    team: firebaseList(u?.team),
    declines: Number(u?.declines || 0),
    declinedNames: new Set(firebaseList(u?.declinedNames)),
    budget: Number(u?.budget ?? AUCTION_BUDGET),
    spent: Number(u?.spent || 0),
    bidSkips: Number(u?.bidSkips || 0)
  }));
  const currentUserIndex = clamp(Number(raw.currentUserIndex || 0), 0, Math.max(0, users.length - 1));
  return {
    ...raw,
    currentUserIndex,
    userCount: Number(raw.userCount || users.length),
    acceptedPlayerNames:new Set(firebaseList(raw.acceptedPlayerNames)),
    users
  };
}

async function saveOnlineState(message=null){
  if (!online.enabled || !online.ref || applyingRemote) return;
  await online.ref.update({ updatedAt:Date.now(), state:serialiseState(), currentCandidate, ratingsRevealed, message:message ?? els.message?.textContent ?? '' });
}
async function createOnlineRoom(){
  const name = $('onlineRoomName')?.value.trim();
  if (!validateUsername(name)) throw new Error('Enter a name between 3 and 18 characters.');
  await ensurePlayersReady(); await ensureFirebase();
  online.enabled = true; online.isHost = true; online.myName = name; online.roomId = randomRoomId(); online.subscribed = false; online.bidMode = 'blind';
  online.ref = firebase.database().ref('rooms/' + online.roomId);
  const invite = location.origin + location.pathname + '?room=' + online.roomId;
  await online.ref.set({ createdAt:Date.now(), participants:{ [safeKey(name)]:name }, state:null, currentCandidate:null, ratingsRevealed:false, message:'Room created. Waiting for players.' });
  subscribeToRoom(); showLobby('host', [name], invite);
}
async function joinOnlineRoom(code){
  const name = $('onlineRoomName')?.value.trim();
  if (!validateUsername(name)) throw new Error('Enter a name between 3 and 18 characters.');
  if (!code) throw new Error('Enter a room code first.');
  await ensurePlayersReady(); await ensureFirebase();
  online.enabled = true; online.isHost = false; online.myName = name; online.roomId = code.trim().toUpperCase(); online.subscribed = false;
  online.ref = firebase.database().ref('rooms/' + online.roomId);
  await online.ref.child('participants/' + safeKey(name)).set(name);
  subscribeToRoom(); showLobby('player', [name], '');
}
function subscribeToRoom(){
  if (!online.ref || online.subscribed) return;
  online.subscribed = true;
  online.ref.on('value', snap => {
    if (applyingRemote) return;
    const data = snap.val(); if (!data) return;
    const names = Object.values(data.participants || {});
    if (!data.state) { showLobby(online.isHost ? 'host':'player', names, location.origin + location.pathname + '?room=' + online.roomId); return; }
    applyRemoteData(data);
  });
}
function applyRemoteData(data){
  applyingRemote = true;
  state = restoreState(data.state); currentCandidate = data.currentCandidate || null; ratingsRevealed = !!data.ratingsRevealed;
  hideAllPanels(); show(els.gamePanel, !ratingsRevealed); show(els.resultsPanel, ratingsRevealed);
  if (ratingsRevealed) showFinishedResults(); else { renderGame(); currentCandidate ? renderCandidate(currentCandidate) : clearCandidate(data.message || 'Waiting for the next action...'); setMessage(data.message || ''); }
  applyingRemote = false; applyOnlinePermissions();
}

// ---------- Styles ----------
function injectStyles(){
  if ($('streamlinedAppStyles')) return;
  const style = document.createElement('style');
  style.id = 'streamlinedAppStyles';
  style.textContent = `
    .u5-panel{max-width:1040px;margin:28px auto 56px}.u5-card{background:rgba(255,255,255,.96);border-radius:28px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.38)}
    .game-entry-panel{max-width:980px;margin:28px auto}.game-entry-panel#gameEntryPanel{margin-bottom:-18px}.game-entry-heading{text-align:center;color:#fff;margin-bottom:18px}.game-entry-heading h2{font-size:clamp(1.9rem,4vw,2.8rem);margin:0 0 8px}.game-entry-heading p{margin:0;color:#dbeafe;font-weight:900}
    .game-entry-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.entry-card{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(219,234,254,.98),rgba(191,219,254,.88));border:1px solid rgba(147,197,253,.70);border-radius:24px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.24)}.entry-card h3{margin:0 0 10px}.entry-card p{font-weight:750;color:#24364d}.online-room-box{background:rgba(255,255,255,.72);border:1px solid rgba(147,197,253,.46);border-radius:18px;padding:14px;display:grid;gap:10px}.online-room-actions{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.online-room-status{font-weight:850;color:#1e3a8a;margin:0}.online-room-link{background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:10px;color:#1e3a8a;font-weight:900;overflow-wrap:anywhere}
    .mode-hero{max-width:1040px;margin:34px auto 18px;padding:26px;border-radius:28px;background:linear-gradient(115deg,#fff,#f8fafc 62%,#dcfce7);display:grid;grid-template-columns:1fr 330px;gap:20px;align-items:center}.mode-hero h2{font-size:clamp(2.4rem,5vw,4rem);line-height:.95;letter-spacing:-.06em;margin:8px 0 10px}.mode-hero p{color:#475569;font-weight:850}.mode-pills{display:flex;gap:8px;flex-wrap:wrap}.mode-pills span{border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:999px;padding:8px 12px;font-weight:950}.mini-pitch-clean,.pitch{position:relative;border-radius:22px;overflow:hidden;background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 34px,transparent 34px 68px),linear-gradient(180deg,#16a34a,#166534);border:3px solid rgba(255,255,255,.75);box-shadow:inset 0 0 0 2px rgba(255,255,255,.16),0 18px 34px rgba(22,101,52,.20)}.mini-pitch-clean{height:230px}.pitch:before,.mini-pitch-clean:before{content:"";position:absolute;left:0;right:0;top:50%;border-top:2px solid rgba(255,255,255,.72)}.pitch:after,.mini-pitch-clean:after{content:"";position:absolute;width:92px;height:92px;border:2px solid rgba(255,255,255,.72);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}.mini-pos{position:absolute;transform:translate(-50%,-50%);background:#fff;color:#0f172a;border-radius:999px;padding:8px 12px;font-weight:1000;font-size:.78rem;z-index:2}.mini-pos.gk{left:50%;top:88%}.mini-pos.def{left:50%;top:68%}.mini-pos.mid1{left:32%;top:50%}.mini-pos.mid2{left:68%;top:50%}.mini-pos.fwd{left:50%;top:17%}
    .popular-challenges-v2{margin:30px 0 24px;text-align:center}.challenge-grid-v2{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.challenge-card-v2{border:1px solid rgba(147,197,253,.16)!important;border-radius:20px;padding:18px;text-align:left;background:rgba(255,255,255,.09)!important;color:#fff;min-height:176px;display:flex;flex-direction:column;gap:8px;cursor:pointer}.challenge-card-v2:hover{transform:translateY(-3px);background:rgba(59,130,246,.25)!important}.challenge-badge{display:inline-flex;width:fit-content;padding:4px 8px;border-radius:999px;background:#16a34a;color:#fff;font-size:.72rem;font-weight:1000}.challenge-badge.new{background:#f59e0b;color:#111827}.challenge-action{margin-top:auto;color:#bfdbfe;font-weight:950}.u5-hero-card{max-width:1040px;margin:22px auto;padding:26px;border-radius:28px;color:#fff;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;border:1px solid rgba(147,197,253,.32);box-shadow:0 24px 68px rgba(15,23,42,.30)}.u5-hero-blue{background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(30,64,175,.66))}.u5-hero-green{background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(22,101,52,.66))}.u5-hero-card h3{font-size:clamp(1.8rem,3vw,2.65rem);margin:8px 0 10px;line-height:.98;letter-spacing:-.05em}.u5-line{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.u5-new{display:inline-flex;border-radius:999px;padding:5px 10px;background:#f59e0b;color:#111827;font-weight:1000;font-size:.72rem}.u5-new.green{background:#22c55e;color:#052e16}
        .home-latest-video{width:min(560px,calc(100% - 24px));margin:34px auto 30px;text-align:center}.home-latest-video h3{margin:0 0 18px;color:#fff;font-size:2rem;font-weight:900;line-height:1.15}.home-video-frame{overflow:hidden;border-radius:22px;background:#020617;border:1px solid rgba(147,197,253,.28);box-shadow:0 20px 48px rgba(0,0,0,.28)}.home-video-frame video{display:block;width:100%;height:auto;max-height:720px;background:#000}.home-video-library-link{display:inline-flex;margin-top:12px;color:#bfdbfe;font-weight:900;text-decoration:none;border-bottom:1px solid rgba(147,197,253,.45)}.home-video-library-link:hover{color:#fff}
    .home-visit-counter{max-width:720px;margin:34px auto 8px;text-align:center}.visit-counter-card{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;text-align:center;border-radius:20px;padding:14px 20px;background:rgba(31,41,55,.88);border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 42px rgba(15,23,42,.18);color:#fff}.visit-counter-card:before,.visit-counter-card:after{display:none}.visit-counter-icon{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;width:auto;height:auto;border-radius:0;background:transparent;border:0;font-size:.88rem;box-shadow:none;line-height:1}.visit-counter-copy{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}.visit-counter-copy strong{display:block;color:rgba(255,255,255,.94);font-size:.88rem;line-height:1.12;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.counter-divider{color:rgba(255,255,255,.45);font-weight:900}.visit-counter-subtitle{margin:10px auto 0;color:#dbeafe;font-size:.86rem;line-height:1.2;font-weight:900;text-align:center}.visit-counter-loading{opacity:.88}
    .setup-card-home{display:block;max-width:1040px}.setup-panel-card{max-width:1040px;margin:0 auto}.setup-controls-grid{display:block}.setup-note-box{display:none}.year-slicer{margin:14px 0;padding:15px;border:1px solid #dbeafe;border-radius:20px;background:linear-gradient(135deg,#eff6ff,#f8fafc);box-shadow:0 10px 28px rgba(15,23,42,.08)}.year-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.year-head label{margin:0}.year-summary{color:#1d4ed8;font-weight:1000}.year-values{display:flex;justify-content:space-between;margin:12px 0 8px;font-weight:900;color:#334155}.year-shell{position:relative;height:36px}.year-track,.year-fill{position:absolute;left:0;right:0;top:16px;height:7px;border-radius:999px}.year-track{background:#cbd5e1}.year-fill{background:linear-gradient(90deg,#22c55e,#2563eb)}.year-range{position:absolute;left:0;top:6px;width:100%;height:26px;background:transparent;pointer-events:none;appearance:none;-webkit-appearance:none}.year-range::-webkit-slider-thumb{pointer-events:auto;appearance:none;-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid #2563eb;box-shadow:0 4px 12px rgba(15,23,42,.24);cursor:pointer}.summary-lines{border:1px solid #bfdbfe;border-radius:16px;background:#f8fafc;margin:12px 0}.summary-line{display:flex;justify-content:space-between;gap:10px;padding:12px;border-bottom:1px solid #bfdbfe;font-weight:950}.summary-line:last-child{border-bottom:0}.summary-badge{background:#2563eb;color:#fff;border-radius:999px;padding:7px 10px}.league-selector{padding:16px;border:1px solid #bfdbfe;border-radius:18px;background:#f8fafc;margin:14px 0}.league-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.league-btn{border:2px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:14px;padding:12px;font-weight:1000;cursor:pointer}.league-btn.selected{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border-color:transparent;box-shadow:0 12px 24px rgba(37,99,235,.26)}.setup-info{padding:13px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-weight:900;margin:12px 0}.setup-info.good{background:#ecfdf5;border-color:#bbf7d0;color:#166534}
    .game-grid.clean-game{max-width:1280px;width:min(1280px,calc(100vw - 32px));margin:0 auto;grid-template-columns:minmax(0,1.18fr) minmax(440px,.92fr);gap:22px}.clean-game .draft-card,.clean-game .teams-card{border-radius:26px}.clean-game .player-card{min-height:300px;border-radius:28px}.candidate-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.clean-game #draftControls{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;align-items:stretch}.clean-game #draftControls .btn{width:100%;min-height:54px;padding-left:18px;padding-right:18px}.clean-game.league-legends-active #activePoolNote,.clean-game.league-legends-active #message{display:none!important}.pitch{height:520px}.pitch-player{position:absolute;width:min(128px,28%);min-width:96px;transform:translate(-50%,-50%);border-radius:14px;background:#fff;border:1px solid rgba(15,23,42,.14);box-shadow:0 10px 24px rgba(0,0,0,.20);padding:8px;text-align:center;z-index:3}.pitch-player.empty-slot{background:rgba(255,255,255,.35);color:#fff;border:1px dashed rgba(255,255,255,.75);box-shadow:none}.pitch-player.selectable{background:#dbeafe!important;color:#1e3a8a!important;border:2px solid #60a5fa!important;cursor:pointer}.pitch-player.selected{background:#dcfce7!important;color:#166534!important;border-color:#22c55e!important}.pitch-player .pos{display:inline-block;background:#0f172a;color:#fff;border-radius:999px;padding:2px 7px;font-weight:1000;font-size:.62rem}.pitch-player .name{display:block;font-weight:1000;font-size:.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pitch-player .club,.pitch-player .year{display:block;font-weight:850;font-size:.62rem;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pitch-player .rating{color:#b45309;font-weight:1000}.pitch-player.gk{left:50%;top:88%}.pitch-player.def{left:50%;top:68%}.pitch-player.mid1{left:32%;top:50%}.pitch-player.mid2{left:68%;top:50%}.pitch-player.fwd{left:50%;top:22%}.team-card .pitch{height:520px}.team-top-row{align-items:flex-start}.active-pool,.turn-note{margin-top:12px;padding:10px 12px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-weight:900}.online-room-mini{display:inline-flex;border-radius:999px;padding:6px 10px;background:rgba(15,23,42,.88);color:#fff;font-size:.72rem;font-weight:950}.teams-scroll{max-height:calc(100vh - 230px);overflow-y:auto;display:grid!important;grid-template-columns:1fr!important;gap:14px!important;padding-right:8px}.bid-status-summary{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-weight:950}.bid-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.bid-submit-status{font-weight:950}.live-status-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px}.live-pill{border-radius:999px;padding:5px 9px;background:#e2e8f0;font-weight:950}.live-pill.good{background:#dcfce7;color:#166534}.live-pill.bad{background:#fee2e2;color:#991b1b}.live-pill.high{background:#dbeafe;color:#1d4ed8}
    .finished-results-page{max-width:1120px!important;width:min(1120px,calc(100vw - 32px));margin:24px auto!important}.finished-hero{display:grid;grid-template-columns:1fr;justify-items:center;text-align:center;padding:20px;border-radius:24px;background:linear-gradient(135deg,#dcfce7,#e0f2fe);margin-bottom:18px}.finished-hero h2{font-size:clamp(2.2rem,5vw,3.8rem);margin:4px 0}.winner-badge-large{display:inline-flex;border-radius:999px;padding:12px 18px;background:#eff6ff;color:#1d4ed8;font-weight:1000}.finished-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.finished-results-grid{display:grid;grid-template-columns:minmax(360px,780px);justify-content:center}.finished-team-card{background:#fff;border:1px solid #bfdbfe;border-radius:22px;padding:22px}.finished-player-list{display:grid;gap:9px;margin-top:12px}.finished-player-row{display:grid;grid-template-columns:56px 1fr 46px;gap:10px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:9px 12px}.finished-pos{background:#dcfce7;color:#166534;border-radius:999px;text-align:center;font-weight:1000;padding:4px}.finished-player-name{display:block;font-weight:1000}.finished-player-meta{display:block;color:#64748b;font-weight:800;font-size:.78rem}.finished-player-rating{color:#1d4ed8;font-weight:1000;text-align:right}
    .leaderboard-main-tabs-v55,.leaderboard-subtabs-v55{display:flex;gap:10px;flex-wrap:wrap}.leaderboard-row-v55{grid-template-columns:58px minmax(0,1fr) 170px 80px!important}.leaderboard-team-v78,.ps-lb-meta{grid-column:2 / span 3;display:flex;gap:6px;flex-wrap:wrap}.leaderboard-player-chip-v78,.ps-lb-chip{padding:4px 8px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-size:.74rem;font-weight:900}.leaderboard-tab.active{background:linear-gradient(135deg,#2563eb,#1d4ed8)!important;color:#fff!important;border-color:transparent!important}
    .ps-panel{max-width:1180px;margin:28px auto 56px;color:#0f172a}.ps-hidden{display:none!important}body.ps-active #setupPanel,body.ps-active #gamePanel,body.ps-active #resultsPanel,body.ps-active #leaderboardPanel,body.ps-active #onlineLobbyPanel,body.ps-active #gameEntryPanel{display:none!important}.ps-card{background:rgba(255,255,255,.97);border-radius:30px;padding:clamp(20px,3vw,30px);box-shadow:0 24px 80px rgba(0,0,0,.28)}.ps-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}.ps-box{border-radius:24px;padding:22px;background:linear-gradient(135deg,#eff6ff,#ecfdf5);border:1px solid #bfdbfe}.ps-box h2{font-size:clamp(2rem,4vw,3.2rem);line-height:.98;letter-spacing:-.055em}.ps-dark{background:linear-gradient(135deg,#0f172a,#1e3a8a)!important;color:#fff!important}.ps-dark p{color:#edf5ff!important}.ps-form{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}.ps-pos{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.ps-pos button{border:2px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:16px;padding:13px 10px;font-weight:1000;cursor:pointer}.ps-pos button.sel{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border-color:transparent}.ps-actions{display:flex;gap:10px;flex-wrap:wrap}.ps-choices{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.ps-choice{border:2px solid #93c5fd;background:linear-gradient(135deg,#eef6ff,#dbeafe);border-radius:22px;padding:18px;text-align:left;cursor:pointer}.ps-choice.retire{background:linear-gradient(135deg,#fef3c7,#fed7aa);border-color:#f59e0b}.ps-choice.disabled{cursor:default;opacity:.75}.ps-pill{display:inline-flex;margin-top:12px;padding:7px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:1000}.ps-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.ps-stat,.ps-year{opacity:0;transform:translateY(8px);transition:.35s ease}.ps-stat.show,.ps-year.show{opacity:1;transform:none}.ps-stat{padding:13px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0}.ps-stat span{display:block;color:#64748b;font-size:.72rem;text-transform:uppercase;font-weight:900}.ps-stat strong{font-size:1.35rem}.ps-score{min-height:230px;border-radius:28px;background:linear-gradient(135deg,#052e16,#1e3a8a);color:#fff;display:grid;place-items:center;text-align:center}.ps-score strong{font-size:4.4rem}.ps-timeline{display:grid;gap:8px;margin-top:14px;max-height:420px;overflow:auto}.ps-year{display:grid;grid-template-columns:58px 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0}.ps-clubs{display:flex;flex-wrap:wrap;gap:8px}.ps-clubs span{padding:7px 10px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-weight:900}

    .leaderboard-name{font-weight:900!important;display:block;line-height:1.15}.leaderboard-name-main{display:block;font-weight:1000!important;color:#0f172a;font-size:1.02rem}.leaderboard-year-line,.leaderboard-meta-v55{display:block;margin-top:3px;color:#64748b!important;font-size:.78rem;font-weight:800!important}.leaderboard-player-chip-v78{display:inline-flex!important;align-items:center;gap:5px}.lb-chip-pos{color:#1d4ed8;font-weight:1000}.lb-chip-name{color:#0f172a;font-weight:750}.finished-hero{max-width:820px;margin-left:auto!important;margin-right:auto!important;text-align:center!important}.winner-badge-large{font-size:1.15rem;gap:10px}.winner-badge-large .score-number{display:inline-block;font-size:2.4rem;line-height:1;color:#1d4ed8}.finished-score{font-size:3.2rem!important;line-height:1!important;color:#0f172a!important;font-weight:1000!important}.finished-team-top{align-items:flex-start}.pro-score-header{display:flex;align-items:center!important;justify-content:space-between;gap:16px;margin-bottom:16px}.pro-score-header h3{font-size:1.45rem;margin:0}.finished-score-card{min-width:150px;text-align:center;border-radius:22px;padding:12px 18px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;box-shadow:0 12px 28px rgba(37,99,235,.16)}.finished-score-card span{display:block;text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:1000;color:#64748b}.finished-score-card strong{display:block;font-size:3rem;line-height:1;color:#1d4ed8;font-weight:1000}.finished-team-top{align-items:flex-start}.lb-team-label{font-weight:500!important;color:#334155}.year-slicer-locked{opacity:.58;filter:grayscale(.55)}.year-slicer-locked input[disabled]{pointer-events:none}.year-slicer-locked .year-fill{background:#cbd5e1!important}.year-slicer-locked .year-range::-webkit-slider-thumb{border-color:#94a3b8!important;background:#f8fafc!important}.year-slicer-locked .year-range::-moz-range-thumb{border-color:#94a3b8!important;background:#f8fafc!important}.monthly-menu-card{color:#0f172a!important;background:linear-gradient(135deg,#ffffff,#eff6ff)!important;border-color:#bfdbfe!important}.monthly-menu-card p{color:#334155!important}.monthly-menu-card .challenge-action{color:#2563eb!important}.monthly-menu-layout{position:relative}.monthly-menu-back{position:absolute;right:24px;top:24px;float:none!important}
    .u5-popular-badge{display:inline-flex;border-radius:999px;padding:5px 10px;background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.45);color:#bbf7d0;font-weight:1000;font-size:.72rem;letter-spacing:.04em}.leaderboard-subtabs-v55{padding:8px 10px!important;background:#eef2ff!important;border:1px solid #c7d2fe!important;border-radius:16px!important}.leaderboard-subtabs-v55 .leaderboard-tab{font-size:.78rem!important;padding:7px 10px!important;min-height:34px!important;border-radius:12px!important;background:#f1f5f9!important;border-color:#cbd5e1!important;color:#334155!important;box-shadow:none!important}.leaderboard-subtabs-v55 .leaderboard-tab.active{background:linear-gradient(135deg,#0f172a,#334155)!important;color:#fff!important}.pitch-player.selected-role{background:#dcfce7!important;color:#166534!important;border:3px solid #22c55e!important;box-shadow:0 0 0 4px rgba(34,197,94,.18),0 14px 30px rgba(22,163,74,.26)!important}.pitch-player.selection-muted{opacity:.45!important;filter:grayscale(.65);box-shadow:none!important}.in-game-restart-btn{margin-left:auto;min-width:112px}.draft-card .turn-row{align-items:flex-start}.finished-team-card .pitch{height:560px;width:100%;max-width:760px;margin:0 auto}.finished-team-card .pitch-player{width:min(142px,30%)}.finished-team-card .pitch-player.fwd{top:12%}.finished-team-card .pitch-player.mid1{left:25%;top:48%}.finished-team-card .pitch-player.mid2{left:75%;top:48%}.finished-team-card .pitch-player.def{top:70%}.finished-team-card .pitch-player.gk{top:88%}.finished-team-card .pitch-player .name{font-size:.70rem;line-height:1.02}.finished-team-card .pitch-player .club{font-size:.58rem}.finished-team-card .pitch-player .year,.finished-team-card .pitch-player .rating{font-size:.58rem}.finished-actions .btn{min-width:150px}
    .finished-team-card .pitch-player{width:min(154px,32%);min-height:82px;padding:7px 8px}.finished-team-card .pitch-player .name{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:break-word;font-size:.68rem;line-height:1.03;display:block}.finished-team-card .pitch-player .club,.finished-team-card .pitch-player .year{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-size:.56rem;line-height:1.04}.finished-team-card .pitch-player .rating{font-size:.56rem;line-height:1.04}.ps-restart-btn{min-width:112px}
    .btn-deep{background:linear-gradient(135deg,#0f172a,#1e3a8a)!important;color:#fff!important}.finished-hero .finished-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));width:min(560px,100%);gap:10px}.finished-hero .finished-actions .btn{width:100%;min-width:0}.leaderboard-league-line{color:#1e3a8a!important;font-weight:950!important}.ps-start-actions{margin-top:30px}.ps-career-actions{margin-top:18px}.ps-restart-btn{min-width:112px}.ps-results-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:10px}.ps-results-actions .btn{width:100%}.finished-team-card .pitch-player{width:min(154px,32%);min-height:82px;padding:7px 8px}.finished-team-card .pitch-player .name{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:break-word;font-size:.68rem;line-height:1.03;display:block}.finished-team-card .pitch-player .club,.finished-team-card .pitch-player .year{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-size:.56rem;line-height:1.04}.finished-team-card .pitch-player .rating{font-size:.56rem;line-height:1.04}
    .online-lobby-card{max-width:900px!important;margin:28px auto 56px!important;padding:26px!important;border-radius:28px!important;background:rgba(255,255,255,.97)!important;text-align:center!important}.online-lobby-header{display:grid;justify-items:center;gap:12px}.online-lobby-header h2{margin:0;color:#0f172a;font-size:1.65rem}.online-lobby-header .muted{max-width:640px}.lobby-code{display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:14px;background:#0f172a;color:#fff;font-size:1.45rem;font-weight:1000;letter-spacing:.18em}.lobby-link{width:100%;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:14px;padding:13px 16px;font-weight:950;overflow-wrap:anywhere}.joined-list{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:2px 0 10px}.joined-pill{display:inline-flex;align-items:center;border-radius:999px;background:#dcfce7;color:#166534;font-weight:1000;padding:7px 13px}.online-lobby-setup{text-align:left;border:1px solid #dbeafe;background:#f8fafc;border-radius:22px;padding:18px;margin-top:14px}.online-lobby-section-title{font-weight:1000;color:#0f172a;margin:0 0 12px}.online-mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}.lobby-mode-card{appearance:none;border:1px solid #cbd5e1;background:#fff;border-radius:15px;padding:14px;text-align:left;cursor:pointer;color:#0f172a;font-weight:900;box-shadow:0 8px 20px rgba(15,23,42,.06)}.lobby-mode-card strong{display:block;font-size:.95rem;margin-bottom:6px}.lobby-mode-card span{display:block;color:#64748b;font-size:.82rem;line-height:1.3;font-weight:800}.lobby-mode-card.selected{border-color:#22c55e;background:#ecfdf5;box-shadow:0 0 0 2px rgba(34,197,94,.12)}.online-bid-style-box{border:1px solid #dbeafe;background:#fff;border-radius:18px;padding:14px;margin:14px 0}.online-bid-style-box h3{margin:0 0 12px;color:#0f172a}.online-start-btn{margin-top:8px;min-width:170px}.lobby-checkbox{display:flex;align-items:center;gap:8px;font-weight:950;color:#0f172a;margin:12px 0}
    .bid-order-card{border:1px solid #dbeafe;background:#f8fafc;border-radius:18px;padding:14px;margin:12px 0}.bid-order-card h3{margin:.15rem 0 .45rem}.online-bid-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.online-bid-actions .btn{width:100%;min-height:44px}.bid-status-summary{align-items:center}.live-status-row{background:#fff}
    .disabled-action{opacity:.72}.disabled-action input,.disabled-action button{cursor:not-allowed!important}.disabled-action input{background:#e5e7eb!important;color:#64748b!important}.online-action-card input:disabled{background:#e5e7eb!important;color:#64748b!important}
    .clean-game #draftControls[style*="display: none"]{display:none!important}.clean-game #bidControls.hidden{display:none!important}.turn-note.hidden{display:none!important}
    .result-gold-winner{border:3px solid #f59e0b!important;box-shadow:0 0 0 4px rgba(245,158,11,.14),0 22px 50px rgba(146,64,14,.22)!important}.result-rank-badge{display:inline-flex;align-items:center;justify-content:center;min-width:54px;margin-bottom:10px;border-radius:999px;background:#1e3a8a;color:#fff;font-weight:1000;padding:7px 12px}.result-rank-badge.gold{background:linear-gradient(135deg,#f59e0b,#b45309)}
    @media(max-width:980px){.game-entry-grid,.mode-hero,.u5-hero-card,.ps-grid{grid-template-columns:1fr}.challenge-grid-v2{grid-template-columns:1fr 1fr}.game-grid.clean-game{grid-template-columns:1fr!important;width:min(820px,calc(100vw - 24px))}.teams-card{order:2}.draft-card{order:1}}
    @media(max-width:620px){.finished-actions{display:grid!important;grid-template-columns:1fr!important;width:100%!important}.finished-actions .btn{width:100%!important;min-width:0!important}.finished-team-card{padding:14px!important}.finished-team-card .pitch{height:520px!important;width:calc(100vw - 78px)!important;max-width:none!important;margin-left:50%!important;transform:translateX(-50%)!important}.finished-team-card .pitch-player{width:41%!important;min-width:112px!important;max-width:136px!important;min-height:84px!important;padding:7px 7px!important}.finished-team-card .pitch-player.fwd{top:10%!important}.finished-team-card .pitch-player.mid1{left:25%!important;top:47%!important}.finished-team-card .pitch-player.mid2{left:75%!important;top:47%!important}.finished-team-card .pitch-player.def{top:70%!important}.finished-team-card .pitch-player.gk{top:88%!important}.finished-team-card .pitch-player .name{font-size:.61rem!important;line-height:1.03!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.finished-team-card .pitch-player .club{font-size:.50rem!important;line-height:1.02!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.finished-team-card .pitch-player .year,.finished-team-card .pitch-player .rating{font-size:.50rem!important;line-height:1.02!important}.leaderboard-subtabs-v55 .leaderboard-tab{font-size:.74rem!important;min-height:36px!important;padding:6px 8px!important}}
    @media(max-width:620px){.finished-hero .finished-actions,.ps-results-actions{grid-template-columns:1fr!important;width:100%!important}.finished-hero .finished-actions .btn,.ps-results-actions .btn{width:100%!important}.finished-team-card .pitch-player{width:41%!important;min-width:112px!important;max-width:136px!important;min-height:84px!important;padding:7px 7px!important}.finished-team-card .pitch-player.mid1{left:25%!important;top:47%!important}.finished-team-card .pitch-player.mid2{left:75%!important;top:47%!important}.finished-team-card .pitch-player .name{font-size:.61rem!important;line-height:1.03!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.finished-team-card .pitch-player .club{font-size:.50rem!important;line-height:1.02!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.finished-team-card .pitch-player .year,.finished-team-card .pitch-player .rating{font-size:.50rem!important;line-height:1.02!important}}
    @media(max-width:620px){.challenge-grid-v2,.league-grid,.ps-choices,.ps-stats,.ps-pos,.ps-form,.online-room-actions{grid-template-columns:1fr}.candidate-actions{grid-template-columns:1fr}.clean-game #draftControls{grid-template-columns:1fr!important;gap:12px}.clean-game #draftControls .btn{width:100%;min-height:50px}.mode-hero,.u5-card{padding:18px}.pitch{height:500px}.leaderboard-main-tabs-v55,.leaderboard-subtabs-v55{display:grid!important;grid-template-columns:1fr 1fr;gap:10px}.leaderboard-main-tabs-v55 .leaderboard-tab,.leaderboard-subtabs-v55 .leaderboard-tab{width:100%;min-height:42px}.leaderboard-row-v55{display:grid!important;grid-template-columns:44px minmax(0,1fr) 62px!important;gap:6px 10px!important;align-items:start!important;padding:16px!important}.leaderboard-rank{grid-column:1;grid-row:1 / span 2;align-self:start;padding-top:3px}.leaderboard-name{grid-column:2;grid-row:1;min-width:0}.leaderboard-mode{grid-column:2;grid-row:2;text-align:left!important;color:#64748b;font-weight:900}.leaderboard-score{grid-column:3;grid-row:1 / span 2;justify-self:end;align-self:center;font-size:1.25rem!important}.leaderboard-team-v78,.ps-lb-meta{grid-column:2 / 4;grid-row:3;display:flex!important;gap:6px;align-items:flex-start;min-width:0}.leaderboard-team-v78 .lb-team-label{width:100%;margin-bottom:2px}.leaderboard-player-chip-v78,.ps-lb-chip{font-size:.72rem!important;max-width:100%;white-space:normal}.ps-lb-meta .ps-lb-chip:nth-child(n+6){display:none!important}.ps-lb-meta:after{content:'More details on desktop';font-size:.72rem;color:#64748b;font-weight:800;padding:4px 0}.finished-results-grid{grid-template-columns:1fr}.pro-score-header{align-items:center!important}.finished-score-card{min-width:118px;padding:10px 12px}.finished-score-card strong{font-size:2.2rem}}

    @media(max-width:620px){.home-visit-counter{margin:30px auto 6px}.visit-counter-card{display:flex;gap:8px;padding:13px 14px}.visit-counter-icon{margin:0;font-size:.82rem}.visit-counter-copy strong{font-size:.78rem;letter-spacing:.06em}.visit-counter-subtitle{font-size:.78rem;margin-top:9px}}
  `;
  document.head.appendChild(style);
}

// ---------- Home / routing ----------
function hideAllPanels(){
  ['gameEntryPanel','onlineLobbyPanel','playerSimulationPanel','monthlyMenuPanel'].forEach(id => show($(id), false));
  show(els.setupPanel, false); show(els.gamePanel, false); show(els.resultsPanel, false); show(els.leaderboardPanel, false);
}
function ensureEntryPanel(){
  injectStyles();
  let panel = $('gameEntryPanel');
  if (panel) return panel;
  panel = document.createElement('section'); panel.id = 'gameEntryPanel'; panel.className = 'game-entry-panel';
  (document.querySelector('.app-shell') || document.body).insertBefore(panel, els.setupPanel || null);
  return panel;
}
function renderHome(){
  injectStyles(); document.body.classList.remove('ps-active'); if(els.draftControls) els.draftControls.style.removeProperty('display'); setMessage(''); const oldTurn=$('turnLockNote'); if(oldTurn) oldTurn.remove();
  state = null; currentCandidate = null; ratingsRevealed = false; selectedPreset = 'solo'; selectedGameMode = 'draft';
  hideAllPanels(); if (els.resetBtn) els.resetBtn.style.display = 'none';
  const panel = ensureEntryPanel(); show(panel, true);
  panel.innerHTML = `
    <div class="game-entry-heading"><h2>Choose Game Mode</h2><p>Start a quick local game, or create/join an online room with friends.</p></div>
    <div class="game-entry-grid">
      <article class="entry-card online-card"><h3>Online Game</h3><p>Create a room and share the link, or join using a room code.</p><div class="online-room-box"><div class="online-room-actions"><input id="onlineRoomName" type="text" placeholder="Your name"><button id="createOnlineRoomBtn" type="button" class="btn btn-secondary">Create online room</button></div><div class="online-room-actions"><input id="joinRoomCode" type="text" placeholder="Room code"><button id="joinOnlineRoomBtn" type="button" class="btn btn-secondary">Join room</button></div><p id="onlineRoomStatus" class="online-room-status">Online games use joined player names automatically.</p><p id="onlineRoomLink" class="online-room-link hidden"></p></div></article>
      <article class="entry-card local-card"><h3>Solo Challenge</h3><p>Play a quick single-player draft on this device. Pick, accept or decline players and build your best 5-a-side team.</p><button id="startLocalGameBtn" type="button" class="btn btn-primary btn-wide">Set up Solo Challenge</button></article>
    </div>
    <section class="u5-hero-card u5-hero-blue" id="leagueLegendsHome"><div><div class="u5-line"><span class="u5-new green">LIVE</span><span class="u5-popular-badge">Most popular game mode</span><p class="eyebrow">Game mode</p></div><h3>League Legends</h3><p>Choose a league. Draft its legends. Pick their positions - but out-of-position picks affect the final rating.</p></div><button type="button" class="btn btn-primary" data-open-preset="leaguelegends">Play League Legends</button></section>
    <section class="u5-hero-card u5-hero-green" id="playerSimulationHome"><div><div class="u5-line"><span class="u5-new">NEW</span><p class="eyebrow">Game mode</p></div><h3>Player Simulation</h3><p>Create a player, choose a position, pick your career path each season and see how your legacy ranks out of 100.</p></div><button type="button" class="btn btn-primary" data-player-sim-open>Play Player Simulation</button></section>
    <section class="home-latest-video" aria-labelledby="latestGuessVideoHeading"><h3 id="latestGuessVideoHeading">Latest 'Guess the Player' Video</h3><div class="home-video-frame"><video controls playsinline preload="metadata" aria-label="Latest 'Guess the Player' video"><source src="GuessThePlayer.mp4" type="video/mp4">Your browser does not support embedded video.</video></div><a class="home-video-library-link" href="guess-the-player.html">View all 'Guess the Player' videos</a></section>
    <div class="popular-challenges-v2"><h3>🔥 Popular Challenges</h3><div class="challenge-grid-v2">
      <button class="challenge-card-v2" data-open-preset="ultimate"><span class="challenge-badge">LIVE</span><h4>⭐ Ultimate Solo Mode</h4><p>Full player database. No year filters. No league filters.</p><span class="challenge-action">Play Now →</span></button>
      <button class="challenge-card-v2" data-open-preset="easy"><span class="challenge-badge">LIVE</span><h4>🎯 Easy Solo Challenge</h4><p>Top players only. Keep year selection but use a simplified player pool.</p><span class="challenge-action">Play Now →</span></button>
      <button class="challenge-card-v2" data-open-preset="league"><span class="challenge-badge">LIVE</span><h4>🏟️ League Challenge</h4><p>Filter the all-years player pool by Premier League, La Liga and other eligible leagues.</p><span class="challenge-action">Play Now →</span></button>
      <button class="challenge-card-v2" data-open-preset="monthly"><span class="challenge-badge">LIVE</span><h4>🗓️ Monthly Challenges</h4><p>July 2026: World Cup 2026</p><span class="challenge-action">Play Now →</span></button>
    </div></div>
    <div class="landing-how-play-inline"><h3>⚽ How to Play</h3><div class="landing-how-inline-row"><div class="inline-step"><span>🎮</span><strong>Choose Mode</strong><small>Solo Challenge or Online Play</small></div><div class="inline-arrow">→</div><div class="inline-step"><span>👤</span><strong>Pick Players</strong><small>Accept, decline or bid</small></div><div class="inline-arrow">→</div><div class="inline-step"><span>⚽</span><strong>Build Team</strong><small>Fill all 5 positions</small></div><div class="inline-arrow">→</div><div class="inline-step"><span>🏆</span><strong>Reveal Ratings</strong><small>Highest score wins</small></div></div></div>
    <section class="home-visit-counter" aria-label="Ultimate 5-a-side activity totals"><div class="visit-counter-card"><span class="visit-counter-icon" aria-hidden="true">⚽</span><div class="visit-counter-copy"><strong id="homeVisitCounter" class="visit-counter-loading">Total visits: loading...</strong><span class="counter-divider" aria-hidden="true">•</span><strong id="gameStartCounter" class="visit-counter-loading">Games started: loading...</strong></div></div><p class="visit-counter-subtitle">Players are drafting their ultimate 5-a-side teams every day</p></section>
`;
  $('createOnlineRoomBtn')?.addEventListener('click', safe(createOnlineRoom));
  $('joinOnlineRoomBtn')?.addEventListener('click', safe(() => joinOnlineRoom($('joinRoomCode')?.value)));
  $('startLocalGameBtn')?.addEventListener('click', () => openSetup('solo'));
  panel.querySelectorAll('[data-open-preset]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.openPreset; if (p === 'monthly') showMonthlyMenu(); else openSetup(p);
  }));
  panel.querySelector('[data-player-sim-open]')?.addEventListener('click', openPlayerSimulation);
  const params = new URLSearchParams(location.search); const room = params.get('room');
  if (room) { $('joinRoomCode').value = room.toUpperCase(); $('onlineRoomStatus').textContent = 'Room code detected: ' + room.toUpperCase() + '. Type your player name, then click Join room.'; }
  recordStatsEvent('home_view', '', { source:'render_home' }).finally(startHomeVisitCounter);
}

function miniPitch(){ return `<div class="mini-pitch-clean"><span class="mini-pos fwd">FWD</span><span class="mini-pos mid1">MID</span><span class="mini-pos mid2">MID</span><span class="mini-pos def">DEF</span><span class="mini-pos gk">GK</span></div>`; }
function modeHero(preset){
  const map = {
    solo:['Solo Challenge','Choose your 5-a-side challenge','Pick a game mode, add your players, then build the strongest five-a-side team from the top-rated players across the years.'],
    easy:['🎯 Easy Solo Challenge','Easy Solo Challenge','Only the elite players are available. Choose a year range and build your dream team.'],
    ultimate:['⭐ Ultimate Solo Mode','Ultimate Solo Mode','Full player database unlocked. Every year is included, and the year range filter is ignored.'],
    league:['🏟️ League Challenge','League Challenge','Select one or more eligible leagues, then build your best 5-a-side team from that filtered all-years player pool.'],
    worldcup:['July Monthly Challenge','World Cup 2026 Challenge','Solo Challenge rules with a dedicated World Cup 2026 player pool. The usual year filter is disabled for this challenge.'],
    leaguelegends:['League Legends Challenge','Draft your legends','Choose a league, then draft from its legends. Choose their positions, but be careful - the ratings will be affected if they are out of position.']
  }[preset];
  return `<section class="mode-hero"><div><p class="eyebrow">${esc(map[0])}</p><h2>${esc(map[1])}</h2><p>${esc(map[2])}</p><div class="mode-pills"><span>⚽ GK • DEF • MID • MID • FWD</span><span>🏆 Reveal scores at the end</span></div></div>${miniPitch()}</section>`;
}
async function openSetup(preset){
  injectStyles(); await ensurePlayersReady(); if (preset === 'worldcup') await loadWorldCupPlayers(); if (preset === 'leaguelegends') await loadLegends();
  selectedPreset = preset; selectedGameMode = 'draft'; online.enabled = false; online.isHost=false; online.roomId=null; online.myName=''; playerSim = null; state = null; currentCandidate = null; const oldTurn=$('turnLockNote'); if(oldTurn) oldTurn.remove(); setMessage('');
  selectedYearRange = null;
  if (preset === 'league') selectedLeagueKeys = new Set(['premier_league']);
  hideAllPanels(); show(els.setupPanel,true); if (els.resetBtn) els.resetBtn.style.display = '';
  const setup = els.setupPanel; setup.className = 'setup-card-home';
  setup.innerHTML = modeHero(preset) + `<div class="setup-panel-card u5-card" id="cleanSetupCard"></div>`;
  renderSetupControls(); setTimeout(() => setup.scrollIntoView({behavior:'smooth', block:'start'}), 30);
}
function availableYears(pool){ const yrs = [...new Set(pool.map(p => Number(p.year)).filter(Boolean))].sort((a,b)=>a-b); return yrs.length ? yrs : [2005, 2026]; }
function currentSetupPool(){
  let pool = selectedPreset === 'worldcup' ? worldCupPlayers : players;
  if (selectedPreset === 'easy') pool = easyPool(pool);
  if (selectedPreset === 'league') pool = filterByLeagueSelection(pool);
  if (selectedPreset === 'ultimate') return pool;
  return pool;
}
function getDefaultRange(){ const yrs = availableYears(selectedPreset === 'worldcup' ? worldCupPlayers : players); return { min:yrs[0], max:yrs[yrs.length - 1], start:yrs[0], end:yrs[yrs.length - 1] }; }
function clampRange(start,end){ const d=getDefaultRange(); let a=Number(start ?? d.start), b=Number(end ?? d.end); if (!Number.isFinite(a)) a=d.start; if (!Number.isFinite(b)) b=d.end; a=clamp(Math.round(a),d.min,d.max); b=clamp(Math.round(b),d.min,d.max); if(a>b)[a,b]=[b,a]; return {min:d.min,max:d.max,start:a,end:b}; }
function yearSlicerHtml(disabled=false){
  const r = getDefaultRange();
  const active = disabled ? { ...r, start:r.min, end:r.max } : (selectedYearRange || r);
  if (disabled) {
    return `<div class="year-slicer year-slicer-locked"><div class="year-head"><div><label>Player pool locked to all years</label><p class="muted year-help">All years are active and the year filter is ignored.</p></div><strong class="year-summary">${active.start} - ${active.end}</strong></div><div class="year-values"><span>From <strong>${active.start}</strong></span><span>To <strong>${active.end}</strong></span></div><div class="year-shell"><div class="year-track"></div><div class="year-fill" style="left:0;right:0"></div><input class="year-range" type="range" min="${active.min}" max="${active.max}" value="${active.min}" disabled aria-disabled="true"><input class="year-range" type="range" min="${active.min}" max="${active.max}" value="${active.max}" disabled aria-disabled="true"></div></div>`;
  }
  return `<div class="year-slicer"><div class="year-head"><div><label>Player year range</label><p class="muted year-help">Choose the years which you want the players to be included from.</p></div><strong class="year-summary" id="yearSummary">${active.start} - ${active.end}</strong></div><div class="year-values"><span>From <strong id="yearStartLabel">${active.start}</strong></span><span>To <strong id="yearEndLabel">${active.end}</strong></span></div><div class="year-shell"><div class="year-track"></div><div id="yearFill" class="year-fill"></div><input id="yearStart" class="year-range" type="range" min="${active.min}" max="${active.max}" value="${active.start}"><input id="yearEnd" class="year-range" type="range" min="${active.min}" max="${active.max}" value="${active.end}"></div></div>`;
}
function wireYearSlicer(scope=document){
  const root = scope || document;
  const a = root.querySelector ? root.querySelector('#yearStart') : $('yearStart');
  const b = root.querySelector ? root.querySelector('#yearEnd') : $('yearEnd');
  if(!a || !b) return;
  const apply = () => {
    selectedYearRange = clampRange(a.value,b.value);
    a.value=String(selectedYearRange.start);
    b.value=String(selectedYearRange.end);
    updateYearLabels(root);
    if(root === document || root.id === 'cleanSetupCard' || root.closest?.('#setupPanel')) renderSetupStats();
  };
  a.addEventListener('input', apply);
  b.addEventListener('input', apply);
  apply();
}

function updateYearLabels(scope=document){
  const root = scope || document;
  const get = id => root.querySelector ? root.querySelector('#'+id) : $(id);
  const r=selectedYearRange || getDefaultRange(), total=Math.max(1,r.max-r.min);
  const summary=get('yearSummary'), startLabel=get('yearStartLabel'), endLabel=get('yearEndLabel'), fill=get('yearFill');
  if(summary) summary.textContent = r.start + ' - ' + r.end;
  if(startLabel) startLabel.textContent = r.start;
  if(endLabel) endLabel.textContent = r.end;
  if(fill) { fill.style.left = ((r.start-r.min)/total*100)+'%'; fill.style.right = (100-(r.end-r.min)/total*100)+'%'; }
}

function renderSetupControls(){
  const card = $('cleanSetupCard'); if(!card) return;
  selectedYearRange = selectedYearRange || getDefaultRange();
  let introTitle = MODE_LABELS[selectedPreset] || 'Solo Challenge';
  let intro = 'Single-player draft mode. Complete a GK, DEF, MID, MID and FWD, then reveal your final rating.';
  if (selectedPreset === 'easy') intro = 'Elite player pool. Choose a year range and build your dream 5-a-side team.';
  if (selectedPreset === 'ultimate') intro = 'Full player database unlocked. All years are included and the year range filter is ignored.';
  if (selectedPreset === 'worldcup') intro = 'July monthly challenge. Draft from the World Cup 2026 player pool only. No year filter.';
  if (selectedPreset === 'league') intro = 'Single-player draft mode. Select eligible leagues and draft from that filtered all-years pool.';
  const leagueSelector = selectedPreset === 'league' ? leagueSelectorHtml() : '';
  const legendsSelector = selectedPreset === 'leaguelegends' ? legendsSelectorHtml() : '';
  const showYear = !['ultimate','worldcup','leaguelegends','league'].includes(selectedPreset);
  const disabledYear = selectedPreset === 'ultimate';
  const yearHtml = showYear ? yearSlicerHtml(false) : (disabledYear ? yearSlicerHtml(true) : '');
  const introHtml = selectedPreset === 'leaguelegends' ? '' : `<div class="setup-info"><strong>${esc(introTitle)}</strong><br>${esc(intro)}</div>`;
  const statsHtml = selectedPreset === 'leaguelegends' ? '' : '<div id="setupStats" class="summary-lines"></div>';
  card.innerHTML = `${introHtml}${leagueSelector}${legendsSelector}${yearHtml}${statsHtml}${selectedPreset==='worldcup'?'<div class="setup-info good">World Cup 2026 Challenge: solo draft using only the dedicated World Cup 2026 player pool.</div>':''}<label class="checkbox-row"><input id="setupExcludeDeclines" type="checkbox" checked> Exclude declined players</label><button id="cleanStartBtn" class="btn btn-primary btn-wide">Start ${esc(introTitle)}</button>`;
  if (showYear) wireYearSlicer();
  if (disabledYear) selectedYearRange = null;
  wireLeagueSelectors(); renderSetupStats(); $('cleanStartBtn')?.addEventListener('click', safe(startSoloGame));
}
function leagueSelectorHtml(){
  return `<div class="league-selector"><h3>Choose leagues</h3><div class="league-grid">${LEAGUE_OPTIONS.map(o => `<button type="button" class="league-btn ${selectedLeagueKeys.has(o.key)?'selected':''}" data-league-key="${o.key}">${esc(o.label)}</button>`).join('')}</div><p class="setup-info good" id="leagueSummary"></p></div>`;
}
function legendsSelectorHtml(){
  return `<div class="league-selector"><h3>Choose your league</h3><div class="league-grid">${LEAGUE_LEGENDS.map(l => `<button type="button" class="league-btn ${selectedLegendLeague===l?'selected':''}" data-legend-league="${esc(l)}">${esc(l)}</button>`).join('')}</div><div class="setup-info good"><strong>Rules:</strong> 3 declines only. GK is fixed. Outfield players can be placed DEF, MID or ST, with position multipliers applied at reveal.</div><div class="setup-info"><strong>Ratings note:</strong> League Legends ratings are relative to the selected league and are based on prime ability, legacy and longevity.</div></div>`;
}
function wireLeagueSelectors(){
  document.querySelectorAll('[data-league-key]').forEach(btn => btn.addEventListener('click', () => { const k=btn.dataset.leagueKey; selectedLeagueKeys.has(k) ? selectedLeagueKeys.delete(k) : selectedLeagueKeys.add(k); if(!selectedLeagueKeys.size) selectedLeagueKeys.add(k); renderSetupControls(); }));
  document.querySelectorAll('[data-legend-league]').forEach(btn => btn.addEventListener('click', () => { selectedLegendLeague = btn.dataset.legendLeague; renderSetupControls(); }));
}
function filterByRange(pool){ if(selectedPreset === 'ultimate' || selectedPreset === 'worldcup' || selectedPreset === 'league') return pool; const r=selectedYearRange || getDefaultRange(); return pool.filter(p => p.year >= r.start && p.year <= r.end); }
function easyPool(pool){
  // Easy Solo Mode rule: for each individual year, keep the top rated
  // 5 GKs, 5 defenders, 10 midfielders and 5 forwards. There are two MID
  // places in a five-a-side team, so MID deliberately has a larger yearly pool.
  const limits = { GK:5, DEF:5, MID:10, FWD:5 };
  const grouped = {};
  (Array.isArray(pool) ? pool : []).forEach(player => {
    const year = Number(player.year || 0);
    const position = player.mainPosition;
    if (!year || !limits[position]) return;
    const key = `${year}_${position}`;
    (grouped[key] ||= []).push(player);
  });
  return Object.values(grouped).flatMap(group => group
    .sort((a,b) => Number(b.rating||0) - Number(a.rating||0) || String(a.player||'').localeCompare(String(b.player||'')))
    .slice(0, limits[group[0]?.mainPosition] || 0)
  );
}
function filterByLeagueSelection(pool){
  const selected = [...selectedLeagueKeys];
  const known = LEAGUE_OPTIONS.filter(o => o.key !== 'other').flatMap(o => o.aliases);
  return pool.filter(p => {
    const league = p.league || clubGuessLeague(p.club);
    if (selected.includes('other') && !known.includes(league)) return true;
    return LEAGUE_OPTIONS.some(o => selected.includes(o.key) && o.aliases.includes(league));
  });
}
function clubGuessLeague(club){
  const found = PLAYER_SIM_CLUBS.find(c => c.name === club); return found?.league || '';
}
function setupEligiblePool(){
  if (selectedPreset === 'leaguelegends') return legends.filter(p => p.league === selectedLegendLeague);
  return filterByRange(currentSetupPool());
}
function renderSetupStats(){
  if (selectedPreset === 'leaguelegends') return;
  const pool = setupEligiblePool(); const stats = estimatePoolStats(pool); const box=$('setupStats');
  if (box) box.innerHTML = `<div class="summary-line"><span>Average 5-a-side score for this setup</span><span class="summary-badge">${stats.average}</span></div><div class="summary-line"><span>Maximum 5-a-side score for this setup</span><span class="summary-badge">${stats.maximum}</span></div>`;
  if ($('leagueSummary')) { const names=[...selectedLeagueKeys].map(k => LEAGUE_OPTIONS.find(o=>o.key===k)?.label).filter(Boolean).join(', '); $('leagueSummary').textContent = 'Selected: ' + names + ' • Active pool: ' + pool.length + ' players'; }
}

function bestUniqueByPosition(pool, position){
  const map = new Map();
  pool.filter(p => p.mainPosition === position).forEach(p => {
    const key = playerKey(p) || String(p.player || '');
    const rating = Number(p.rating || 0);
    if (!map.has(key) || rating > Number(map.get(key).rating || 0)) map.set(key, p);
  });
  return [...map.values()].sort((a,b) => Number(b.rating||0)-Number(a.rating||0));
}

function averageRating(list){
  return list.length ? list.reduce((sum,p)=>sum+Number(p.rating||0),0) / list.length : 0;
}

function bestTwoMids(mids, blockedNames){
  let first = null, second = null;
  for (const mid of mids) {
    const key = playerKey(mid);
    if (blockedNames.has(key)) continue;
    if (!first) first = mid;
    else if (playerKey(first) !== key) { second = mid; break; }
  }
  return first && second ? [first, second] : null;
}

function estimatePoolStats(pool){
  const gks = bestUniqueByPosition(pool, 'GK');
  const defs = bestUniqueByPosition(pool, 'DEF');
  const mids = bestUniqueByPosition(pool, 'MID');
  const fwds = bestUniqueByPosition(pool, 'FWD');
  const average = Math.round(averageRating(gks) + averageRating(defs) + averageRating(mids) * 2 + averageRating(fwds));
  let maximum = 0;
  const topGks = gks.slice(0, 40), topDefs = defs.slice(0, 50), topFwds = fwds.slice(0, 50), topMids = mids.slice(0, 90);
  for (const gk of topGks) {
    for (const def of topDefs) {
      for (const fwd of topFwds) {
        const blocked = new Set([playerKey(gk), playerKey(def), playerKey(fwd)]);
        if (blocked.size < 3) continue;
        const pair = bestTwoMids(topMids, blocked);
        if (!pair) continue;
        maximum = Math.max(maximum, Number(gk.rating||0) + Number(def.rating||0) + Number(pair[0].rating||0) + Number(pair[1].rating||0) + Number(fwd.rating||0));
      }
    }
  }
  return { average: average || 0, maximum: maximum || 0 };
}

function showMonthlyMenu(){
  injectStyles(); hideAllPanels(); if (els.resetBtn) els.resetBtn.style.display = '';
  const shell=document.querySelector('.app-shell')||document.body; let p=$('monthlyMenuPanel');
  if(!p){ p=document.createElement('section'); p.id='monthlyMenuPanel'; p.className='u5-panel u5-card monthly-menu-layout'; shell.insertBefore(p, els.setupPanel || null); }
  p.className = 'u5-panel u5-card monthly-menu-layout';
  p.innerHTML = `<button id="monthlyBack" class="btn btn-secondary monthly-menu-back">Back</button><p class="eyebrow">Monthly Challenges</p><h2>Monthly Challenges</h2><p class="muted">Play limited-time solo challenges with special player pools. More months will be added here.</p><button class="challenge-card-v2 monthly-menu-card" data-open-preset="worldcup"><span class="challenge-badge">LIVE</span><h3>July 2026: World Cup 2026</h3><p>Draft your solo 5-a-side team from the dedicated World Cup 2026 player pool.</p><span class="challenge-action">Play Now →</span></button>`;
  show(p,true); p.querySelector('[data-open-preset]')?.addEventListener('click',()=>{show(p,false);openSetup('worldcup')}); $('monthlyBack')?.addEventListener('click',()=>{show(p,false);renderHome()});
}

// ---------- Game state and drawing ----------
async function startSoloGame(){
  if (selectedPreset === 'leaguelegends') return startLeagueLegends();
  await ensurePlayersReady(); if(selectedPreset === 'worldcup') await loadWorldCupPlayers();
  const pool = setupEligiblePool(); if(!pool.length) throw new Error('No players available for this setup.');
  const name = selectedPreset === 'worldcup' ? 'World Cup 2026' : 'You';
  state = baseState('draft', [name], false); state.challengePreset = selectedPreset; state.challengeName = MODE_LABELS[selectedPreset]; state.poolSnapshot = pool.map(p=>p.id); state.yearRange = selectedYearRange ? {start:selectedYearRange.start,end:selectedYearRange.end} : null; state.excludeDeclines = !!$('setupExcludeDeclines')?.checked; state.leagueSelection = leagueSnapshot(pool);
  recordStatsEvent('game_start', state.challengeName, { source:'solo_start', playerCount:1 });
  selectedGameMode = 'draft'; ratingsRevealed = false; currentCandidate = null; hideAllPanels(); show(els.gamePanel,true); if(els.resetBtn) els.resetBtn.style.display='';
  prepareGamePanel(); clearCandidate('Click Pick player to begin.'); renderGame();
}
function baseState(gameMode,names,isOnline){
  return { gameMode, onlineBidMode: online.bidMode, userCount:names.length, currentUserIndex:0, excludeDeclines:true, users:names.map(n=>({name:n,team:[],declines:0,declinedNames:new Set(),budget:AUCTION_BUDGET,spent:0,bidSkips:0})), acceptedPlayerNames:new Set(), history:[], bidOrder:shuffle(names.map((_,i)=>i)), bidRoundIndex:0, blindBids:{}, liveAuction:null, liveAuctionStartIndex:0, leaderboardSubmitted:false, isOnlineGame:isOnline };
}
function leagueSnapshot(pool){ return { labels:[...selectedLeagueKeys].map(k=>LEAGUE_OPTIONS.find(o=>o.key===k)?.label).filter(Boolean), playerCount:pool.length }; }
async function startLeagueLegends(){
  await loadLegends(); const pool=legends.filter(p=>p.league===selectedLegendLeague); if(!pool.length) throw new Error('No legends available for this league.');
  state = baseState('draft', [selectedLegendLeague], false); state.challengePreset='leaguelegends'; state.challengeName=MODE_LABELS.leaguelegends; state.selectedLegendLeague=selectedLegendLeague; state.legendLeague=selectedLegendLeague; state.leagueName=selectedLegendLeague; state.leagueLabel=selectedLegendLeague; state.excludeDeclines=false; state.leagueSelection={labels:[selectedLegendLeague],playerCount:pool.length};
  recordStatsEvent('game_start', MODE_LABELS.leaguelegends, { source:'league_legends_start', league:selectedLegendLeague, playerCount:1 });
  ratingsRevealed=false; currentCandidate=null; hideAllPanels(); show(els.gamePanel,true); if(els.resetBtn) els.resetBtn.style.display=''; prepareGamePanel(); clearCandidate('Click Randomise player to begin.'); renderGame();
}
function prepareGamePanel(){
  els.gamePanel?.classList.add('clean-game');
  els.gamePanel?.classList.toggle('league-legends-active', state?.challengePreset==='leaguelegends');
  if(els.pickBtn) els.pickBtn.textContent = state?.challengePreset==='leaguelegends' ? 'Randomise player' : 'Pick player';
  const isBid = state?.gameMode === 'bid';
  show(els.draftControls, !isBid);
  show(els.bidControls, isBid);
  if(els.draftControls){
    if(isBid) els.draftControls.style.setProperty('display','none','important');
    else els.draftControls.style.removeProperty('display');
  }
  if(els.bidControls){
    if(isBid) els.bidControls.style.removeProperty('display');
    else els.bidControls.style.setProperty('display','none','important');
  }
  const warning=document.querySelector('.bid-warning');
  if(warning) warning.classList.toggle('hidden', !isBid);
  const turnLock=$('turnLockNote');
  if(!online.enabled && turnLock) turnLock.remove();
}

function activePool(){
  if (state?.challengePreset === 'leaguelegends') return legends.filter(p=>p.league===state.selectedLegendLeague);
  let pool = state?.challengePreset === 'worldcup' ? worldCupPlayers : players;
  if (state?.challengePreset === 'easy') pool = easyPool(pool);
  if (state?.challengePreset === 'league') pool = filterByLeagueSelection(pool);
  if (state?.yearRange && !['ultimate','worldcup','league'].includes(state.challengePreset)) {
    pool = pool.filter(p=>Number(p.year)>=Number(state.yearRange.start) && Number(p.year)<=Number(state.yearRange.end));
  }
  return pool;
}

function currentUser(){ if(!state?.users?.length) return null; const idx=clamp(Number(state.currentUserIndex||0),0,state.users.length-1); state.currentUserIndex=idx; return state.users[idx]; }
function getNeededPositions(user=currentUser()){
  const counts={GK:0,DEF:0,MID:0,FWD:0}; (user?.team||[]).forEach(p=>{ const r=p.selectedRole||p.mainPosition; if(counts[r]!==undefined) counts[r]++; });
  const needed=[]; TEAM_SHAPE.forEach(pos=>{ if(counts[pos]>0) counts[pos]--; else needed.push(pos); }); return needed;
}
function isGameComplete(){ return !!state && state.users.every(u=>getNeededPositions(u).length===0); }
function moveToNextUser(){ for(let i=1;i<=state.userCount;i++){ const next=(state.currentUserIndex+i)%state.userCount; if(getNeededPositions(state.users[next]).length){ state.currentUserIndex=next; return; } } }
function candidatePoolForUser(user=currentUser()){
  const needs=getNeededPositions(user), accepted=asSet(state.acceptedPlayerNames), declined=asSet(user?.declinedNames);
  if(state.challengePreset === 'leaguelegends'){
    const onlyGk = needs.length===1 && needs[0]==='GK'; const gkDone=!needs.includes('GK');
    return activePool().filter(p=>!accepted.has(playerKey(p)) && !declined.has(playerKey(p)) && (onlyGk ? p.naturalMainPosition==='GK' : gkDone ? p.naturalMainPosition!=='GK' : true));
  }
  return activePool().filter(p=>needs.includes(p.mainPosition) && !accepted.has(p.player) && (!state.excludeDeclines || !declined.has(p.player)));
}
async function pickRandomPlayer(){
  if(!state || state.gameMode!=='draft') return; if(online.enabled && !currentPlayerCanAct()) return applyOnlinePermissions();
  if(currentCandidate){ setMessage('Please accept or decline the current player first.'); return; }
  if(isGameComplete()) return completeGame();
  let user=currentUser(); if(!getNeededPositions(user).length){ moveToNextUser(); user=currentUser(); }
  const pool=candidatePoolForUser(user); if(!pool.length){ clearCandidate('No available player found.'); return; }
  currentCandidate={...pick(pool)}; renderCandidate(currentCandidate); setMessage(state.challengePreset === 'leaguelegends' ? '' : 'Positions Remaining: ' + getNeededPositions(user).map(roleLabel).join(', ')); renderGame(); await saveOnlineState();
}
function renderCandidate(p){
  if(!els.candidateCard) return; els.candidateCard.classList.remove('blank');
  const legend = state?.challengePreset === 'leaguelegends';
  const naturalLabel = legend ? (p.naturalPosition || p.position || roleLabel(p.naturalMainPosition)) : '';
  const badges = legend ? `<span class="badge dark">${esc(p.league)}</span><span class="badge">Natural: ${esc(naturalLabel)}</span>` : `<span class="badge dark">${esc(p.mainPosition)}</span><span class="badge">${esc(p.position)}</span><span class="badge">${p.year||''}</span>`;
  const detailA = legend ? p.club : p.club; const detailB = legend ? (p.legendRole ? 'Selected: '+roleLabel(p.legendRole) : 'Pick from pitch') : p.nation;
  els.candidateCard.innerHTML = `<p class="eyebrow">${legend?'League Legends Challenge':'Random candidate'}</p><h3 class="player-name">${esc(p.player)}</h3><div class="badge-row">${badges}</div><div class="detail-grid"><div class="detail"><span>${legend?'Club(s)':'Club'}</span>${esc(detailA)}</div><div class="detail"><span>${legend?'Selected role':'Nation'}</span>${esc(detailB)}</div></div>${state?.yearRange ? `<p class="muted">Pool: ${state.yearRange.start} - ${state.yearRange.end}</p>` : ''}`;
}
function clearCandidate(text){ if(els.candidateCard){ els.candidateCard.classList.add('blank'); els.candidateCard.innerHTML=`<p class="muted">${esc(text)}</p>`; } updateButtons(); }
async function acceptPlayer(){
  if(!state || !currentCandidate || state.gameMode!=='draft') return;
  if(online.enabled && !currentPlayerCanAct()) return applyOnlinePermissions();
  const user=currentUser();
  if(!user){ setMessage('Could not find the current player. Please refresh and rejoin the room.'); return; }
  if(!Array.isArray(user.team)) user.team=[];
  if(!(state.acceptedPlayerNames instanceof Set)) state.acceptedPlayerNames=asSet(state.acceptedPlayerNames);
  let picked={...currentCandidate};
  if(state.challengePreset === 'leaguelegends'){
    if(!picked.legendRole){ setMessage('Choose an empty pitch slot first.'); return; }
    picked = adjustLegend(picked, picked.legendRole);
  }
  user.team.push(picked);
  state.acceptedPlayerNames.add(state.challengePreset==='leaguelegends'?playerKey(picked):picked.player);
  state.history = Array.isArray(state.history) ? state.history : [];
  state.history.push({user:user.name,decision:'ACCEPT',player:picked});
  currentCandidate=null;
  if(isGameComplete()){
    completeGame(); renderGame(); await saveOnlineState('Game complete. Reveal ratings to see the winner.'); return;
  }
  moveToNextUser();
  renderGame();
  clearCandidate(online.enabled ? 'Waiting for the next player to pick.' : 'Click Pick player to continue.');
  if(!online.enabled) await pickRandomPlayer(); else await saveOnlineState('Next turn: '+(currentUser()?.name || 'player')+'. Pick a player to continue.');
}

async function declinePlayer(){
  if(!state || !currentCandidate || state.gameMode!=='draft') return;
  if(online.enabled && !currentPlayerCanAct()) return applyOnlinePermissions();
  const user=currentUser();
  if(!user){ setMessage('Could not find the current player. Please refresh and rejoin the room.'); return; }
  if(!(user.declinedNames instanceof Set)) user.declinedNames=asSet(user.declinedNames);
  user.declines=Number(user.declines||0);
  if(user.declines>=DECLINES_ALLOWED){ setMessage(user.name + ' has no declines left and must accept this player.'); return; }
  user.declines++;
  user.declinedNames.add(state.challengePreset==='leaguelegends'?playerKey(currentCandidate):currentCandidate.player);
  state.history = Array.isArray(state.history) ? state.history : [];
  state.history.push({user:user.name,decision:'DECLINE',player:currentCandidate});
  currentCandidate=null;
  renderGame();
  clearCandidate(online.enabled ? 'Waiting for the next player to pick.' : 'Click Pick player to continue.');
  if(!online.enabled) await pickRandomPlayer(); else { moveToNextUser(); renderGame(); await saveOnlineState('Next turn: '+(currentUser()?.name || 'player')+'. Pick a player to continue.'); }
}

function multiplierForLegend(p, role){ if(p.naturalMainPosition==='GK') return role==='GK'?1:0; if(role==='GK') return 0; return Number(p.multipliers?.[role] ?? (role==='FWD'?p.multipliers?.ST:undefined) ?? 0.75); }
function adjustLegend(p, role){ const base=Number(p.baseRating || p.rating || 0), mult=multiplierForLegend(p, role), rating=Math.round(base*mult); return {...p, selectedRole:role, selectedRoleLabel:roleLabel(role), naturalPosition:(p.naturalPosition || p.position || roleLabel(p.naturalMainPosition)), mainPosition:role, rating, adjustedRating:rating, positionMultiplier:mult}; }
function completeGame(){ currentCandidate=null; clearCandidate('Game complete. Reveal ratings to see the winner.'); if(els.revealBtn){ els.revealBtn.classList.remove('hidden'); els.revealBtn.disabled=false; } updateButtons(); }
function updateButtons(){
  if(!state) return; const complete=isGameComplete(); const canAct=!online.enabled || currentPlayerCanAct();
  if(els.pickBtn) els.pickBtn.disabled = !canAct || !!currentCandidate || complete;
  if(els.acceptBtn) els.acceptBtn.disabled = !canAct || !currentCandidate || (state.challengePreset==='leaguelegends' && !currentCandidate.legendRole);
  if(els.declineBtn) els.declineBtn.disabled = !canAct || !currentCandidate || (currentUser()?.declines||0)>=DECLINES_ALLOWED;
  if(els.revealBtn){ els.revealBtn.classList.toggle('hidden', !complete || ratingsRevealed); els.revealBtn.disabled = !complete || ratingsRevealed; }
}
function buildSlots(user){ const mids=(user.team||[]).filter(p=>(p.selectedRole||p.mainPosition)==='MID'); return [ {label:'GK',player:(user.team||[]).find(p=>(p.selectedRole||p.mainPosition)==='GK'),role:'GK'}, {label:'DEF',player:(user.team||[]).find(p=>(p.selectedRole||p.mainPosition)==='DEF'),role:'DEF'}, {label:'MID',player:mids[0],role:'MID'}, {label:'MID',player:mids[1],role:'MID'}, {label:'FWD',player:(user.team||[]).find(p=>(p.selectedRole||p.mainPosition)==='FWD'),role:'FWD'} ]; }
function slotClass(i){ return ['gk','def','mid1','mid2','fwd'][i]; }
function shortName(name,max=22){ if(!name || name.length<=max) return name||''; const parts=name.split(' '); return parts.length>1 ? (parts[0][0]+'. '+parts.slice(1).join(' ')).slice(0,max) : name.slice(0,max-1)+'...'; }
function shortClub(club){ const map={'Manchester City':'Man City','Manchester United':'Man United','FC Barcelona':'Barcelona','Paris Saint-Germain':'PSG','Tottenham Hotspur':'Spurs','Bayern Munich':'Bayern'}; const out=map[club]||club||''; return out.length>18?out.slice(0,17)+'...':out; }
function renderPitch(slots, selectable=false){ return `<div class="pitch"><div class="penalty-box top"></div><div class="penalty-box bottom"></div>${slots.map((s,i)=>renderPitchPlayer(s,slotClass(i),selectable)).join('')}</div>`; }
function renderPitchPlayer(slot, cls, selectable){
  const role=slot.role||roleFromLabel(slot.label);
  const canSelect=selectable && !slot.player && currentCandidate && (currentCandidate.naturalMainPosition==='GK'?role==='GK':OUTFIELD_ROLES.includes(role));
  const selectedRole = !!(canSelect && currentCandidate?.legendRole === role);
  const mutedRole = !!(canSelect && currentCandidate?.legendRole && currentCandidate.legendRole !== role);
  if(!slot.player){ return `<button type="button" class="pitch-player ${cls} empty-slot ${canSelect?'selectable':''} ${selectedRole?'selected-role':''} ${mutedRole?'selection-muted':''}" ${canSelect?`data-place-role="${role}"`:''}><span class="pos">${roleLabel(role)}</span><span class="name">${selectedRole?'Selected position':(canSelect?'Place here':'Empty')}</span></button>`; }
  const p=slot.player, rating=ratingsRevealed?`<span class="rating">OVR ${p.rating}</span>`:'';
  return `<div class="pitch-player ${cls}"><span class="pos">${roleLabel(role)}</span><span class="name">${esc(shortName(p.player))}</span><span class="club">${esc(shortClub(p.club))}</span><span class="year">${p.year || ''} ${rating}</span></div>`;
}
function renderGame(){
  if(!state) return;
  prepareGamePanel();
  ensureInGameRestartButton();
  const user=currentUser();
  const isBid = state.gameMode === 'bid';
  show(els.draftControls, !isBid);
  show(els.bidControls, isBid);
  show(els.declinesPill, state.gameMode==='draft');
  show(els.budgetPill, isBid && !online.enabled);
  if(els.draftControls){
    if(isBid) els.draftControls.style.setProperty('display','none','important');
    else els.draftControls.style.removeProperty('display');
  }
  if(els.turnEyebrow) els.turnEyebrow.textContent = state.challengeName || (online.enabled ? 'Online draft' : 'Solo Challenge');
  if(els.currentUserLabel) els.currentUserLabel.textContent = isBid && online.enabled ? 'Make your bid' : (online.enabled ? (user?.name||'') : 'Build your team');
  if(els.declinesLeft) els.declinesLeft.textContent = DECLINES_ALLOWED - (user?.declines||0);
  if(els.currentBudgetLeft) els.currentBudgetLeft.textContent = GBP + (user?.budget||0) + 'm';
  renderTeams();
  renderPoolNote();
  updateButtons();
  if(online.enabled) applyOnlinePermissions(); else { const note=$('turnLockNote'); if(note) note.remove(); }
  if(isBid) renderBidControls();
}

function ensureInGameRestartButton(){
  const turnRow = document.querySelector('.draft-card .turn-row');
  if (!turnRow) return;
  let btn = $('inGameRestartBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'inGameRestartBtn';
    btn.type = 'button';
    btn.className = 'btn btn-secondary in-game-restart-btn';
    btn.textContent = 'Restart';
    btn.addEventListener('click', safe(restartToModeLobby));
    turnRow.appendChild(btn);
  }
  const showRestart = !!state && !ratingsRevealed && (!online.enabled || online.isHost);
  btn.classList.toggle('hidden', !showRestart);
}
function renderPoolNote(){
  if(!els.message) return; let note=$('activePoolNote'); if(!note){ note=document.createElement('div'); note.id='activePoolNote'; note.className='active-pool'; els.message.insertAdjacentElement('afterend', note); }
  if(state?.challengePreset === 'leaguelegends'){ note.textContent=''; note.classList.add('hidden'); return; }
  note.classList.remove('hidden');
  if(state.challengePreset==='ultimate') note.textContent='Active player pool: All years (2005 - 2026)';
  else if(state.challengePreset==='easy') note.textContent='Active player pool: Elite players only';
  else if(state.challengePreset==='league') note.textContent='Active player pool: ' + (state.leagueSelection?.labels||[]).join(', ');
  else if(state.challengePreset==='worldcup') note.textContent='Active player pool: World Cup 2026';
  else if(state.yearRange) note.textContent='Active player pool: ' + state.yearRange.start + ' - ' + state.yearRange.end;
  else note.textContent='Active player pool: All eligible players';
}
function renderTeams(){
  if(!els.teamsContainer || !state) return; if(online.enabled) els.teamsContainer.classList.add('teams-scroll'); else els.teamsContainer.classList.remove('teams-scroll');
  els.teamsContainer.innerHTML = state.users.map((u,ix)=>{ const total=(u.team||[]).reduce((sum,p)=>sum+Number(p.rating||0),0), needs=getNeededPositions(u).map(roleLabel).join(', '), displayName=(u.name==='You'?'':u.name); return `<article class="team-card"><div class="team-top-row"><div>${displayName?`<h3>${esc(displayName)}</h3>`:''}<div class="team-meta">${needs?'Positions Remaining: '+needs:'Complete'}</div></div><div class="score">${ratingsRevealed?total:'Score Hidden'}</div></div>${renderPitch(buildSlots(u), state.challengePreset==='leaguelegends' && ix===0)}<div class="score">${state.gameMode==='draft'?'Declines used: '+(u.declines||0)+'/'+DECLINES_ALLOWED:'Skips used: '+(u.bidSkips||0)+'/'+BID_SKIPS_ALLOWED}</div></article>`; }).join('');
  els.teamsContainer.querySelectorAll('[data-place-role]').forEach(btn=>btn.addEventListener('click',()=>{ if(currentCandidate){ currentCandidate.legendRole=btn.dataset.placeRole; renderCandidate(currentCandidate); renderGame(); } }));
}
function currentPlayerCanAct(){ if(!online.enabled) return true; const user=currentUser(); return !!user && safeKey(user.name)===safeKey(online.myName); }
function applyOnlinePermissions(){
  if(!online.enabled || !state) return;
  let note=$('turnLockNote');
  if(!note && els.message){
    note=document.createElement('div');
    note.id='turnLockNote';
    note.className='turn-note';
    els.message.insertAdjacentElement('afterend',note);
  }
  if(isGameComplete()){
    if(note){ note.textContent=''; note.classList.add('hidden'); }
    updateButtons();
    return;
  }
  if(note){
    note.classList.remove('hidden');
    if(state.gameMode==='bid') note.textContent=currentPlayerCanAct()?'Follow the bidding panel.':'Waiting for '+(currentUser()?.name||'the current player')+'.';
    else note.textContent=currentPlayerCanAct()?'Your turn. Accept or decline the player shown.':'Waiting for '+(currentUser()?.name||'the current player')+'.';
  }
  updateButtons();
}


// ---------- Local and online bidding ----------
function eligibleBidUsers(candidate=currentCandidate){ if(!state||!candidate) return []; return state.users.filter(u=>getNeededPositions(u).includes(candidate.mainPosition) && Number(u.budget||0)>0); }
function bidSkipsLeft(u){ return Math.max(0, BID_SKIPS_ALLOWED - Number(u?.bidSkips||0)); }
function minReserveAfterWin(u,c=currentCandidate){ return Math.max(0, getNeededPositions(u).length - (getNeededPositions(u).includes(c?.mainPosition)?1:0)); }
function maxBid(u,c=currentCandidate){ return Math.max(0, Math.floor(Number(u?.budget||0)) - minReserveAfterWin(u,c)); }
async function bidRandomPlayer(){
  if(!state || state.gameMode!=='bid') return;
  if(isGameComplete()) return completeGame(); if(currentCandidate){ setMessage('Award or skip the current player first.'); return; }
  const needed=new Set(); state.users.forEach(u=>getNeededPositions(u).forEach(p=>needed.add(p))); const pool=activePool().filter(p=>needed.has(p.mainPosition)&&!state.acceptedPlayerNames.has(p.player));
  if(!pool.length){ completeGame(); return; } currentCandidate={...pick(pool)}; state.blindBids={}; state.liveAuction=createLiveAuctionState(currentCandidate); renderCandidate(currentCandidate); setMessage((online.bidMode==='live'?'Live auction':'Blind bidding')+' open for '+currentCandidate.player+'.'); renderGame(); await saveOnlineState(els.message?.textContent || 'Next player ready.');
}
function wholeNumberBidValue(inputId){
  const raw = String($(inputId)?.value ?? '').trim();
  if(raw === '') return 0;
  if(!/^\d+$/.test(raw)) throw new Error('Only whole number bids are allowed.');
  return Math.floor(Number(raw));
}
function currentBlindBidderKey(){
  if(!state || !currentCandidate) return '';
  const eligibleKeys = new Set(eligibleBidUsers().map(u=>safeKey(u.name)));
  const ordered = Array.isArray(state.bidOrder) && state.bidOrder.length ? state.bidOrder.map(i=>state.users[i]).filter(Boolean) : state.users;
  const next = ordered.find(u => eligibleKeys.has(safeKey(u.name)) && !state.blindBids?.[safeKey(u.name)]?.submitted);
  return next ? safeKey(next.name) : '';
}
function renderBidControls(){ if(!state||state.gameMode!=='bid') return; online.enabled ? renderOnlineBidControls() : renderLocalBidControls(); }
function renderLocalBidControls(){
  // streamlined host/local retained for compatibility
  if(!els.bidInputs) return; if(!currentCandidate){ els.bidInputs.innerHTML='<p class="muted">Randomise a player to enter bids.</p>'; return; }
  const eligible=new Set(eligibleBidUsers().map(u=>safeKey(u.name)));
  els.bidInputs.innerHTML=state.users.map((u,i)=>`<div class="bid-row"><label for="bidUser${i}">${esc(u.name)}<span class="bid-help">Budget left: ${money(u.budget)} • Skips left: ${bidSkipsLeft(u)}/${BID_SKIPS_ALLOWED}</span></label><input id="bidUser${i}" type="number" min="0" max="${u.budget}" value="0" ${eligible.has(safeKey(u.name))?'':'disabled'}></div>`).join('');
}
async function awardHighestBid(){ if(online.enabled||!currentCandidate) return; const eligible=eligibleBidUsers(); let best=null; eligible.forEach(u=>{const i=state.users.indexOf(u),b=Number($('bidUser'+i)?.value||0); if(b>0&&b<=u.budget&&(!best||b>best.bid)) best={u,bid:b}; else if(b<=0) u.bidSkips=Math.min(BID_SKIPS_ALLOWED,(u.bidSkips||0)+1);}); if(best){best.u.team.push({...currentCandidate,price:best.bid});best.u.budget-=best.bid;best.u.spent+=best.bid;state.acceptedPlayerNames.add(currentCandidate.player);setMessage(best.u.name+' won '+currentCandidate.player+' for '+money(best.bid)+'.');} currentCandidate=null; if(isGameComplete()) completeGame(); else clearCandidate('Click Randomise player to continue.'); renderGame(); }
async function skipBidPlayer(){ if(online.enabled||!currentCandidate)return; eligibleBidUsers().forEach(u=>u.bidSkips=Math.min(BID_SKIPS_ALLOWED,(u.bidSkips||0)+1)); currentCandidate=null; clearCandidate('Player skipped. Click Randomise player to continue.'); renderGame(); }
function renderOnlineBidControls(){
  if(!els.bidInputs) return; show(els.draftControls,false); if(els.draftControls) els.draftControls.style.setProperty('display','none','important'); show(els.bidControls,true); show(els.budgetPill,false); if(els.bidPickBtn) els.bidPickBtn.classList.add('hidden'); if(els.awardBidBtn) els.awardBidBtn.classList.add('hidden'); if(els.skipBidBtn) els.skipBidBtn.classList.add('hidden');
  if(!currentCandidate){ els.bidInputs.innerHTML = isGameComplete()?'<p class="muted">Bidding complete. Reveal ratings to see the winner.</p>':'<p class="muted">Waiting for the next player...</p>'; return; }
  if(state.onlineBidMode==='live') return renderLiveAuctionControls();
  renderBlindBidControls();
}
function currentOnlineUser(){ return state?.users.find(u=>safeKey(u.name)===safeKey(online.myName)); }
function renderBlindBidControls(){
  state.blindBids = state.blindBids || {};
  const eligible=eligibleBidUsers(), keys=new Set(eligible.map(u=>safeKey(u.name))), me=currentOnlineUser(), myKey=safeKey(online.myName), already=state.blindBids?.[myKey]?.submitted;
  const submitted=eligible.filter(u=>state.blindBids?.[safeKey(u.name)]?.submitted).length;
  if(els.bidOrderDisplay) els.bidOrderDisplay.innerHTML=`<div class="bid-status-summary"><strong>Blind bidding</strong><span>${submitted}/${eligible.length} eligible bids submitted • all eligible users can bid now</span></div>`;
  const can=me&&keys.has(myKey)&&!already;
  const waitingText = already ? 'Your bid has been submitted. Waiting for the other eligible players.' : (keys.has(myKey) ? 'Submit your private bid for this player.' : 'You are not eligible for this player.');
  const action=can?`<div class="bid-order-card online-action-card"><p class="eyebrow">Your bid</p><h3>${esc(currentCandidate.player)}</h3><p class="muted">Everyone eligible can bid now. Enter a whole-number bid. £0 or Skip uses one of your 3 skips.</p><div class="bid-row"><label>Bid amount<span class="bid-help">Budget: ${money(me.budget)} • Max: ${money(maxBid(me))} • Skips left: ${bidSkipsLeft(me)}/${BID_SKIPS_ALLOWED}</span></label><input id="onlineBlindBidInput" type="number" min="0" step="1" max="${maxBid(me)}" value="0"></div><div class="online-bid-actions"><button id="submitBlindBidBtn" class="btn btn-primary">Submit bid</button><button id="skipBlindBidBtn" class="btn btn-deep">Skip</button></div></div>`:`<div class="bid-order-card online-action-card disabled-action"><p class="eyebrow">Blind bidding</p><h3>${esc(currentCandidate.player)}</h3><p class="muted">${waitingText}</p><div class="bid-row"><label>Bid amount<span class="bid-help">${already?'Bid submitted':'Not available'}</span></label><input type="number" value="" disabled placeholder="Locked"></div><div class="online-bid-actions"><button class="btn btn-primary" disabled>Submit bid</button><button class="btn btn-deep" disabled>Skip</button></div></div>`;
  const status=state.users.map(u=>{const k=safeKey(u.name);let label='Not eligible',cls='';if(state.blindBids?.[k]?.submitted){label='Bid submitted';cls='good'}else if(keys.has(k)){label='Can bid';cls='good'}return `<div class="live-status-row"><strong>${esc(u.name)}<small class="bid-help">Budget: ${money(u.budget)} • Max: ${money(maxBid(u))} • Skips: ${bidSkipsLeft(u)}/${BID_SKIPS_ALLOWED}</small></strong><span class="live-pill ${cls}">${esc(label)}</span></div>`}).join('');
  els.bidInputs.innerHTML=action+`<div class="bid-order-card"><p class="eyebrow">Players</p>${status}</div>`;
  $('submitBlindBidBtn')?.addEventListener('click', safe(()=>submitBlindBid(false)));
  $('skipBlindBidBtn')?.addEventListener('click', safe(()=>submitBlindBid(true)));
}
async function submitBlindBid(forceSkip=false){
  const me=currentOnlineUser(); if(!me||!currentCandidate) return;
  state.blindBids = state.blindBids || {};
  const bid=forceSkip ? 0 : wholeNumberBidValue('onlineBlindBidInput');
  if(bid>maxBid(me)) throw new Error('Your maximum bid is '+money(maxBid(me))+'.');
  if(bid<=0&&bidSkipsLeft(me)<=0) throw new Error('You have used all 3 skips and must bid above zero.');
  state.blindBids[safeKey(me.name)]={name:me.name,bid,submitted:true,submittedAt:Date.now()};
  if(eligibleBidUsers().every(u=>state.blindBids?.[safeKey(u.name)]?.submitted)) await resolveBlindBid();
  else { renderGame(); await saveOnlineState(me.name+' submitted a blind bid.'); }
}

async function resolveBlindBid(){
  if(!currentCandidate) return;
  const cand={...currentCandidate};
  const bids=eligibleBidUsers(cand).map(u=>({user:u,bid:Number(state.blindBids?.[safeKey(u.name)]?.bid||0)}));
  bids.forEach(r=>{ if(r.bid<=0) r.user.bidSkips=Math.min(BID_SKIPS_ALLOWED,(r.user.bidSkips||0)+1); });
  const valid=bids.filter(r=>r.bid>0&&r.bid<=maxBid(r.user,cand)).sort((a,b)=>b.bid-a.bid);
  if(valid.length){
    const top=valid.filter(r=>r.bid===valid[0].bid); const win=pick(top);
    win.user.team.push({...cand,price:win.bid}); win.user.budget-=win.bid; win.user.spent+=win.bid; state.acceptedPlayerNames.add(cand.player);
    setMessage(win.user.name+' won '+cand.player+' for '+money(win.bid)+'.');
  } else setMessage(cand.player+' was skipped.');
  currentCandidate=null;
  if(isGameComplete()){ completeGame(); await saveOnlineState('Bidding complete. Reveal ratings to see the winner.'); return; }
  await bidRandomPlayer();
}

function createLiveAuctionState(candidate=currentCandidate){
  const users = Array.isArray(state?.users) ? state.users : [];
  const baseOrder = Array.isArray(state?.bidOrder) && state.bidOrder.length ? state.bidOrder.map(i=>users[i]).filter(Boolean) : users;
  const start = Number(state?.liveAuctionStartIndex || 0) % Math.max(1, baseOrder.length || 1);
  const rotatedUsers = baseOrder.slice(start).concat(baseOrder.slice(0,start));
  if(state) state.liveAuctionStartIndex = (start + 1) % Math.max(1, baseOrder.length || 1);
  const eligibleKeys = new Set(eligibleBidUsers(candidate).map(u=>safeKey(u.name)));
  const order = rotatedUsers.map(u=>safeKey(u.name)).filter(k=>eligibleKeys.has(k));
  return { passed:{}, noFirst:{}, order, turnIndex:0, highestKey:'', highestName:'', highestBid:0, outcome:null };
}

function currentLiveBidderKey(auction=state?.liveAuction){
  if(!auction?.order?.length) return '';
  const eligibleKeys = new Set(eligibleBidUsers().map(u=>safeKey(u.name)));
  const minBid = Math.max(1, Number(auction.highestBid||0)+1);
  for(let i=0;i<auction.order.length;i++){
    const idx=(Number(auction.turnIndex||0)+i)%auction.order.length;
    const key=auction.order[idx];
    const user=state.users.find(u=>safeKey(u.name)===key);
    if(user && eligibleKeys.has(key) && !auction.passed?.[key] && auction.highestKey!==key && maxBid(user)>=minBid) return key;
  }
  return '';
}
function advanceLiveTurn(){
  const auction=state.liveAuction;
  if(!auction?.order?.length) return;
  const current=currentLiveBidderKey(auction);
  if(!current) return;
  const currentIndex=auction.order.indexOf(current);
  auction.turnIndex=(currentIndex+1)%auction.order.length;
}
function normaliseLiveAuction(){
  state.liveAuction = state.liveAuction || createLiveAuctionState(currentCandidate);
  const auction=state.liveAuction;
  auction.passed = auction.passed || {};
  auction.noFirst = auction.noFirst || {};
  auction.order = Array.isArray(auction.order) && auction.order.length ? auction.order : shuffle(eligibleBidUsers().map(u=>safeKey(u.name)));
  auction.turnIndex = Number(auction.turnIndex || 0);
  auction.highestKey = auction.highestKey || '';
  auction.highestName = auction.highestName || '';
  auction.highestBid = Number(auction.highestBid || 0);
  return auction;
}

function renderLiveAuctionControls(){
  const auction=normaliseLiveAuction();
  const eligible=eligibleBidUsers(), keys=new Set(eligible.map(u=>safeKey(u.name))), me=currentOnlineUser(), myKey=safeKey(online.myName), turnKey=currentLiveBidderKey(auction), turnUser=state.users.find(u=>safeKey(u.name)===turnKey);
  const orderNames=(auction.order||[]).map(k=>state.users.find(u=>safeKey(u.name)===k)?.name).filter(Boolean).join(' → ');
  if(els.bidOrderDisplay) els.bidOrderDisplay.innerHTML=`<div class="bid-status-summary"><strong>Live auction</strong><span>${auction.highestBid>0?'Highest: '+money(auction.highestBid)+' by '+esc(auction.highestName):'No bids yet'}${turnUser?' • Turn: '+esc(turnUser.name):''}</span></div>`;
  const hasPassed=!!auction.passed?.[myKey], isHighest=auction.highestKey===myKey, can=me&&keys.has(myKey)&&turnKey===myKey&&!hasPassed&&!isHighest, minBid=Math.max(1,auction.highestBid+1), canAffordNext=me?maxBid(me)>=minBid:false;
  const action=can&&canAffordNext?`<div class="bid-order-card online-action-card"><p class="eyebrow">Your turn</p><h3>${esc(currentCandidate.player)}</h3><p class="muted">Bid above the current highest bid, or Skip. If you have already bid on this player, passing will not use a skip.</p><div class="bid-row"><label>Bid amount<span class="bid-help">Budget: ${money(me.budget)} • Max: ${money(maxBid(me))} • Skips left: ${bidSkipsLeft(me)}/${BID_SKIPS_ALLOWED}</span></label><input id="onlineLiveBidInput" type="number" min="${minBid}" step="1" max="${maxBid(me)}" value="${Math.min(maxBid(me),minBid)}"></div><div class="online-bid-actions"><button id="submitLiveBidBtn" class="btn btn-primary">Place bid</button><button id="passLiveBidBtn" class="btn btn-deep">Skip / Pass</button></div></div>`:`<div class="bid-order-card online-action-card"><p class="eyebrow">Live auction</p><p class="muted">${turnUser?'Waiting for '+esc(turnUser.name)+'.':auction.highestBid>0?'Auction resolving...':'No eligible players for this auction.'}${isHighest?' You are currently highest bidder.':''}${hasPassed?' You have passed on this player.':''}${me&&turnKey===myKey&&!canAffordNext?' You cannot beat the current bid, so this will not count as a skip.':''}</p></div>`;
  const status=state.users.map(u=>{const k=safeKey(u.name);let txt='Not eligible',cls='';if(auction.highestKey===k){txt='Highest '+money(auction.highestBid);cls='high'}else if(auction.passed?.[k]){txt=auction.noFirst?.[k]?'Skipped':'Passed';cls='bad'}else if(k===turnKey){txt='Current turn';cls='good'}else if(keys.has(k)){txt='Waiting';cls=''}return `<div class="live-status-row"><strong>${esc(u.name)}<small class="bid-help">Budget: ${money(u.budget)} • Max: ${money(maxBid(u))} • Skips: ${bidSkipsLeft(u)}/${BID_SKIPS_ALLOWED}</small></strong><span class="live-pill ${cls}">${esc(txt)}</span></div>`}).join('');
  els.bidInputs.innerHTML=action+`<div class="bid-order-card"><p class="eyebrow">Auction order</p>${orderNames?`<p class="muted auction-order-line">${esc(orderNames)}</p>`:''}${status}</div>`;
  $('submitLiveBidBtn')?.addEventListener('click',safe(submitLiveBid));
  $('passLiveBidBtn')?.addEventListener('click',safe(passLiveBid));
}
async function submitLiveBid(){
  const me=currentOnlineUser(), auction=normaliseLiveAuction(); if(!me||!auction||!currentCandidate) return;
  if(currentLiveBidderKey(auction)!==safeKey(me.name)) throw new Error('It is not your turn to bid.');
  const bid=wholeNumberBidValue('onlineLiveBidInput');
  if(bid<=0) return passLiveBid();
  if(bid<auction.highestBid+1) throw new Error('Bid must be at least '+money(auction.highestBid+1)+'.');
  if(bid>maxBid(me)) throw new Error('Your maximum bid is '+money(maxBid(me))+'.');
  const candidateName=currentCandidate.player;
  auction.highestKey=safeKey(me.name); auction.highestName=me.name; auction.highestBid=bid; advanceLiveTurn();
  const resolved=await maybeResolveLiveAuction();
  if(!resolved){ renderGame(); await saveOnlineState(me.name+' bid '+money(bid)+' for '+candidateName+'.'); }
}
async function passLiveBid(){
  const me=currentOnlineUser(), auction=normaliseLiveAuction(), k=safeKey(me?.name); if(!me||!auction||!currentCandidate) return;
  if(currentLiveBidderKey(auction)!==k) throw new Error('It is not your turn to pass.');
  const candidateName=currentCandidate.player;
  const minBid=Math.max(1,auction.highestBid+1);
  const canPhysicallyBid = eligibleBidUsers().some(u=>safeKey(u.name)===k) && maxBid(me)>=minBid;
  const hasAlreadyBid = auction.highestKey===k || Number(auction.highestBid||0)>0;
  if(canPhysicallyBid && !hasAlreadyBid){ if(bidSkipsLeft(me)<=0) throw new Error('You have used all 3 skips and must bid above zero.'); me.bidSkips=Math.min(BID_SKIPS_ALLOWED,(me.bidSkips||0)+1); auction.noFirst[k]=true; }
  auction.passed[k]=true; advanceLiveTurn();
  const resolved=await maybeResolveLiveAuction();
  if(!resolved){ renderGame(); await saveOnlineState(me.name+' passed on '+candidateName+'.'); }
}

async function maybeResolveLiveAuction(){
  const auction=normaliseLiveAuction(), eligible=eligibleBidUsers();
  if(!auction || !currentCandidate) return false;
  const active=eligible.filter(u=>!auction.passed?.[safeKey(u.name)] && auction.highestKey!==safeKey(u.name) && maxBid(u)>=Math.max(1,auction.highestBid+1));
  if(active.length>0) return false;
  const cand={...currentCandidate};
  if(auction.highestBid>0){
    const win=state.users.find(u=>safeKey(u.name)===auction.highestKey);
    if(win){ win.team.push({...cand,price:auction.highestBid}); win.budget-=auction.highestBid; win.spent+=auction.highestBid; state.acceptedPlayerNames.add(cand.player); setMessage(win.name+' won '+cand.player+' for '+money(auction.highestBid)+'.'); }
  } else setMessage(cand.player+' was skipped.');
  currentCandidate=null;
  if(isGameComplete()){ completeGame(); await saveOnlineState('Bidding complete. Reveal ratings to see the winner.'); return true; }
  await bidRandomPlayer(); return true;
}



// ---------- Online lobby ----------
function ensureLobby(){
  let l=$('onlineLobbyPanel');
  if(l) return l;
  l=document.createElement('section');
  l.id='onlineLobbyPanel';
  l.className='card lobby-card online-lobby-card hidden';
  (document.querySelector('.app-shell')||document.body).insertBefore(l, els.gamePanel || null);
  return l;
}
function showLobby(mode, participants=[], invite=''){
  injectStyles();
  hideAllPanels();
  const lobby=ensureLobby();
  const names=participants.length?participants:[online.myName].filter(Boolean);
  lobby.className='card lobby-card online-lobby-card';
  show(lobby,true);
  if(els.resetBtn) els.resetBtn.style.display='';
  const joinedHtml = names.map(n=>`<span class="joined-pill">${esc(n)}</span>`).join('');
  if(mode==='host') lobby.innerHTML=`
    <div class="online-lobby-header">
      <p class="eyebrow">Online room created</p>
      <h2>Waiting for players to join</h2>
      <p class="muted">Joined players appear below. When everyone is in, choose the game mode and start.</p>
      <div class="lobby-code">${esc(online.roomId)}</div>
      <p class="lobby-link">${esc(invite)}</p>
      <button id="copyInviteBtn" class="btn btn-secondary" type="button">Copy invite link</button>
      <div class="joined-list">${joinedHtml}</div>
    </div>
    <div class="online-lobby-setup">
      <p class="online-lobby-section-title">Start online game</p>
      <div class="online-mode-grid">
        <button type="button" class="lobby-mode-card ${selectedGameMode==='draft'?'selected':''}" data-lobby-mode="draft">
          <strong>Ultimate Draft 5-a-side</strong>
          <span>Random user order. Each player accepts or declines players, with 3 declines maximum.</span>
        </button>
        <button type="button" class="lobby-mode-card ${selectedGameMode==='bid'?'selected':''}" data-lobby-mode="bid">
          <strong>Bid for your Ultimate 5-a-side Team</strong>
          <span>Choose Blind Bidding or Live Auction. Whole-number bids only. £0 bids count as skips.</span>
        </button>
      </div>
      ${yearSlicerHtml(false)}
      <label class="lobby-checkbox ${selectedGameMode==='bid'?'hidden':''}"><input id="lobbyExcludeDeclines" type="checkbox" checked> Exclude declined players</label>
      ${selectedGameMode==='bid'?`<div class="online-bid-style-box"><h3>Online bidding style</h3><div class="online-mode-grid"><button type="button" class="lobby-mode-card ${online.bidMode==='blind'?'selected':''}" data-online-bid="blind"><strong>Blind bidding</strong><span>Everyone submits privately at the same time. Highest bid wins. Ties randomise the winner.</span></button><button type="button" class="lobby-mode-card ${online.bidMode==='live'?'selected':''}" data-online-bid="live"><strong>Live auction</strong><span>Random order. Players bid one after another until the highest eligible bid wins.</span></button></div></div>`:''}
      <button id="startOnlineGameBtn" class="btn btn-primary online-start-btn" type="button">Start online game</button>
    </div>`;
  else lobby.innerHTML=`
    <div class="online-lobby-header">
      <p class="eyebrow">Online room joined</p>
      <h2>Waiting for the host</h2>
      <p class="muted">You joined as <strong>${esc(online.myName)}</strong>. Keep this page open while the host sets up the game.</p>
      <div class="lobby-code">${esc(online.roomId)}</div>
      <div class="joined-list">${joinedHtml}</div>
    </div>`;
  wireYearSlicer(lobby);
  $('copyInviteBtn')?.addEventListener('click',()=>navigator.clipboard?.writeText(invite));
  lobby.querySelectorAll('[data-lobby-mode]').forEach(b=>b.addEventListener('click',()=>{selectedGameMode=b.dataset.lobbyMode;showLobby('host',names,invite)}));
  lobby.querySelectorAll('[data-online-bid]').forEach(b=>b.addEventListener('click',()=>{online.bidMode=b.dataset.onlineBid;showLobby('host',names,invite)}));
  $('startOnlineGameBtn')?.addEventListener('click', safe(startOnlineFromLobby));
}

async function startOnlineFromLobby(){
  await ensurePlayersReady(); const snap=await online.ref.child('participants').once('value'); const names=Object.values(snap.val()||{}); if(selectedGameMode==='bid' && names.length<2) throw new Error('Bid mode needs at least 2 players.');
  const lobbyPanel=$('onlineLobbyPanel'); const ys=lobbyPanel?.querySelector('#yearStart'), ye=lobbyPanel?.querySelector('#yearEnd'); if(ys&&ye) selectedYearRange=clampRange(ys.value, ye.value); state=baseState(selectedGameMode,names.slice(0,4),true); state.yearRange=selectedYearRange?{start:selectedYearRange.start,end:selectedYearRange.end}:null; state.excludeDeclines=!!$('lobbyExcludeDeclines')?.checked; state.challengePreset='online'; state.challengeName=selectedGameMode==='bid' ? (online.bidMode==='live'?MODE_LABELS.onlineLive:MODE_LABELS.onlineBlind) : MODE_LABELS.onlineDraft; state.onlineBidMode=online.bidMode;
  recordStatsEvent('game_start', state.challengeName, { source:'online_start', roomId:online.roomId, playerCount:names.slice(0,4).length, onlineBidMode:online.bidMode || '' });
  ratingsRevealed=false; currentCandidate=null; hideAllPanels(); show(els.gamePanel,true); prepareGamePanel(); renderGame(); await saveOnlineState('Online game started.'); if(selectedGameMode==='bid') await bidRandomPlayer();
}

// ---------- Results, summary image and leaderboard saving ----------
function finalScores(){ return (state?.users||[]).map(u=>({user:u,total:(u.team||[]).reduce((s,p)=>s+Number(p.rating||0),0)})).sort((a,b)=>b.total-a.total); }
async function revealScores(){ ratingsRevealed=true; currentCandidate=null; showFinishedResults(); await recordCompletedModeStats(leaderboardMode(), { source:'standard_result' }); await saveOnlineState('Scores revealed.'); }
function showFinishedResults(){
  if(!state) return; hideAllPanels(); show(els.resultsPanel,true); if(els.resultsPanel) els.resultsPanel.classList.add('finished-results-page'); if(els.resetBtn) els.resetBtn.style.display=''; renderResults();
}
function renderResults(){
  const scored=finalScores(), top=scored[0]?.total||0, isOnline=!!state?.isOnlineGame;
  const ordinal=n=>n===1?'1st':n===2?'2nd':n===3?'3rd':n+'th';
  const header=document.querySelector('#resultsPanel .section-title-row');
  if(header) header.innerHTML=`<div class="finished-hero"><p class="eyebrow">${esc(state.challengeName||'Solo Challenge')}</p><h2>${isOnline?'Final results':'Your final score'}</h2><p class="muted">Ratings are revealed. ${isOnline?'Teams are ranked below.':'Here is your completed 5-a-side score.'}</p><div class="winner-badge-large"><span>${isOnline?'Winner score:':'Score:'}</span><span class="score-number">${top}</span></div><div class="finished-actions"><button id="submitLeaderboardFinal" class="btn btn-primary">Submit to leaderboard</button><button id="shareSummaryBtn" class="btn btn-deep">Share summary</button><button id="saveSummaryBtn" class="btn btn-deep">Save picture</button><button id="resetBtnResults" class="btn btn-deep">Restart</button></div></div>`;
  if(els.resultsContainer){
    els.resultsContainer.className='finished-results-grid';
    els.resultsContainer.innerHTML=scored.map((row,idx)=>`<article class="finished-team-card ${idx===0?'winner':''} ${isOnline&&idx===0?'result-gold-winner':''}">${isOnline?`<div class="result-rank-badge ${idx===0?'gold':''}">${ordinal(idx+1)}</div>`:''}<div class="finished-team-top pro-score-header"><div><p class="eyebrow">Final score</p><h3>${esc(row.user.name)}</h3></div><div class="finished-score-card"><span>Score</span><strong>${row.total}</strong></div></div>${renderPitch(buildSlots(row.user))}<div class="finished-player-list">${(row.user.team||[]).map(p=>`<div class="finished-player-row"><span class="finished-pos">${roleLabel(p.selectedRole||p.mainPosition)}</span><span><span class="finished-player-name">${esc(p.player)}</span><span class="finished-player-meta">${esc(shortClub(p.club))}${p.year?' - '+p.year:''}</span></span><span class="finished-player-rating">${p.rating}</span></div>`).join('')}</div></article>`).join('');
  }
  $('submitLeaderboardFinal')?.addEventListener('click', safe(submitCurrentScore)); $('shareSummaryBtn')?.addEventListener('click', safe(shareSummaryImage)); $('saveSummaryBtn')?.addEventListener('click', safe(saveSummaryImage)); $('resetBtnResults')?.addEventListener('click', safe(restartToModeLobby));
}

function leaderboardMode(){ if(state?.challengePreset==='leaguelegends') return MODE_LABELS.leaguelegends; if(state?.challengePreset==='worldcup') return MODE_LABELS.worldcup; if(state?.challengePreset==='easy') return MODE_LABELS.easy; if(state?.challengePreset==='ultimate') return MODE_LABELS.ultimate; if(state?.challengePreset==='league') return MODE_LABELS.league; if(state?.isOnlineGame&&state.gameMode==='draft') return MODE_LABELS.onlineDraft; if(state?.isOnlineGame&&state.gameMode==='bid') return state.onlineBidMode==='live'?MODE_LABELS.onlineLive:MODE_LABELS.onlineBlind; return MODE_LABELS.solo; }
function statsModeKey(label){ return String(label || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }
function statsAlreadyRecordedKey(modeKey){ return 'statsRecorded_' + modeKey; }
const HOME_VISIT_COUNTER_PATH = 'stats/totals/pageViews/home';
const GAME_START_COUNTER_PATH = 'stats/totals/starts/total';
let homeVisitCounterListeners = [];
function numericVisitValue(value){
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
function formatCounterBlock(value, label){
  const firebaseValue = numericVisitValue(value);
  const rounded = Math.floor(firebaseValue / 500) * 500;
  return rounded.toLocaleString('en-GB') + '+ ' + label;
}
function formatPublicVisitCounter(value){
  return formatCounterBlock(value, 'total homepage visits');
}
function setHomeVisitCounterText(value){
  const el = $('homeVisitCounter');
  if(!el) return;
  el.textContent = formatPublicVisitCounter(value);
  el.classList.remove('visit-counter-loading');
}
function formatPublicGameStartCounter(value){
  return formatCounterBlock(value, 'games started');
}
function setGameStartCounterText(value){
  const el = $('gameStartCounter');
  if(!el) return;
  el.textContent = formatPublicGameStartCounter(value);
  el.classList.remove('visit-counter-loading');
}
function collectHomeVisitValues(node, values=[]){
  if(!node || typeof node !== 'object') return values;
  const direct = node?.totals?.pageViews?.home;
  if(Number.isFinite(Number(direct))) values.push(Number(direct));
  const statsDirect = node?.stats?.totals?.pageViews?.home;
  if(Number.isFinite(Number(statsDirect))) values.push(Number(statsDirect));
  Object.entries(node).forEach(([key, value]) => {
    if(key === 'home' && Number.isFinite(Number(value))) values.push(Number(value));
    else if(value && typeof value === 'object') collectHomeVisitValues(value, values);
  });
  return values;
}
async function readFirebaseNumberPath(path){
  const snap = await firebase.database().ref(path).once('value');
  return numericVisitValue(snap.val());
}
async function readFirebaseNumberPathByRest(path){
  try{
    const url = FIREBASE_CONFIG.databaseURL.replace(/\/$/, '') + '/' + path + '.json?cacheBust=' + Date.now();
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) return 0;
    return numericVisitValue(await res.json());
  }catch(error){
    console.warn('Home visit REST read failed for ' + path, error);
    return 0;
  }
}
async function getPublicCounterValue(path, baseline, label){
  const restValue = await readFirebaseNumberPathByRest(path);
  let sdkValue = 0;
  try{
    await ensureFirebase();
    sdkValue = await readFirebaseNumberPath(path);
  }catch(error){
    console.warn(label + ' Firebase SDK read failed. REST value will be used if available.', error);
  }
  const value = Math.max(baseline, restValue, sdkValue);
  console.info(label + ' lookup', { path, value, restValue, sdkValue });
  return Number.isFinite(value) ? value : baseline;
}
function getHomeVisitCounterValue(){
  return getPublicCounterValue(HOME_VISIT_COUNTER_PATH, 0, 'Home visit counter');
}
function getGameStartCounterValue(){
  return getPublicCounterValue(GAME_START_COUNTER_PATH, 0, 'Game start counter');
}
function stopHomeVisitCounterRealtime(){
  homeVisitCounterListeners.forEach(item => {
    try { item.ref.off('value', item.handler); } catch(error) { console.warn('Home visit counter listener could not be removed.', error); }
  });
  homeVisitCounterListeners = [];
}
async function startHomeVisitCounter(){
  const visitEl = $('homeVisitCounter');
  const gamesEl = $('gameStartCounter');
  if(!visitEl && !gamesEl) return;
  stopHomeVisitCounterRealtime();
  try{
    const [visitValue, gameStartValue] = await Promise.all([
      getHomeVisitCounterValue(),
      getGameStartCounterValue()
    ]);
    setHomeVisitCounterText(visitValue);
    setGameStartCounterText(gameStartValue);
    [
      { path:HOME_VISIT_COUNTER_PATH, setter:setHomeVisitCounterText },
      { path:GAME_START_COUNTER_PATH, setter:setGameStartCounterText }
    ].forEach(counter => {
      const ref = firebase.database().ref(counter.path);
      const handler = snap => counter.setter(numericVisitValue(snap.val()));
      ref.on('value', handler, error => console.warn('Public counter listener failed for ' + counter.path, error));
      homeVisitCounterListeners.push({ ref, handler });
    });
  }catch(error){
    console.warn('Public counters could not be loaded.', error);
      }
}
async function updateHomeVisitCounter(){
  const el = $('homeVisitCounter');
  if(!el) return;
  try{
    setHomeVisitCounterText(await getHomeVisitCounterValue());
  }catch(error){
    console.warn('Home visit counter could not be loaded.', error);
    }
}
async function recordStatsEvent(eventType, modeLabel='', extra={}){
  try{
    await ensureFirebase();
    const now = Date.now();
    const today = new Date().toISOString().slice(0,10);
    const inc = firebase.database.ServerValue.increment(1);
    const updates = {};
    const modeKey = modeLabel ? statsModeKey(modeLabel) : '';
    if(eventType === 'home_view'){
      // Use one authoritative home page-view counter.
      updates['stats/totals/pageViews/home'] = inc;
      updates['stats/daily/'+today+'/pageViews/home'] = inc;
      updates['stats/lastHomeViewAt'] = now;
    } else if(eventType === 'game_start'){
      if(!modeKey) return false;
      const recentRef = firebase.database().ref('stats/recent').push();
      updates['stats/modeLabels/'+modeKey] = modeLabel;
      updates['stats/lastStartedAt'] = now;
      updates['stats/lastStartedMode'] = modeLabel;
      updates['stats/totals/starts/total'] = inc;
      updates['stats/totals/starts/byMode/'+modeKey] = inc;
      updates['stats/daily/'+today+'/starts/total'] = inc;
      updates['stats/daily/'+today+'/starts/byMode/'+modeKey] = inc;
      updates['stats/recent/'+recentRef.key] = { eventType, modeKey, modeLabel, timestamp:now, ...extra };
    } else {
      return false;
    }
    await firebase.database().ref().update(updates);
    return true;
  }catch(error){
    console.warn('Stats event could not be recorded.', eventType, error);
    return false;
  }
}
async function normaliseLegacyStatsTotals(){
  try{
    await ensureFirebase();
    const rootRef = firebase.database().ref('stats');
    const snap = await rootRef.once('value');
    const data = snap.val() || {};
    if(data?.migrations?.mergedAllIntoTotal) return false;
    const all = Number(data?.totals?.all || 0);
    if(!all){
      await rootRef.child('migrations/mergedAllIntoTotal').set(true);
      return false;
    }
    const total = Number(data?.totals?.total || 0);
    await rootRef.update({
      'totals/total': all + total,
      'totals/all': null,
      'migrations/mergedAllIntoTotal': true,
      'migrations/mergedAllIntoTotalAt': Date.now()
    });
    return true;
  }catch(error){
    console.warn('Legacy stats totals could not be normalised.', error);
    return false;
  }
}
async function recordCompletedModeStats(modeLabel, extra={}){
  const modeKey = statsModeKey(modeLabel);
  if(!modeKey) return false;
  const store = playerSim || state || {};
  const recordedKey = statsAlreadyRecordedKey(modeKey);
  if(store[recordedKey]) return false;
  store[recordedKey] = true;
  try{
    await ensureFirebase();
    const now = Date.now();
    const today = new Date().toISOString().slice(0,10);
    const inc = firebase.database.ServerValue.increment(1);
    const recentRef = firebase.database().ref('stats/recent').push();
    const recentPayload = { modeKey, modeLabel, timestamp:now, ...extra };
    const updates = {};
    updates['stats/modeLabels/'+modeKey] = modeLabel;
    updates['stats/lastCompletedAt'] = now;
    updates['stats/lastCompletedMode'] = modeLabel;
    updates['stats/daily/'+today+'/lastCompletedAt'] = now;
    updates['stats/daily/'+today+'/byMode/'+modeKey] = inc;
    updates['stats/daily/'+today+'/total'] = inc;
    updates['stats/totals/byMode/'+modeKey] = inc;
    updates['stats/totals/total'] = inc;
    updates['stats/recent/'+recentRef.key] = recentPayload;
    await firebase.database().ref().update(updates);
    return true;
  }catch(error){
    store[recordedKey] = false;
    console.warn('Game completion stats could not be recorded.', error);
    return false;
  }
}

const LEADERBOARD_NAME_RULES = {
  min: 3,
  max: 18,
  allowed: /^[a-zA-Z0-9 _-]+$/,
  // Deliberately compact client-side blocklist. This is not a full moderation system,
  // but it catches obvious abusive/offensive entries before they reach Firebase.
  blocked: [
    'fuck','fuk','fck','shit','sh1t','cunt','cnut','twat','wank','bastard','b1tch','bitch',
    'nazi','hitler','kkk','nigger','nigga','retard','nonce','pedo','paedo','rape',
    'kill','suicide','terrorist','isis','heil','whore','slut'
  ]
};
function normaliseLeaderboardName(value){ return String(value || '').replace(/\s+/g,' ').trim().slice(0, LEADERBOARD_NAME_RULES.max); }
function leaderboardNameIssue(value){
  const name = normaliseLeaderboardName(value);
  if(name.length < LEADERBOARD_NAME_RULES.min) return 'Please enter a name between 3 and 18 characters.';
  if(!LEADERBOARD_NAME_RULES.allowed.test(name)) return 'Please use letters, numbers, spaces, hyphens or underscores only.';
  const compact = name.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(LEADERBOARD_NAME_RULES.blocked.some(word => compact.includes(word))) return 'Please choose a different leaderboard name.';
  return '';
}
function getLeaderboardNameFromUser(defaultName=''){
  const suggested = normaliseLeaderboardName(defaultName && defaultName !== 'You' ? defaultName : '');
  const entered = window.prompt('Enter your name for the leaderboard:', suggested);
  if(entered === null) return null;
  const name = normaliseLeaderboardName(entered);
  const issue = leaderboardNameIssue(name);
  if(issue){ alert(issue); return null; }
  return name;
}
function safeGeneratedLeaderboardName(value, fallback='Player'){
  const name = normaliseLeaderboardName(value || fallback);
  return leaderboardNameIssue(name) ? fallback : name;
}
async function submitCurrentScore(){
  if(!state||state.leaderboardSubmitted) return;
  const score=finalScores()[0]; if(!score) return;
  const username = getLeaderboardNameFromUser(score.user?.name || '');
  if(username === null) return;
  const btn=$('submitLeaderboardFinal'); if(btn){ btn.disabled=true; btn.textContent='Submitting...'; }
  try{
    await ensureFirebase();
    // Store one clear League Legends league value going forward. Older scores are still read using the
    // compatibility lookup in the leaderboard renderer, which prevents duplicate league fields in Firebase.
    const leaderboardPayload = {
      username,
      score: score.total,
      gameMode: leaderboardMode(),
      timestamp: Date.now(),
      yearRange: state.yearRange || null,
      team: (score.user.team || []).map(p => ({
        name: p.player,
        position: roleLabel(p.selectedRole || p.mainPosition),
        club: p.club,
        year: p.year,
        rating: p.rating
      }))
    };
    if (state.challengePreset === 'leaguelegends') {
      leaderboardPayload.leagueSelection = {
        label: state.selectedLegendLeague || state.legendLeague || state.leagueName || state.leagueLabel || '',
        labels: [state.selectedLegendLeague || state.legendLeague || state.leagueName || state.leagueLabel || ''].filter(Boolean)
      };
    } else if (state.leagueSelection) {
      leaderboardPayload.leagueSelection = state.leagueSelection;
    }
    await firebase.database().ref('leaderboard').push(leaderboardPayload);
    state.leaderboardSubmitted=true;
    if(btn){btn.disabled=true;btn.textContent='Submitted';}
  }catch(error){
    if(btn){btn.disabled=false;btn.textContent='Submit to leaderboard';}
    alert('Could not submit score. '+(error.message||error));
  }
}
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function fitText(ctx,text,x,y,max,font,color){ ctx.font=font; ctx.fillStyle=color; let out=String(text||''); while(out.length>3 && ctx.measureText(out).width>max) out=out.slice(0,-2)+'...'; ctx.fillText(out,x,y); }
function svgText(value){ return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function svgFit(value, max=24){ const text = String(value || ''); return text.length <= max ? text : text.slice(0, Math.max(0,max-1)) + '…'; }
function blobToDataUri(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read image.'));
    reader.readAsDataURL(blob);
  });
}
async function loadSummaryLogoDataUri(){
  const existingLogo = document.querySelector('.site-logo');
  const src = existingLogo?.getAttribute('src') || 'Ultimate 5-a-side LOGO.png';
  try {
    const response = await fetch(src, { cache:'force-cache' });
    if(!response.ok) throw new Error('Logo response was not ok.');
    return await blobToDataUri(await response.blob());
  } catch (error) {
    console.warn('Summary logo could not be embedded. Using fallback mark.', error);
    return '';
  }
}
function fallbackLogoSvg(x,y,size){
  const cx=x+size/2, cy=y+size/2;
  return `<g><circle cx="${cx}" cy="${cy}" r="${size/2}" fill="#061a3a" stroke="#38bdf8" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${size*.35}" fill="none" stroke="#1d4ed8" stroke-width="3" opacity=".85"/><text x="${cx}" y="${cy+size*.16}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size*.55}" font-weight="900" fill="#ffffff">5</text></g>`;
}
function svgTextLines(value, maxChars=22, maxLines=2){
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = '';
  words.forEach(word => {
    const next = current ? current + ' ' + word : word;
    if (next.length <= maxChars || !current) current = next;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  const out = lines.slice(0, maxLines);
  if (lines.length > maxLines) out[maxLines - 1] = svgFit(out[maxLines - 1] + ' ' + lines.slice(maxLines).join(' '), maxChars);
  return out.map(line => svgText(svgFit(line, maxChars)));
}
async function createSummarySvg(){
  const scored = finalScores();
  const mode = leaderboardMode();
  const logoData = await loadSummaryLogoDataUri();
  const logo = logoData ? `<image href="${logoData}" x="64" y="30" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>` : fallbackLogoSvg(64,30,72);
  const ordinal=n=>n===1?'1st':n===2?'2nd':n===3?'3rd':n+'th';

  const singleTeamSvg = (row=scored[0] || { user:{ name:'Player', team:[] }, total:0 }) => {
    const user = row.user || { name:'Player', team:[] };
    const total = Number(row.total || 0);
    const slots = buildSlots(user);
    const pitch = { x:92, y:238, w:1016, h:548 };
    const positions = [
      { i:4, x:pitch.x + pitch.w*.50, y:pitch.y + pitch.h*.135 },
      { i:2, x:pitch.x + pitch.w*.30, y:pitch.y + pitch.h*.47 },
      { i:3, x:pitch.x + pitch.w*.70, y:pitch.y + pitch.h*.47 },
      { i:1, x:pitch.x + pitch.w*.50, y:pitch.y + pitch.h*.69 },
      { i:0, x:pitch.x + pitch.w*.50, y:pitch.y + pitch.h*.865 }
    ];
    const pitchPattern = Array.from({length:12}, (_,i)=>`<rect x="${pitch.x+i*(pitch.w/12)}" y="${pitch.y}" width="${pitch.w/12}" height="${pitch.h}" fill="${i%2===0?'#2f7d4a':'#2a7043'}" opacity="0.96"/>`).join('');
    const cards = positions.map(pos => summarySvgPlayerCard(pos.x - 160, pos.y - 44, 320, 88, slots[pos.i].player, slots[pos.i].role)).join('');
    const scoreText = String(total);
    const scoreSize = scoreText.length >= 4 ? 44 : scoreText.length >= 3 ? 48 : 54;
    const safeUserName = svgText(svgFit(user.name || 'Player', 28));
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#061a2f"/><stop offset="48%" stop-color="#0f172a"/><stop offset="100%" stop-color="#12335f"/></linearGradient>
    <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#eaf2fb"/></linearGradient>
    <linearGradient id="scoreCard" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#eff6ff"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="13" flood-color="#020617" flood-opacity="0.22"/></filter>
    <filter id="cardShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#020617" flood-opacity="0.20"/></filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <circle cx="1072" cy="96" r="95" fill="#38bdf8" opacity="0.08"/><circle cx="144" cy="118" r="86" fill="#22c55e" opacity="0.07"/>
  ${logo}
  <text x="150" y="67" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="0.5">Ultimate 5-a-side Draft</text>
  <rect x="150" y="82" width="320" height="34" rx="17" fill="#0b1220" opacity="0.94"/>
  <text x="166" y="105" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#bae6fd">${svgText(mode)}</text>
  <rect x="42" y="132" width="1116" height="710" rx="34" fill="url(#panel)" stroke="#bfdbfe" stroke-width="3" filter="url(#shadow)"/>
  <text x="86" y="181" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#2563eb" letter-spacing="3">FINAL RESULT</text>
  <text x="86" y="220" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="900" fill="#0f172a">${safeUserName}</text>
  <rect x="962" y="164" width="134" height="56" rx="19" fill="url(#scoreCard)" stroke="#bfdbfe"/>
  <text x="1078" y="207" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${scoreSize}" font-weight="900" fill="#1d4ed8">${scoreText}</text>
  <g>
    <rect x="${pitch.x}" y="${pitch.y}" width="${pitch.w}" height="${pitch.h}" rx="24" fill="#2b7646" stroke="#d6ead8" stroke-width="4"/>
    ${pitchPattern}
    <rect x="${pitch.x+12}" y="${pitch.y+12}" width="${pitch.w-24}" height="${pitch.h-24}" rx="18" fill="none" stroke="#f8fafc" stroke-opacity="0.33" stroke-width="2"/>
    <line x1="${pitch.x}" y1="${pitch.y + pitch.h/2}" x2="${pitch.x + pitch.w}" y2="${pitch.y + pitch.h/2}" stroke="#ffffff" stroke-opacity="0.62" stroke-width="3"/>
    <circle cx="${pitch.x + pitch.w/2}" cy="${pitch.y + pitch.h/2}" r="64" fill="none" stroke="#ffffff" stroke-opacity="0.62" stroke-width="3"/>
    <circle cx="${pitch.x + pitch.w/2}" cy="${pitch.y + pitch.h/2}" r="5" fill="#ffffff" opacity="0.62"/>
    <rect x="${pitch.x + pitch.w*.32}" y="${pitch.y}" width="${pitch.w*.36}" height="90" fill="none" stroke="#ffffff" stroke-opacity="0.62" stroke-width="3"/>
    <rect x="${pitch.x + pitch.w*.32}" y="${pitch.y + pitch.h - 90}" width="${pitch.w*.36}" height="90" fill="none" stroke="#ffffff" stroke-opacity="0.62" stroke-width="3"/>
    ${cards}
  </g>
  <text x="42" y="875" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#dbeafe">Generated from Ultimate 5-a-side Draft</text>
</svg>`;
  };

  if(!state?.isOnlineGame) return singleTeamSvg();

  const teamCount = Math.max(1, scored.length);
  const sectionH = 710;
  const height = 150 + teamCount * sectionH + 70;
  const onlinePanels = scored.map((row,idx)=>{
    const yOffset = 150 + idx * sectionH;
    const inner = singleTeamSvg(row)
      .replace(/<\?xml version="1\.0" encoding="UTF-8"\?>\s*/,'')
      .replace(/<svg[^>]*>/,'')
      .replace('</svg>','')
      .replace(/<rect width="1200" height="900" fill="url\(#bg\)"\/>/,'')
      .replace(/<circle[^>]*opacity="0\.08"\/><circle[^>]*opacity="0\.07"\/>/,'')
      .replace(/<image href=.*?preserveAspectRatio="xMidYMid meet"\/>/,'')
      .replace(/<g><circle[\s\S]*?<\/g>/,'')
      .replace(/<text x="150" y="67"[\s\S]*?<text x="166" y="105"[\s\S]*?<\/text>/,'')
      .replace(/<text x="42" y="875"[\s\S]*?<\/text>/,'')
      .replace(/<defs>[\s\S]*?<\/defs>/,'');
    const badgeFill = idx===0 ? '#f59e0b' : '#1e3a8a';
    const panelStroke = idx===0 ? '#f59e0b' : '#bfdbfe';
    return `<g transform="translate(0 ${yOffset-132})"><rect x="34" y="122" width="1132" height="730" rx="38" fill="${idx===0?'#fffbeb':'#eef6ff'}" stroke="${panelStroke}" stroke-width="${idx===0?5:3}"/><rect x="72" y="146" width="74" height="36" rx="18" fill="${badgeFill}"/><text x="109" y="170" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="900" fill="#ffffff">${ordinal(idx+1)}</text>${inner}</g>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#061a2f"/><stop offset="48%" stop-color="#0f172a"/><stop offset="100%" stop-color="#12335f"/></linearGradient>
    <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#eaf2fb"/></linearGradient>
    <linearGradient id="scoreCard" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#eff6ff"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="13" flood-color="#020617" flood-opacity="0.22"/></filter>
    <filter id="cardShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#020617" flood-opacity="0.20"/></filter>
  </defs>
  <rect width="1200" height="${height}" fill="url(#bg)"/>
  ${logo}
  <text x="150" y="67" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="0.5">Ultimate 5-a-side Draft</text>
  <rect x="150" y="82" width="320" height="34" rx="17" fill="#0b1220" opacity="0.94"/>
  <text x="166" y="105" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#bae6fd">${svgText(mode)}</text>
  <text x="600" y="128" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="#ffffff">Final Results</text>
  ${onlinePanels}
  <text x="42" y="${height-30}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#dbeafe">Generated from Ultimate 5-a-side Draft</text>
</svg>`;
}

function summarySvgPlayerCard(x,y,w,h,p,role){
  const roleText = svgText(roleLabel(role));
  if(!p) return `<g filter="url(#cardShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#f8fafc" opacity="0.88" stroke="#cbd5e1"/><rect x="${x+16}" y="${y+18}" width="48" height="25" rx="13" fill="#1e293b"/><text x="${x+40}" y="${y+36}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="#ffffff">${roleText}</text><text x="${x+80}" y="${y+52}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#64748b">Empty</text></g>`;
  const nameLines = svgTextLines(p.player, 22, 2);
  const club = svgText(svgFit(shortClub(p.club) || '', 20));
  const year = p.year ? svgText(p.year) : '';
  const rating = svgText(p.rating || '');
  const meta = year ? `${club} | ${year}` : club;
  const nameY = nameLines.length > 1 ? y + 28 : y + 36;
  const secondLine = nameLines[1] ? `<text x="${x+78}" y="${nameY+18}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" fill="#0f172a">${nameLines[1]}</text>` : '';
  const metaY = nameLines.length > 1 ? y + 67 : y + 62;
  return `<g filter="url(#cardShadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff" stroke="#dbeafe"/>
    <rect x="${x}" y="${y}" width="7" height="${h}" rx="4" fill="#1d4ed8"/>
    <rect x="${x+16}" y="${y+17}" width="48" height="25" rx="13" fill="#0f172a"/>
    <text x="${x+40}" y="${y+35}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="#ffffff">${roleText}</text>
    <text x="${x+78}" y="${nameY}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" fill="#0f172a">${nameLines[0]}</text>
    ${secondLine}
    <text x="${x+78}" y="${metaY}" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="800" fill="#64748b">${meta}</text>
    <rect x="${x+w-58}" y="${y+18}" width="44" height="44" rx="14" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="${x+w-36}" y="${y+47}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#1d4ed8">${rating}</text>
  </g>`;
}
function summarySvgBlob(svg){ return new Blob([svg], { type:'image/svg+xml;charset=utf-8' }); }
function svgBlobToPngBlob(svgBlob){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    let done = false;
    const finish = (fn, value) => { if(done) return; done = true; URL.revokeObjectURL(url); fn(value); };
    const timer = setTimeout(() => finish(reject, new Error('Image generation timed out.')), 4500);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1200; canvas.height = img.naturalHeight || 900;
        const ctx = canvas.getContext('2d', { alpha:false });
        ctx.drawImage(img, 0, 0);
        if (!canvas.toBlob) finish(reject, new Error('Image export is not supported on this device.'));
        else canvas.toBlob(blob => blob ? finish(resolve, blob) : finish(reject, new Error('Could not export image.')), 'image/png');
      } catch(error) { finish(reject, error); }
    };
    img.onerror = () => { clearTimeout(timer); finish(reject, new Error('Could not render the summary image.')); };
    img.src = url;
  });
}
function downloadBlob(blob, filename){ const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
async function getSummaryImageFile(){
  const svgMarkup = await createSummarySvg();
  const svg = summarySvgBlob(svgMarkup);
  try { const png = await svgBlobToPngBlob(svg); return new File([png], '5-a-side-results.png', { type:'image/png' }); }
  catch (error) { console.warn('PNG summary failed, using SVG fallback.', error); return new File([svg], '5-a-side-results.svg', { type:'image/svg+xml' }); }
}
async function saveSummaryImage(){
  if(!ratingsRevealed) return;
  const button = $('saveSummaryBtn'); if(button){ button.disabled = true; button.textContent = 'Saving...'; }
  try { const file = await getSummaryImageFile(); downloadBlob(file, file.name); }
  catch (error) { console.error(error); alert('Sorry, the picture could not be saved on this device.'); }
  finally { if(button){ button.disabled = false; button.textContent = 'Save picture'; } }
}
async function shareSummaryImage(){
  if(!ratingsRevealed) return;
  const button = $('shareSummaryBtn'); if(button){ button.disabled = true; button.textContent = 'Preparing...'; }
  try { const file = await getSummaryImageFile(); if(navigator.canShare && navigator.canShare({ files:[file] })) await navigator.share({ files:[file], title:'Ultimate 5-a-side Draft', text:'My Ultimate 5-a-side final score.' }); else downloadBlob(file, file.name); }
  catch (error) { console.error(error); alert('Sorry, the picture could not be shared on this device.'); }
  finally { if(button){ button.disabled = false; button.textContent = 'Share summary'; } }
}

async function createPlayerSimulationSummarySvg(score, payload){
  const logoData = await loadSummaryLogoDataUri();
  const logo = logoData ? `<image href="${logoData}" x="54" y="34" width="58" height="58" preserveAspectRatio="xMidYMid meet"/>` : fallbackLogoSvg(54,34,58);
  const clubs = Object.entries(playerSim?.clubs || {}).sort((a,b)=>b[1]-a[1]).map(([name, years]) => `${name} (${years} yr${years===1?'':'s'})`);
  const clubLines = svgTextLines(clubs.join('  |  ') || 'Career clubs unavailable', 72, 2);
  const ratingText = String(score ?? 0);
  const displayValue = value => (value === null || value === undefined || value === '') ? '0' : String(value);
  const stats = [
    ['Position', displayValue(playerSim?.position || '-')], ['Nationality', displayValue(payload?.nationality || 'England')], ['Caps', displayValue(payload?.internationalCaps)], ['Retired', 'Age ' + displayValue(payload?.retiredAt ?? playerSim?.age)], ['Apps', displayValue(payload?.apps)], ['Goals', displayValue(payload?.goals)], ['Assists', displayValue(payload?.assists)],
    ['Clean Sheets', displayValue(payload?.cleanSheets)], ['League Titles', displayValue(payload?.titles)], ['UCL', displayValue(payload?.championsLeagues)], ['League Cups', displayValue(payload?.leagueCups)], ['World Cups', displayValue(payload?.worldCups)],
    ["Ballon d'Ors", displayValue(payload?.ballonDors)], ['Transfer Fees', money(payload?.transferFees || 0)], ['Loyalty', displayValue(payload?.loyalty) + '/100'], ['Yellow Cards', displayValue(payload?.yellowCards)], ['Red Cards', displayValue(payload?.redCards)]
  ];
  const statCards = stats.map((item, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const x = 58 + col * 218;
    const y = 412 + row * 86;
    return `<g><rect x="${x}" y="${y}" width="198" height="70" rx="18" fill="#ffffff" stroke="#dbeafe"/><text x="${x+16}" y="${y+24}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="#64748b" letter-spacing="1.4">${svgText(item[0])}</text><text x="${x+16}" y="${y+56}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#0f172a">${svgText(svgFit(item[1], 16))}</text></g>`;
  }).join('');
  const clubText = clubLines.map((line, i) => `<text x="78" y="332" dy="${i*20}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" fill="#1e3a8a">${line}</text>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#061a2f"/><stop offset="52%" stop-color="#0f172a"/><stop offset="100%" stop-color="#14532d"/></linearGradient>
    <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#eef9f1"/></linearGradient>
    <linearGradient id="score" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#052e16"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="13" flood-color="#020617" flood-opacity="0.22"/></filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <circle cx="1088" cy="78" r="96" fill="#22c55e" opacity="0.08"/><circle cx="112" cy="110" r="80" fill="#38bdf8" opacity="0.08"/>
  ${logo}
  <text x="124" y="63" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="900" fill="#ffffff" letter-spacing="0.4">Ultimate 5-a-side Draft</text>
  <rect x="124" y="78" width="246" height="34" rx="17" fill="#0b1220" opacity="0.94"/><text x="142" y="101" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#bbf7d0">Player Simulation</text>
  <rect x="34" y="132" width="1132" height="692" rx="34" fill="url(#panel)" stroke="#bbf7d0" stroke-width="3" filter="url(#shadow)"/>
  <text x="74" y="190" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#16a34a" letter-spacing="4">CAREER RESULT</text>
  <text x="74" y="236" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900" fill="#0f172a">${svgText(svgFit(playerSim?.name || 'Player', 28))}</text>
  <rect x="862" y="168" width="238" height="124" rx="28" fill="url(#score)"/>
  <text x="981" y="204" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="900" fill="#bae6fd" letter-spacing="2.4">CAREER RATING</text>
  <text x="964" y="262" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="900" fill="#ffffff">${ratingText}</text>
  <text x="1022" y="263" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#dbeafe">/100</text>
  <rect x="58" y="278" width="762" height="96" rx="20" fill="#e0f2fe" stroke="#bfdbfe"/>
  <text x="78" y="306" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="#64748b" letter-spacing="1.6">CLUBS</text>
  ${clubText}
  ${statCards}
  <text x="34" y="862" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#dbeafe">Generated from Ultimate 5-a-side Draft</text>
</svg>`;
}

async function getPlayerSimulationSummaryImageFile(score, payload){ const svgMarkup = await createPlayerSimulationSummarySvg(score, payload); const svg = summarySvgBlob(svgMarkup); try { const png = await svgBlobToPngBlob(svg); return new File([png], 'player-simulation-results.png', { type:'image/png' }); } catch (error) { console.warn('Player Simulation PNG summary failed, using SVG fallback.', error); return new File([svg], 'player-simulation-results.svg', { type:'image/svg+xml' }); } }
async function psSavePicture(score, payload){ const button = $('psSavePicture'); if(button){ button.disabled = true; button.textContent = 'Saving...'; } try { const file = await getPlayerSimulationSummaryImageFile(score, payload); downloadBlob(file, file.name); } catch(error){ console.error(error); alert('Sorry, the picture could not be saved on this device.'); } finally { if(button){ button.disabled = false; button.textContent = 'Save picture'; } } }
async function psSharePicture(score, payload){ const button = $('psSharePicture'); if(button){ button.disabled = true; button.textContent = 'Preparing...'; } try { const file = await getPlayerSimulationSummaryImageFile(score, payload); if(navigator.canShare && navigator.canShare({ files:[file] })) await navigator.share({ files:[file], title:'Ultimate 5-a-side Draft', text:'My Player Simulation career rating.' }); else downloadBlob(file, file.name); } catch(error){ console.error(error); alert('Sorry, the picture could not be shared on this device.'); } finally { if(button){ button.disabled = false; button.textContent = 'Share picture'; } } }
// ---------- Leaderboards ----------
const LB_TABS = [
  {key:'solo', label:'Solo Mode', modes:[MODE_LABELS.solo,MODE_LABELS.ultimate,MODE_LABELS.easy,MODE_LABELS.league,MODE_LABELS.worldcup], subs:[['all','All'],[MODE_LABELS.solo,'Standard Solo'],[MODE_LABELS.ultimate,'Ultimate Solo'],[MODE_LABELS.easy,'Easy Solo'],[MODE_LABELS.league,'League Challenge'],[MODE_LABELS.worldcup,'World Cup 2026']]},
  {key:'online', label:'Online Battles', modes:[MODE_LABELS.onlineDraft,MODE_LABELS.onlineBlind,MODE_LABELS.onlineLive], subs:[['all','All'],[MODE_LABELS.onlineDraft,'Online Ultimate Draft'],[MODE_LABELS.onlineBlind,'Online Blind Bidding'],[MODE_LABELS.onlineLive,'Online Live Auction']]},
  {key:'legends', label:'League Legends', modes:[MODE_LABELS.leaguelegends], subs:[['all','All']]},
  {key:'playerSim', label:'Player Simulation', modes:[MODE_LABELS.playerSim], subs:[['all','All'],['GK','GK'],['DEF','DEF'],['MID','MID'],['ST','ST']]},
  {key:'monthly', label:'Monthly Challenges', modes:[MODE_LABELS.worldcup], subs:[[MODE_LABELS.worldcup,'World Cup 2026']]}
];
let lbMain='solo', lbSub='all';
async function showLeaderboard(){ injectStyles(); document.body.classList.remove('ps-active'); if(els.draftControls) els.draftControls.style.removeProperty('display'); setMessage(''); const oldTurn=$('turnLockNote'); if(oldTurn) oldTurn.remove(); hideAllPanels(); show(els.leaderboardPanel,true); if(els.resetBtn) els.resetBtn.style.display=''; renderLeaderboardShell(); await renderLeaderboard(); }
function renderLeaderboardShell(){
  const tabs=document.querySelector('#leaderboardPanel .leaderboard-tabs'); if(tabs){ tabs.classList.add('leaderboard-main-tabs-v55'); tabs.innerHTML=LB_TABS.map(t=>`<button type="button" class="leaderboard-tab ${lbMain===t.key?'active':''}" data-lb-main="${t.key}">${esc(t.label)}</button>`).join(''); tabs.querySelectorAll('[data-lb-main]').forEach(b=>b.addEventListener('click',async()=>{lbMain=b.dataset.lbMain; lbSub='all'; renderLeaderboardShell(); await renderLeaderboard();})); }
  const sub=$('soloLeaderboardSubTabs'); if(sub){ const tab=LB_TABS.find(t=>t.key===lbMain); sub.className='leaderboard-tabs leaderboard-subtabs-v55'; sub.innerHTML=tab.subs.map(s=>`<button type="button" class="leaderboard-tab ${lbSub===s[0]?'active':''}" data-lb-sub="${esc(s[0])}">${esc(s[1])}</button>`).join(''); sub.querySelectorAll('[data-lb-sub]').forEach(b=>b.addEventListener('click',async()=>{lbSub=b.dataset.lbSub; renderLeaderboardShell(); await renderLeaderboard();})); }
}
async function renderLeaderboard(){
  const list=$('leaderboardList'); if(!list)return; list.innerHTML='<div class="leaderboard-empty">Loading leaderboard...</div>';
  try{
    await ensureFirebase();
    if (lbMain === 'legends') { try { await loadLegends(); } catch(err) { console.warn('Could not load League Legends lookup data.', err); } }
    const snap=await firebase.database().ref('leaderboard').once('value');
    let entries=Object.values(snap.val()||{}).filter(e=>e&&Number.isFinite(Number(e.score))).map(e=>({...e,score:Number(e.score||0)}));
    const tab=LB_TABS.find(t=>t.key===lbMain);
    entries=entries.filter(e=>tab.modes.includes(e.gameMode));
    if(lbSub!=='all'){
      if(lbMain==='playerSim') entries=entries.filter(e=>(e.careerStats?.position||'')===lbSub);
      else entries=entries.filter(e=>e.gameMode===lbSub);
    }
    entries=entries.sort((a,b)=>b.score-a.score || Number(b.timestamp||0)-Number(a.timestamp||0)).slice(0,50);
    if(!entries.length){ list.innerHTML='<div class="leaderboard-empty">No scores submitted yet.</div>'; return; }
    list.innerHTML=entries.map((e,i)=>lbMain==='playerSim'?playerSimLeaderboardRow(e,i):normalLeaderboardRow(e,i)).join('');
  }catch(e){ list.innerHTML='<div class="leaderboard-error">Could not load leaderboard. '+esc(e.message||e)+'</div>'; }
}

function firebaseValueToList(value){
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
function findLeagueNameInFirebaseEntry(value, path=''){
  const leagueNames = ['Premier League','La Liga','Serie A','Ligue 1','Bundesliga'];
  if (value == null) return '';
  if (/team|player|name$/i.test(path) && !/league/i.test(path)) return '';
  if (typeof value === 'string') {
    const clean = value.trim();
    const exact = leagueNames.find(l => clean.toLowerCase() === l.toLowerCase());
    if (exact) return exact;
    const contained = leagueNames.find(l => clean.toLowerCase().includes(l.toLowerCase()) && /league|legend|challenge|mode/i.test(path + ' ' + clean));
    return contained || '';
  }
  if (Array.isArray(value)) {
    for (const item of value) { const found = findLeagueNameInFirebaseEntry(item, path); if (found) return found; }
    return '';
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) { const found = findLeagueNameInFirebaseEntry(item, path ? path + '.' + key : key); if (found) return found; }
  }
  return '';
}
function firebaseValueToList(value){
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
function getLeagueFromSubmittedTeam(entry){
  // Compatibility fallback for older League Legends submissions which did not save a league field.
  // It uses submitted team names and clubs to infer the selected league from league_players.json.
  if (!Array.isArray(entry?.team) || !entry.team.length || !Array.isArray(legends) || !legends.length) return '';
  const counts = {};
  entry.team.forEach(player => {
    const name = String(player?.name || player?.player || '').trim().toLowerCase();
    const club = String(player?.club || '').trim().toLowerCase();
    if (!name) return;
    const exactClubMatches = legends.filter(legend =>
      String(legend.player || '').trim().toLowerCase() === name &&
      club && String(legend.club || '').trim().toLowerCase() === club
    );
    const matches = exactClubMatches.length ? exactClubMatches : legends.filter(legend => String(legend.player || '').trim().toLowerCase() === name);
    matches.forEach(match => {
      if (match.league) counts[match.league] = (counts[match.league] || 0) + 1;
    });
  });
  const ranked = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if (!ranked.length) return '';
  return ranked[0][1] >= 2 || ranked.length === 1 || ranked[0][1] > (ranked[1]?.[1] || 0) ? ranked[0][0] : '';
}
function getLeagueLegendLeaderboardLeague(entry){
  if (entry?.gameMode !== MODE_LABELS.leaguelegends) return '';
  const fields = [
    entry?.leagueSelection?.labels,
    entry?.leagueSelection?.label,
    entry?.leagueSelection?.league,
    entry?.selectedLegendLeague,
    entry?.legendLeague,
    entry?.leagueName,
    entry?.leagueLabel,
    entry?.challengeLeague,
    entry?.league,
    entry?.selectedLeague,
    entry?.modeLeague,
    entry?.filterLeague,
    entry?.leagueFilter
  ];
  for (const field of fields) {
    const values = firebaseValueToList(field).map(v => String(v).trim()).filter(Boolean);
    if (values.length) return values.join(', ');
  }
  return getLeagueFromSubmittedTeam(entry) || 'Not recorded';
}
function normalLeaderboardRow(e,i){
  const parsed = splitLeaderboardNameAndYears(e);
  const league = getLeagueLegendLeaderboardLeague(e);
  const leagueLine = league ? 'League: ' + league : '';
  const details = [parsed.years, leagueLine].filter(Boolean).map(line=>`<small class="leaderboard-year-line leaderboard-league-line">${esc(line)}</small>`).join('');
  const team = (e.team||[]).map(p=>`<span class="leaderboard-player-chip-v78"><span class="lb-chip-pos">${esc(p.position||'')}</span><span class="lb-chip-name">${esc(p.name||p.player||'')}</span></span>`).join('');
  return `<div class="leaderboard-row leaderboard-row-v55"><span class="leaderboard-rank">#${i+1}</span><span class="leaderboard-name"><span class="leaderboard-name-main">${esc(parsed.name)}</span>${details}</span><span class="leaderboard-mode">${esc(e.gameMode||'')}</span><span class="leaderboard-score">${e.score}</span>${team?`<span class="leaderboard-team-v78"><span class="lb-team-label">Team:</span> ${team}</span>`:''}</div>`;
}

function splitLeaderboardNameAndYears(entry){
  let name = String(entry.username || 'Player');
  let years = entry.yearRange ? `Years: ${entry.yearRange.start} - ${entry.yearRange.end}` : '';
  const match = name.match(/^(.*?)\s*Years:\s*(.+)$/i);
  if (match) { name = match[1].trim() || 'Player'; years = 'Years: ' + match[2].trim(); }
  // World Cup 2026 is a fixed-pool monthly challenge, so the year range is not useful on the leaderboard.
  if (entry?.gameMode === MODE_LABELS.worldcup) years = '';
  return { name, years };
}
const PLAYER_SIM_NATIONALITY_LEADERBOARD_CUTOFF = Date.UTC(2026, 7, 13, 14, 34, 0);
function playerSimLeaderboardRow(e,i){
  const c=e.careerStats||{};
  const entryTime = Number(e.timestamp||0);
  const showNewInternationalStats = entryTime >= PLAYER_SIM_NATIONALITY_LEADERBOARD_CUTOFF && !!String(c.nationality||'').trim() && Object.prototype.hasOwnProperty.call(c,'internationalCaps');
  // Ordered deliberately: CSS shows the first few chips on portrait mobile and reveals the full set on landscape/desktop.
  const items=[`Position: ${c.position??''}`,`Apps: ${c.apps??0}`];
  if(showNewInternationalStats){
    items.push(`Nationality: ${c.nationality}`);
    items.push(`Caps: ${c.internationalCaps??0}`);
  }
  items.push(`Goals: ${c.goals??0}`,`Assists: ${c.assists??0}`,`Clean sheets: ${c.cleanSheets??'N/A'}`,`League titles: ${c.titles??0}`,`UCL: ${c.championsLeagues??0}`,`League cups: ${c.leagueCups??0}`,`World Cups: ${c.worldCups??0}`,`Ballon d'Ors: ${c.ballonDors??0}`,`Fees: ${money(c.transferFees||0)}`,`Loyalty: ${c.loyalty??0}/100`);
  const chips=items.map(x=>`<span class="ps-lb-chip">${esc(x)}</span>`).join('');
  return `<div class="leaderboard-row leaderboard-row-v55 player-sim-leaderboard-row"><span class="leaderboard-rank">#${i+1}</span><span class="leaderboard-name">${esc(e.username||'Player')}</span><span class="leaderboard-mode">Player Simulation</span><span class="leaderboard-score">${e.score}</span><span class="ps-lb-meta">${chips}</span></div>`;
}

const PLAYER_SIM_NATIONS = [
  {name:'Brazil',tier:5},{name:'Argentina',tier:5},{name:'France',tier:5},{name:'Spain',tier:5},{name:'Germany',tier:5},
  {name:'England',tier:4},{name:'Portugal',tier:4},{name:'Netherlands',tier:4},{name:'Italy',tier:4},{name:'Belgium',tier:4},
  {name:'Uruguay',tier:3},{name:'Croatia',tier:3},{name:'Denmark',tier:3},{name:'Colombia',tier:3},{name:'Mexico',tier:3},{name:'USA',tier:3},{name:'Morocco',tier:3},{name:'Switzerland',tier:3},{name:'Japan',tier:3},{name:'Senegal',tier:3},
  {name:'Poland',tier:2},{name:'Serbia',tier:2},{name:'Sweden',tier:2},{name:'Norway',tier:2},{name:'Austria',tier:2},{name:'Turkey',tier:2},{name:'Chile',tier:2},{name:'Nigeria',tier:2},{name:'Ghana',tier:2},{name:'South Korea',tier:2},
  {name:'Scotland',tier:1},{name:'Wales',tier:1},{name:'Republic of Ireland',tier:1},{name:'Czech Republic',tier:1},{name:'Greece',tier:1},{name:'Cameroon',tier:1},{name:'Ecuador',tier:1},{name:'Paraguay',tier:1},{name:'Australia',tier:1},{name:'Egypt',tier:1}
];
function psNationOptions(){ return shuffle(PLAYER_SIM_NATIONS).slice(0,3); }
function psNationTier(){ return Number((playerSim?.nationality && playerSim.nationality.tier) || 3); }
function psNationName(){ return String((playerSim?.nationality && playerSim.nationality.name) || 'England'); }

// ---------- Player Simulation ----------
function openPlayerSimulation(){ injectStyles(); document.body.classList.add('ps-active'); hideAllPanels(); if(els.resetBtn) els.resetBtn.style.display=''; renderPSStart(); }
function psPanel(){ let p=$('playerSimulationPanel'); if(!p){ p=document.createElement('section'); p.id='playerSimulationPanel'; p.className='ps-panel'; (document.querySelector('.app-shell')||document.body).appendChild(p); } show(p,true); return p; }
function randomName(){ return pick(FIRST_NAMES)+' '+pick(LAST_NAMES); }
function addPlayerSimRestartButton(){
  const panel = $('playerSimulationPanel');
  if (!panel) return;
  const actions = panel.querySelector('.ps-actions');
  if (!actions || actions.querySelector('.ps-restart-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secondary ps-restart-btn';
  btn.textContent = 'Restart';
  btn.addEventListener('click', renderPSStart);
  actions.appendChild(btn);
}
function renderPSStart(){
  const p=psPanel(); playerSimSubmitted=false;
  const initialPlayerName = playerSimUseSavedManualName && playerSimSavedManualName ? playerSimSavedManualName : randomName();
  playerSimNameWasTyped = !!(playerSimUseSavedManualName && playerSimSavedManualName);
  p.innerHTML=`<div class="ps-card"><div class="ps-grid"><div class="ps-box"><p class="eyebrow">Player Simulation</p><h2>Build a career, season by season</h2><p>Type a player name or generate one, choose a position, then guide the player from breakthrough prospect to retirement.</p><div class="ps-form"><div><label for="psName">Player name</label><input id="psName" type="text" maxlength="32" value="${esc(initialPlayerName)}"></div><button class="btn btn-secondary" id="psRandom">Random name</button></div><label>Position</label><div class="ps-pos">${['GK','DEF','MID','ST'].map(k=>`<button type="button" class="${k==='ST'?'sel':''}" data-ps-pos="${k}">${k}<br><small>${k==='ST'?'Striker':k==='DEF'?'Defender':k==='MID'?'Midfielder':'Goalkeeper'}</small></button>`).join('')}</div><div class="ps-actions ps-start-actions"><button class="btn btn-primary" id="psBegin">Begin professional career</button></div></div><div class="ps-box ps-dark"><p class="eyebrow">How it works</p><p><strong>1.</strong> Start professionally between age 16 and 19.</p><p><strong>2.</strong> Bigger, richer clubs only bid when performance and reputation justify it.</p><p><strong>3.</strong> From age 33, choose whether to retire or risk carrying on.</p><p><strong>4.</strong> At retirement, reveal the career stats one by one.</p></div></div></div>`;
  $('psRandom').onclick=()=>{ $('psName').value=randomName(); playerSimNameWasTyped=false; playerSimUseSavedManualName=false; playerSimSavedManualName=''; };
  $('psName')?.addEventListener('input',()=>{ playerSimNameWasTyped=true; playerSimUseSavedManualName=true; });
  $('psBegin').onclick=psBegin;
  p.querySelectorAll('[data-ps-pos]').forEach(b=>b.onclick=()=>{p.querySelectorAll('[data-ps-pos]').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')});
}

function psBegin(){ const enteredName=($('psName')?.value||'').trim(), name=enteredName||randomName(), position=document.querySelector('[data-ps-pos].sel')?.dataset.psPos||'ST', startAge=rnd(16,19), retireAge=position==='GK'?rnd(37,40):position==='DEF'?rnd(35,38):rnd(34,37); if(playerSimNameWasTyped&&enteredName){ playerSimSavedManualName=enteredName; playerSimUseSavedManualName=true; } else { playerSimSavedManualName=''; playerSimUseSavedManualName=false; } const opts=shuffle(PLAYER_SIM_CLUBS.filter(c=>c.level<82)).slice(0,2); playerSim={name,position,nationality:null,nationOptions:psNationOptions(),age:startAge,startAge,retireAge,club:null,career:[],moves:0,stays:0,highestRejected:0,fees:0,manualRetired:false,clubs:{},totals:{apps:0,goals:0,assists:0,cleanSheets:0,internationalCaps:0,yellowCards:0,redCards:0,titles:0,championsLeagues:0,leagueCups:0,worldCups:0,ballonDors:0},startOptions:opts}; recordStatsEvent('game_start', MODE_LABELS.playerSim, { source:'player_simulation_start', playerCount:1, position }); psChooseNationality(); }
function psChooseNationality(){
  const p=psPanel();
  const opts=playerSim.nationOptions||psNationOptions();
  p.innerHTML=`<div class="ps-card"><div class="ps-box ps-dark"><p class="eyebrow">International career</p><h2>${esc(playerSim.name)}, ${esc(playerSim.position)}</h2><p>Choose the national team your player represents.</p></div><div class="ps-choices">${opts.map((n,i)=>`<button class="ps-choice" type="button" data-ps-nation="${i}"><p class="eyebrow">National team</p><h3>${esc(n.name)}</h3><span class="ps-pill">Choose nationality</span></button>`).join('')}</div><div class="ps-actions ps-career-actions"></div></div>`;
  p.querySelectorAll('[data-ps-nation]').forEach(b=>b.onclick=()=>{ playerSim.nationality=opts[Number(b.dataset.psNation)]||opts[0]; psStartClub(); });
  addPlayerSimRestartButton();
}

function psStartClub(){
  const p=psPanel();
  p.innerHTML=`<div class="ps-card"><div class="ps-box ps-dark"><p class="eyebrow">Professional career start</p><h2>${esc(playerSim.name)}, ${esc(playerSim.position)}</h2><p>${esc(playerSim.name)} signs professionally at age ${playerSim.startAge}. Choose the club where the career officially begins.</p></div><div class="ps-choices">${playerSim.startOptions.map((c,i)=>psClubCard(c,'Start professional career',0,'data-ps-start',i)).join('')}</div><div class="ps-actions ps-career-actions"></div></div>`;
  p.querySelectorAll('[data-ps-start]').forEach(b=>b.onclick=()=>{playerSim.club=playerSim.startOptions[Number(b.dataset.psStart)]; psSeason();});
  addPlayerSimRestartButton();
}

function psClubCard(c,label,fee,attr,i,extra=''){ return `<button class="ps-choice ${extra}" type="button" ${attr}="${i}"><p class="eyebrow">${esc(label)}</p><h3>${esc(c.name)}</h3><p>${esc(c.league)}</p><span class="ps-pill">${fee?money(fee):'No transfer fee'}</span></button>`; }
function psCurve(a){ return a<=18?.72+(a-16)*.06:a<=23?.84+(a-19)*.035:a<=29?1:a<=33?.96-(a-30)*.025:.80-(a-34)*.06; }
function psRate(a,c){ return clamp(Math.round((70+c.level*.22+(playerSim.position==='ST'?1:0)+rnd(-4,5))*psCurve(a)+(c.level-70)*.08+rnd(-3,4)),52,96); }
function psInternationalCapsForSeason(age, rating, apps, seasonOutput){
  // International caps are display-only and do not affect the Player Simulation score.
  // The logic uses a soft career ceiling so 220 caps is possible but extremely rare:
  // - very good players normally land around 80-120 caps,
  // - very good players for weaker national sides can push towards 130-160,
  // - truly elite, long-career players can reach the high 100s,
  // - 200+ requires a rare record-breaker boost plus sustained elite seasons.
  const tier = psNationTier();
  const capsSoFar = Number(playerSim?.totals?.internationalCaps || 0);
  if (capsSoFar >= 220) return 0;

  const quality = clamp((rating - 70) / 26, 0, 1);
  const starQuality = clamp((rating - 86) / 10, 0, 1);
  const ageFactor = age <= 19 ? 0.45 : age <= 23 ? 0.86 : age <= 31 ? 1 : age <= 34 ? 0.84 : age <= 37 ? 0.58 : 0.34;
  const weakNationCeilingBoost = ({1:35, 2:27, 3:15, 4:4, 5:-5}[tier] ?? 12);
  const longevityCeilingBoost = Number(playerSim?.retireAge || 35) >= 38 ? 14 : Number(playerSim?.retireAge || 35) >= 36 ? 8 : 2;
  const calculatedCeiling = 55 + quality * 60 + starQuality * 35 + weakNationCeilingBoost + longevityCeilingBoost + rnd(-7, 7);

  if (!Number.isFinite(Number(playerSim.internationalCapCeiling))) playerSim.internationalCapCeiling = 0;
  playerSim.internationalCapCeiling = Math.max(playerSim.internationalCapCeiling, Math.round(calculatedCeiling));

  // One-off rare record-breaker lift. This is deliberately strict so 200+ is exceptional, not routine.
  if (!playerSim.internationalRecordBoostChecked && starQuality >= .92 && rating >= 93 && Number(playerSim?.retireAge || 0) >= 37) {
    playerSim.internationalRecordBoostChecked = true;
    if (Math.random() < (tier <= 2 ? .08 : .04)) playerSim.internationalCapCeiling += rnd(18, 32);
  }

  const careerCeiling = clamp(Math.round(playerSim.internationalCapCeiling), 45, 220);
  const remaining = Math.max(0, Math.min(220, careerCeiling) - capsSoFar);
  if (remaining <= 0) return 0;

  const nationPathway = ({1:.18, 2:.13, 3:.07, 4:.00, 5:-.05}[tier] ?? .05);
  const topNationEliteBoost = tier >= 4 ? starQuality * .18 : starQuality * .08;
  const regularStarterBoost = apps >= 38 ? .06 : apps >= 30 ? .03 : 0;
  const callUpChance = clamp(.20 + quality * .46 + nationPathway + topNationEliteBoost + regularStarterBoost + (age >= 21 && age <= 32 ? .07 : 0), .03, .92);
  if (Math.random() > callUpChance) return 0;

  const weakerTeamMinutes = ({1:3.0, 2:2.4, 3:1.4, 4:.5, 5:0}[tier] ?? 1.0);
  const eliteStarMinutes = tier >= 4 ? starQuality * 3.2 : starQuality * 1.3;
  const productionBoost = clamp(Number(seasonOutput || 0) / 50, 0, 2.2);
  const lateCareerReduction = age > 34 ? (age - 34) * 1.15 : 0;
  const rawCaps = rnd(2, 6) + quality * 4.3 + ageFactor * 2.1 + weakerTeamMinutes + eliteStarMinutes + productionBoost - lateCareerReduction;
  const seasonMax = starQuality >= .9 && age >= 24 && age <= 32 ? 16 : 13;

  return clamp(Math.round(rawCaps), 0, Math.min(seasonMax, remaining));
}
function psSimSeason(){
  const a=playerSim.age,c=playerSim.club,r=psRate(a,c),tf=c.level/100,apps=clamp(Math.round(rnd(22,44)+(r-75)*.22+(a>34?-rnd(4,12):0)),5,60);
  let g=0,ast=0,cs=0;
  if(playerSim.position==='GK'){cs=Math.round(apps*(.20+tf*.20)+rnd(-3,4));ast=rnd(0,1)}
  if(playerSim.position==='DEF'){g=Math.max(0,Math.round(apps*.035+(r-75)*.04+rnd(-1,2)));ast=Math.max(0,Math.round(apps*.07+rnd(-1,3)));cs=Math.round(apps*(.14+tf*.18)+rnd(-3,3))}
  if(playerSim.position==='MID'){g=Math.max(0,Math.round(apps*(.09+(r-75)*.004)+rnd(-2,4)));ast=Math.max(0,Math.round(apps*(.16+(r-75)*.006)+rnd(-2,5)))}
  if(playerSim.position==='ST'){g=Math.max(0,Math.round(apps*(.28+(r-75)*.010)+tf*3+rnd(-4,6)));ast=Math.max(0,Math.round(apps*.10+(r-75)*.08+rnd(-2,4)))}
  const titleChance=c.band==='elite'?clamp((c.level-82)/42,.08,.55):c.band==='top'?clamp((c.level-80)/60,.03,.22):c.band==='upper'?clamp((c.level-72)/100,.01,.09):.01;
  const titles=Math.random()<titleChance?1:0,ucl=Math.random()<(['elite','top'].includes(c.band)?clamp((c.level-88)/58,.003,.22):.001)?1:0,cups=Math.random()<clamp((c.level-62)/120,.02,.22)?1:0;
  const tier=psNationTier();
  const seasonOutput=g+ast+(playerSim.position==='GK'||playerSim.position==='DEF'?Math.max(0,cs)*.35:0);
  const internationalCaps=psInternationalCapsForSeason(a,r,apps,seasonOutput);
  const isWorldCupYear=[22,26,30,34,38].includes(a);
  const wcBase={1:.002,2:.004,3:.008,4:.015,5:.026}[tier]||.006;
  const wcBoost=clamp((r-86)/260,0,.025)+(internationalCaps>=6?.006:0)+(playerSim.position==='ST'&&g>=20?.004:0);
  const wc=(isWorldCupYear&&internationalCaps>0&&Math.random()<clamp(wcBase+wcBoost,0,.055))?1:0;
  const bdor=Math.random()<clamp((r+g*(playerSim.position==='ST'?1:.35)+ast*.45+titles*4+ucl*8+wc*12+(c.band==='elite'?3:0)-126)/120,0,.28)?1:0;
  const s={age:a,club:c.name,rating:r,apps,goals:g,assists:ast,cleanSheets:Math.max(0,cs),internationalCaps,yellowCards:playerSim.position==='GK'?rnd(0,2):playerSim.position==='DEF'?rnd(3,10):rnd(1,7),redCards:Math.random()<(playerSim.position==='GK'?.03:.10)?1:0,titles,championsLeagues:ucl,leagueCups:cups,worldCups:wc,ballonDors:bdor};
  Object.keys(playerSim.totals).forEach(k=>playerSim.totals[k]+=Number(s[k]||0)); playerSim.career.push(s); playerSim.clubs[c.name]=(playerSim.clubs[c.name]||0)+1; return s;
}

function psForm(s){ return clamp((s.rating-70)/25+(s.goals+s.assists+s.cleanSheets*.45)/70,0,2.4); }
function psEligible(c,s){ const rep=s.rating+psForm(s)*8+(playerSim.age<24?3:0)-(playerSim.age>32?5:0); return c.level>=94?rep>=88:c.level>=86?rep>=82:c.level>=78?rep>=74:c.level>=68?rep>=64:true; }
function psFee(target,current,last){ const age=playerSim.age,r=last.rating,f=clamp(.42+psForm(last)*.36,.45,1.42),pb=playerSim.position==='ST'?1.08:playerSim.position==='MID'?.94:playerSim.position==='DEF'?.78:.60,av=age<22?1.18:age<28?1.08:age<31?.86:age<34?.52:.25,w=.55+target.wealth/110,l=.70+target.level/175,base=Math.pow(Math.max(1,r-58),1.22)*pb*av*f*w*l,rich=(target.wealth>85&&r>=88&&age<=29)?rnd(15,65):0,record=(target.wealth>92&&r>=92&&age<=27&&Math.random()<.14)?rnd(55,115):0,up=Math.max(0,target.level-current.level)*rnd(0,1.2); return clamp(Math.round((base+rich+record+up+rnd(-10,10))/5)*5,1,240); }
function psOffers(last){ const interest=clamp((last.rating-69)/32+psForm(last)*.24+(playerSim.club.level-70)/110,0,.90); if(Math.random()>interest&&playerSim.age>20)return[]; let pool=PLAYER_SIM_CLUBS.filter(c=>c.name!==playerSim.club.name&&psEligible(c,last)); const weighted=[]; pool.forEach(c=>{let w=1+Math.max(0,100-Math.abs((last.rating+psForm(last)*7)-c.level))/22+Math.random()*2.5;if(c.wealth>85&&last.rating>=86)w+=2.5;if(c.level<75&&last.rating<79)w+=2;for(let i=0;i<Math.max(1,Math.round(w));i++)weighted.push(c)}); const out=[],count=Math.random()<.30?1:2; while(out.length<count&&weighted.length){const c=pick(weighted); if(!out.some(o=>o.club.name===c.name))out.push({club:c,fee:psFee(c,playerSim.club,last)}); for(let i=weighted.length-1;i>=0;i--) if(weighted[i].name===c.name) weighted.splice(i,1)} return out; }
function psSeason(){
  const s=psSimSeason(); if(playerSim.age>=playerSim.retireAge){psRevealPrompt();return}
  playerSim.offers=psOffers(s);
  const retire=playerSim.age>=33?`<button class="ps-choice retire" data-ps-choice="retire"><p class="eyebrow">Retire</p><h3>End career at ${playerSim.age}</h3><p>Protect your legacy now, or risk declining seasons lowering the final score.</p><span class="ps-pill">Reveal final rating</span></button>`:'';
  const p=psPanel();
  p.innerHTML=`<div class="ps-card"><div class="ps-box ps-dark"><p class="eyebrow">Season complete</p><h2>Age ${s.age} at ${esc(s.club)}</h2><p>${esc(playerSim.name)} has completed another professional season. Choose the next career path. Detailed stats will be revealed at retirement.</p></div><div class="ps-choices"><button class="ps-choice" data-ps-choice="stay"><p class="eyebrow">Stay</p><h3>${esc(playerSim.club.name)}</h3><p>Keep playing and try to add to the legacy.</p><span class="ps-pill">Continue career</span></button>${playerSim.offers.length?playerSim.offers.map((o,i)=>psClubCard(o.club,'Transfer offer',o.fee,'data-ps-choice',i)).join(''):`<div class="ps-choice disabled"><p class="eyebrow">No offers</p><h3>No formal bids this season</h3><p>Your player can stay, or retire if aged 33+.</p></div>`}${retire}</div><div class="ps-actions ps-career-actions"></div></div>`;
  p.querySelectorAll('[data-ps-choice]').forEach(b=>b.onclick=()=>psChoose(b.dataset.psChoice));
  addPlayerSimRestartButton();
}

function psChoose(ch){ if(ch==='retire'){playerSim.manualRetired=true;psRevealPrompt();return} if(ch==='stay'){playerSim.stays++;if(playerSim.offers.length)playerSim.highestRejected=Math.max(playerSim.highestRejected,Math.max(...playerSim.offers.map(o=>o.fee)))} else {const o=playerSim.offers[Number(ch)]; if(o){playerSim.club=o.club;playerSim.fees+=o.fee;playerSim.moves++}} playerSim.age++; psSeason(); }
function psLoyalty(){ const ys=Object.values(playerSim.clubs), longest=ys.length?Math.max(...ys):0,len=Math.max(1,playerSim.career.length); return clamp(Math.round(42+(longest/len)*42+playerSim.stays*2.2+(playerSim.highestRejected>=80?8:playerSim.highestRejected>=40?4:0)-playerSim.moves*7),0,100); }
function psScore(){
  const t=playerSim.totals,l=psLoyalty(),pos=playerSim.position;
  const career=Array.isArray(playerSim.career)?playerSim.career:[];
  const clubRows=career.map(season=>PLAYER_SIM_CLUBS.find(c=>c.name===season.club)).filter(Boolean);
  const eliteSeasons=clubRows.filter(c=>c.band==='elite').length;
  const topSeasons=clubRows.filter(c=>c.band==='top').length;
  const avgLevel=clubRows.length ? clubRows.reduce((sum,c)=>sum+Number(c.level||0),0)/clubRows.length : 70;
  const apps=Number(t.apps||0), goals=Number(t.goals||0), assists=Number(t.assists||0), cleanSheets=Number(t.cleanSheets||0);
  const titles=Number(t.titles||0), ucl=Number(t.championsLeagues||0), cups=Number(t.leagueCups||0), wc=Number(t.worldCups||0), bdor=Number(t.ballonDors||0), caps=Number(t.internationalCaps||0);

  const appsScore=Math.min(18, apps/36);
  let output=0;
  if(pos==='ST') output=Math.min(30, goals/18 + assists/85);
  // Midfielders should be rated more on creativity and career legacy than raw goals.
  // Goals still help, but assists carry more of the position-specific output score.
  else if(pos==='MID') output=Math.min(28, assists/13.5 + goals/80);
  else if(pos==='DEF') output=Math.min(24, cleanSheets/12 + goals/75 + assists/95);
  else output=Math.min(24, cleanSheets/11 + assists/120);

  const trophies=Math.min(28, titles*3.2 + ucl*8.8 + cups*1.4 + wc*8.5);
  const individual=Math.min(18, bdor*8.5);
  const reputation=Math.min(8.5, eliteSeasons*.38 + topSeasons*.22 + Math.max(0,avgLevel-78)/4.5 + Number(playerSim.fees||0)/210);
  const loyaltyScore=Math.min(5, l*.05);
  // Caps are shown as a realistic career stat, but they do not influence the Player Simulation score.
  const capScore=0;

  let bonus=0;
  if(apps>=550) bonus+=2;
  if(apps>=700) bonus+=1;
  if(pos==='ST' && goals>=250) bonus+=3;
  if(pos==='ST' && goals>=400) bonus+=3;
  if(pos==='MID' && assists>=150) bonus+=3;
  if(pos==='MID' && assists>=220) bonus+=2;
  if((pos==='DEF'||pos==='GK') && cleanSheets>=160) bonus+=2;
  if((pos==='DEF'||pos==='GK') && cleanSheets>=240) bonus+=2;
  if(titles>=4) bonus+=1;
  if(titles>=8) bonus+=2;
  if(ucl>=1) bonus+=3;
  if(ucl>=3) bonus+=2;
  if(wc>=1) bonus+=2;
  if(bdor>=1) bonus+=5;
  if(bdor>=3) bonus+=3;

  let sc=Math.round(appsScore+output+trophies+individual+reputation+loyaltyScore+capScore+bonus);

  // Guardrails: 90+ should require elite-level honours, not just longevity, loyalty or clean sheets.
  if(ucl===0 && bdor===0){
    sc=Math.min(sc, (wc>=1 && titles>=3) ? 86 : 82);
  } else if(ucl===0){
    sc=Math.min(sc, bdor>=1 ? 91 : 88);
  } else if(bdor===0 && wc===0 && ucl<2){
    sc=Math.min(sc, 89);
  }
  if(sc>=90 && !(ucl>=1 && (bdor>=1 || wc>=1 || titles>=6))) sc=Math.min(sc,89);
  if(sc>=95 && !(bdor>=1 && (ucl>=3 || wc>=1))) sc=Math.min(sc,94);
  // 97+ should be extremely rare. A great career can still sit in the mid-90s,
  // but near-perfect ratings need multiple elite individual and team honours.
  if(sc>=97 && !(bdor>=2 && (ucl>=3 || wc>=1) && titles>=4 && apps>=500)) sc=Math.min(sc,96);
  if(sc>=98 && !(bdor>=3 && (ucl>=3 || wc>=2) && titles>=6 && apps>=550)) sc=Math.min(sc,97);
  if(sc>=99 && !(bdor>=4 && ucl>=4 && wc>=2 && titles>=7 && apps>=600)) sc=Math.min(sc,98);

  // Career floors: big statistical careers should not be punished into unrealistic low scores.
  // These floors never push a player into elite/all-time territory by themselves; they only keep
  // strong careers in a sensible band before the 90+ guardrails above apply.
  if(pos==='ST' && goals>=220 && apps>=450) sc=Math.max(sc,70);
  if(pos==='ST' && goals>=260 && apps>=500) sc=Math.max(sc,74);
  if(pos==='ST' && goals>=280 && apps>=550 && (titles>=1 || cups>=2 || wc>=1)) sc=Math.max(sc,78);
  if(pos==='ST' && goals>=290 && apps>=550 && wc>=1 && titles>=2) sc=Math.max(sc,82);

  // Midfielder floors: strong creative careers should not rely on striker-level goal totals.
  // These floors keep good midfielders in a realistic band, while the 90+ guardrails above still prevent easy elite scores.
  if(pos==='MID' && assists>=130 && apps>=450) sc=Math.max(sc,64);
  if(pos==='MID' && assists>=150 && apps>=520 && (titles>=1 || cups>=1 || wc>=1)) sc=Math.max(sc,68);
  if(pos==='MID' && assists>=160 && goals>=70 && apps>=560 && (titles>=1 || cups>=2 || wc>=1)) sc=Math.max(sc,72);
  if(pos==='MID' && assists>=175 && apps>=580 && (titles>=3 || ucl>=1 || bdor>=1 || wc>=1)) sc=Math.max(sc,75);
  if(pos==='MID' && assists>=190 && apps>=600 && (titles>=5 || ucl>=2 || bdor>=1 || wc>=1)) sc=Math.max(sc,79);

  if(pos==='DEF' && cleanSheets>=150 && apps>=450) sc=Math.max(sc,68);
  if(pos==='DEF' && cleanSheets>=190 && apps>=550 && (titles>=1 || cups>=1 || wc>=1)) sc=Math.max(sc,76);
  if(pos==='DEF' && cleanSheets>=220 && apps>=600 && (titles>=3 || ucl>=1 || wc>=1)) sc=Math.max(sc,80);

  if(pos==='GK' && cleanSheets>=150 && apps>=450) sc=Math.max(sc,68);
  if(pos==='GK' && cleanSheets>=200 && apps>=550 && (titles>=1 || cups>=1 || wc>=1)) sc=Math.max(sc,76);
  if(pos==='GK' && cleanSheets>=240 && apps>=600 && (titles>=3 || ucl>=1 || wc>=1)) sc=Math.max(sc,80);

  return clamp(sc,1,100);
}

function psPayload(sc,l){ return {apps:playerSim.totals.apps||0,goals:playerSim.totals.goals||0,assists:playerSim.totals.assists||0,cleanSheets:(playerSim.position==='GK'||playerSim.position==='DEF')?(playerSim.totals.cleanSheets||0):'N/A',internationalCaps:playerSim.totals.internationalCaps||0,nationality:psNationName(),yellowCards:playerSim.totals.yellowCards||0,redCards:playerSim.totals.redCards||0,titles:playerSim.totals.titles||0,championsLeagues:playerSim.totals.championsLeagues||0,leagueCups:playerSim.totals.leagueCups||0,worldCups:playerSim.totals.worldCups||0,ballonDors:playerSim.totals.ballonDors||0,transferFees:playerSim.fees||0,loyalty:l||0,position:playerSim.position,retiredAt:playerSim.age}; }
function psRevealPrompt(){
  const p=psPanel();
  p.innerHTML=`<div class="ps-card"><div class="ps-box ps-dark"><p class="eyebrow">Career complete</p><h2>${esc(playerSim.name)} has retired at ${playerSim.age}</h2><p>The full career has been simulated. Reveal the final stats and career rating one by one.</p><div class="ps-actions"><button class="btn btn-primary" id="psReveal">Reveal career stats</button></div></div></div>`;
  $('psReveal').onclick=psResults;
  addPlayerSimRestartButton();
}

const psStat=(a,b)=>`<div class="ps-stat"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`;
function psResults(){
  const sc=psScore(),l=psLoyalty(),pl=psPayload(sc,l),clubs=Object.entries(playerSim.clubs).sort((a,b)=>b[1]-a[1]);
  const p=psPanel();
  p.innerHTML=`<div class="ps-card"><div class="ps-grid"><div class="ps-score"><div><span>Career rating</span><strong id="psFinalScore">?</strong><span>/100</span></div></div><div class="ps-box"><p class="eyebrow">Retired at ${playerSim.age}</p><h2>${esc(playerSim.name)}'s ${esc(playerSim.position)} career</h2><p><strong>Position: ${esc(playerSim.position)}</strong><br><strong>Nationality: ${esc(psNationName())}</strong><br>${sc>=95?'All-time great career.':sc>=85?'Outstanding career.':sc>=70?'Very good career.':sc>=55?'Solid professional career.':'Journeyman career.'} Loyalty score: ${l}/100.</p><div class="ps-actions ps-results-actions"><button class="btn btn-deep" id="psSharePicture">Share picture</button><button class="btn btn-deep" id="psSavePicture">Save picture</button><button class="btn btn-primary" id="psSubmit">Submit to leaderboard</button><button class="btn btn-deep" id="psAgain">Play again</button></div><p id="psSubmitStatus" class="muted"></p></div></div><div class="ps-stats" style="margin-top:16px">${psStat('Position',playerSim.position)}${psStat('Nationality',pl.nationality)}${psStat('Caps',pl.internationalCaps)}${psStat('Appearances',pl.apps)}${psStat('Goals',pl.goals)}${psStat('Assists',pl.assists)}${psStat('Clean sheets',pl.cleanSheets)}${psStat('Yellow cards',pl.yellowCards)}${psStat('Red cards',pl.redCards)}${psStat('League titles',pl.titles)}${psStat('Champions Leagues',pl.championsLeagues)}${psStat('League cups',pl.leagueCups)}${psStat('World Cups',pl.worldCups)}${psStat("Ballon d'Ors",pl.ballonDors)}${psStat('Transfer fees',money(pl.transferFees))}${psStat('Loyalty',pl.loyalty+'/100')}</div><div style="margin-top:16px"><p class="eyebrow">Clubs</p><div class="ps-clubs">${clubs.map(r=>`<span>${esc(r[0])} - ${r[1]} yr${r[1]===1?'':'s'}</span>`).join('')}</div></div><div class="ps-timeline">${playerSim.career.map(s=>`<div class="ps-year"><strong>${s.age}</strong><span>${esc(s.club)} - ${s.apps} apps, ${s.goals} goals, ${s.assists} assists${(playerSim.position==='GK'||playerSim.position==='DEF')?', '+s.cleanSheets+' clean sheets':''}${s.internationalCaps?', '+s.internationalCaps+' caps':''}</span><strong>${s.rating}</strong></div>`).join('')}</div></div>`;
  $('psAgain').onclick=renderPSStart;
  $('psSubmit').onclick=()=>psSubmitScore(sc,pl);
  $('psSavePicture').onclick=()=>psSavePicture(sc,pl);
  $('psSharePicture').onclick=()=>psSharePicture(sc,pl);
  recordPlayerSimulationStats(sc,pl);
  setTimeout(()=>{$('psFinalScore').textContent=sc},350);
  document.querySelectorAll('#playerSimulationPanel .ps-stat,#playerSimulationPanel .ps-year').forEach((el,i)=>setTimeout(()=>el.classList.add('show'),650+i*80));
}

async function recordPlayerSimulationStats(score, payload){
  if(!playerSim) return false;
  return recordCompletedModeStats(MODE_LABELS.playerSim, {
    source:'player_simulation_result',
    score:Number(score||0),
    playerName:String(playerSim.name||'Player').slice(0,32),
    position:payload?.position||playerSim.position||'',
    nationality:payload?.nationality||psNationName(),
    caps:Number(payload?.internationalCaps||0),
    goals:Number(payload?.goals||0),
    assists:Number(payload?.assists||0),
    worldCups:Number(payload?.worldCups||0)
  });
}

async function psSubmitScore(sc,pl){ if(playerSimSubmitted)return; try{ await recordPlayerSimulationStats(sc,pl); await ensureFirebase(); await firebase.database().ref('leaderboard').push({username:safeGeneratedLeaderboardName(playerSim.name,'Player'),score:sc,gameMode:MODE_LABELS.playerSim,careerStats:pl,timestamp:Date.now()}); playerSimSubmitted=true; $('psSubmitStatus').textContent='Player Simulation score submitted to leaderboard.'; $('psSubmit').disabled=true; }catch(e){ $('psSubmitStatus').textContent='Could not submit score. '+(e.message||e); } }





// ---------- Direct game-mode links from content pages ----------
function getRequestedModeFromQuery(){ try { const params = new URLSearchParams(location.search); return String(params.get('mode') || params.get('play') || '').trim().toLowerCase(); } catch (error) { return ''; } }
function focusOnlineRoomEntry(){ renderHome(); setTimeout(() => { const field = $('onlineRoomName'); const panel = $('gameEntryPanel'); if (panel) panel.scrollIntoView({ behavior:'smooth', block:'start' }); if (field) field.focus(); }, 120); }
function setModeBackTarget(target='game-modes.html'){ modeBackTarget = target; if (els.resetBtn) els.resetBtn.textContent = 'Back'; }
async function createOnlineRoomFromGameModes(){ renderHome(); setModeBackTarget('game-modes.html'); const enteredName = window.prompt('Enter your name to create an online room:'); if (enteredName === null) { focusOnlineRoomEntry(); return true; } const field = $('onlineRoomName'); if (field) field.value = enteredName.trim(); await createOnlineRoom(); return true; }
async function handleDirectModeRequest(){
  const requested = getRequestedModeFromQuery();
  if (!requested) return false;
  if (new URLSearchParams(location.search).get('room')) return false;
  const aliases = { 'leaderboard':'leaderboard','leaderboards':'leaderboard','solo':'solo','standard':'solo','standard-solo':'solo','ultimate':'ultimate','ultimate-solo':'ultimate','easy':'easy','easy-solo':'easy','league':'league','league-challenge':'league','monthly':'monthly','worldcup':'worldcup','world-cup':'worldcup','leaguelegends':'leaguelegends','league-legends':'leaguelegends','player-simulation':'playerSim','playersimulation':'playerSim','player-sim':'playerSim','online':'online','online-create':'onlineCreate','online-room':'onlineCreate','online-battles':'onlineCreate' };
  const mode = aliases[requested] || requested;
  try {
    if (mode === 'leaderboard') { window.location.href = 'leaderboard.html'; return true; }
    setModeBackTarget('game-modes.html');
    if (mode === 'onlineCreate') return await createOnlineRoomFromGameModes();
    if (mode === 'online') { focusOnlineRoomEntry(); return true; }
    if (mode === 'playerSim') { openPlayerSimulation(); return true; }
    if (mode === 'monthly') { showMonthlyMenu(); return true; }
    if (['solo','ultimate','easy','league','worldcup','leaguelegends'].includes(mode)) { await openSetup(mode); return true; }
  } catch (error) { console.error(error); setMessage(error.message || String(error)); }
  return false;
}



// ---------- Reset and events ----------
async function resetOnlineRoomToLobby(){
  if (!online.enabled || !online.ref) { resetGame(); return; }
  if (!ratingsRevealed && !online.isHost) { setMessage('Only the host can restart the online game while it is in progress.'); return; }
  currentCandidate = null;
  ratingsRevealed = false;
  state = null;
  await online.ref.update({ state:null, currentCandidate:null, ratingsRevealed:false, message:'Game reset. Back in the lobby.', updatedAt:Date.now() });
}
async function restartToModeLobby(){
  if (online.enabled) return resetOnlineRoomToLobby();
  if (state?.challengePreset) {
    const preset = state.challengePreset === 'online' ? selectedPreset : state.challengePreset;
    if (preset === 'playerSim') return renderPSStart();
    return openSetup(preset || 'solo');
  }
  if (document.body.classList.contains('ps-active') || !$('playerSimulationPanel')?.classList.contains('hidden')) return renderPSStart();
  return openSetup(selectedPreset || 'solo');
}

function resetGame(){ if(modeBackTarget){ const target = modeBackTarget; modeBackTarget = ''; window.location.href = target; return; } try{ if(online.ref&&online.subscribed&&typeof online.ref.off==='function') online.ref.off(); }catch(e){console.warn(e)} online.enabled=false; online.isHost=false; online.roomId=null; online.ref=null; online.myName=''; online.subscribed=false; document.body.classList.remove('ps-active'); if(els.draftControls) els.draftControls.style.removeProperty('display'); setMessage(''); const oldTurn=$('turnLockNote'); if(oldTurn) oldTurn.remove(); if(location.search){ try{history.replaceState({},document.title,location.origin+location.pathname)}catch(e){} } if(els.resetBtn) els.resetBtn.textContent='Back'; renderHome(); }
function wireEvents(){
  els.resetBtn?.addEventListener('click', resetGame); els.pickBtn?.addEventListener('click', safe(pickRandomPlayer)); els.acceptBtn?.addEventListener('click', safe(acceptPlayer)); els.declineBtn?.addEventListener('click', safe(declinePlayer)); els.revealBtn?.addEventListener('click', safe(revealScores)); els.bidPickBtn?.addEventListener('click', safe(bidRandomPlayer)); els.awardBidBtn?.addEventListener('click', safe(awardHighestBid)); els.skipBidBtn?.addEventListener('click', safe(skipBidPlayer)); els.leaderboardBtn?.addEventListener('click', () => { window.location.href = 'leaderboard.html'; }); els.leaderboardBackBtn?.addEventListener('click', () => { if(state){ hideAllPanels(); show(ratingsRevealed?els.resultsPanel:els.gamePanel,true); } else renderHome(); });
}
async function init(){ injectStyles(); wireEvents(); loadPlayers(); normaliseLegacyStatsTotals(); renderHome(); await handleDirectModeRequest(); }
init();
