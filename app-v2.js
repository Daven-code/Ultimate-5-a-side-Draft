/**********************************************************************
 * Ultimate 5-a-side Draft
 * Version : 2.0.0-alpha1
 * File    : app-v2.js
 * Batch   : 1 - Part 3
 **********************************************************************/

const APP_INFO={
    name:"Ultimate 5-a-side Draft",
    version:"2.0.0-alpha1",
    build:1
};

const TEAM_SHAPE=["GK","DEF","MID","MID","FWD"];
const AUCTION_BUDGET=100;
const DECLINES_ALLOWED=3;
const BID_SKIPS_ALLOWED=3;

const AppState={
    currentScreen:"home",
    players:[],
    currentChallenge:null,
    game:null,
    online:{
        enabled:false,
        roomId:null,
        isHost:false,
        connected:false
    },
    developerMode:false
};

const $=id=>document.getElementById(id);

const Screens={
    home:$("homeScreen"),
    challenge:$("challengeScreen"),
    game:$("gameScreen"),
    results:$("resultsScreen"),
    leaderboard:$("leaderboardScreen")
};

function showScreen(screenName){
    Object.values(Screens).forEach(screen=>{
        if(screen){
            screen.classList.remove("active");
            screen.classList.add("hidden");
        }
    });

    const target=Screens[screenName];

    if(target){
        target.classList.remove("hidden");
        target.classList.add("active");
        AppState.currentScreen=screenName;
    }
}

function setVersionText(){
    const el=$("versionText");
    if(el) el.textContent=`v${APP_INFO.version}`;
}

function log(message){
    console.log(`[Ultimate5] ${message}`);
}

function registerEvents(){
    const leaderboardBtn=$("leaderboardBtn");
    if(leaderboardBtn){
        leaderboardBtn.addEventListener("click",()=>showScreen("leaderboard"));
    }
}


/**********************************************************************
 * Ultimate 5-a-side Draft
 * Version : 2.0.0-alpha1
 * File    : app-v2.js
 * Batch   : 1 - Part 4
 **********************************************************************/

/**********************************************************************
 * PLAYER LOADING
 **********************************************************************/

async function loadPlayers(){

    try{

        const response = await fetch("players.json",{cache:"no-store"});

        if(!response.ok){
            throw new Error(`Unable to load players.json (${response.status})`);
        }

        AppState.players = await response.json();

        log(`Loaded ${AppState.players.length} players`);

    }
    catch(error){

        console.error(error);

        alert(
            "Version 2 could not load players.json.\n\n" +
            "Check the file exists beside index-v2.html."
        );

    }

}

/**********************************************************************
 * STARTUP
 **********************************************************************/

async function startApplication(){

    await loadPlayers();

    log("Application Ready");

}

/**********************************************************************
 * INITIALISE
 **********************************************************************/

async function initialiseFoundation(){

    log("Starting Version 2...");

    setVersionText();

    registerEvents();

    showScreen("home");

    await startApplication();

}

document.removeEventListener("DOMContentLoaded", initialiseFoundation);
document.addEventListener("DOMContentLoaded", initialiseFoundation);
