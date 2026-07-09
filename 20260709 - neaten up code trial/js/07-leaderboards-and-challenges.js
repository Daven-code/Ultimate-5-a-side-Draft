/* ============================================================
   07-leaderboards-and-challenges.js
   LEADERBOARDS + CHALLENGE ENTRY: leaderboard submission/page/tabs and homepage challenge-card routing

   Refactor note:
   This file is loaded as a normal browser script, not an ES module.
   Files must remain in the order listed in index.html because the
   original working app.js used sequential overrides.
   ============================================================ */

/* ============================================================
   QUICK EDIT GUIDE - LEADERBOARDS AND CHALLENGE CARDS

   Leaderboard save labels are controlled by:
   leaderboardGameModeLabelStep19()

   Leaderboard filter tabs are controlled by:
   loadLeaderboardStep20() and setActiveLeaderboardTabStep20()

   Homepage challenge buttons set window.challengePreset from their
   data-challenge attribute in index.html.
   ============================================================ */

// --- step19 realtime database leaderboard submit on results reveal ---
// Adds a "Submit to leaderboard" button to the final results screen.
// The button appears after ratings are revealed, validates the username,
// then writes the top final score into Realtime Database at /leaderboard.
(function () {
  function leaderboardGameModeLabelStep19() {
    if (!state) return "Unknown";
    if (!online.enabled &&
    state.gameMode === "draft" &&
    Number(state.userCount || 0) === 1) {

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

      if (filter && filter !== "all") {

        if (filter === "solo") {

          entries = entries.filter(entry =>
            entry.gameMode === "Solo Challenge" ||
            entry.gameMode === "Ultimate Solo Mode" ||
            entry.gameMode === "Easy Solo Challenge"
          );

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
    $("leaderboardBtn")?.addEventListener("click", safe(openLeaderboardStep20));
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

