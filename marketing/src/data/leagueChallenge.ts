/******************************************************************************
 * leagueChallenge.ts
 * =============================================================================
 * Data for the League Challenge marketing video.
 *
 * PURPOSE
 * -------
 * Promo data only. The animation code can be reused for future campaigns.
 ******************************************************************************/

import {Player} from "../components/PlayerFlyIn";

export interface LeagueOption {
  name: string;
  accent: string;
  selected?: boolean;
}

export const leagueChallenge = {
  title: "LEAGUE CHALLENGE",
  subtitle: "DRAFT FROM YOUR FAVOURITE LEAGUES",

  selectionTitle: "SELECT YOUR LEAGUES",
  selectionSubtitle: "Pick one or more leagues.",
  selectedSummary: "Premier League + La Liga selected",
  poolLabel: "2005 - 2026",

  buildTitle: "DRAFT YOUR FIVE",
  score: 441,

  outroHeadline: "CAN YOU TOP THE LEADERBOARD?",
  website: "ultimate5aside.app",
  buttonText: "PLAY FREE NOW",

  introFrames: 90,
  selectionFrames: 300,
  buildFrames: 240,
  outroFrames: 120,

  leagues: [
    {name: "Premier League", accent: "#60A5FA", selected: true},
    {name: "La Liga", accent: "#FACC15", selected: true},
    {name: "Serie A", accent: "#A78BFA"},
    {name: "Bundesliga", accent: "#F87171"},
    {name: "Ligue 1", accent: "#34D399"},
    {name: "Primeira Liga", accent: "#22C55E"},
    {name: "All Other Leagues", accent: "#94A3B8"},
  ] as LeagueOption[],

  team: [
    {
      player: "Petr Cech (2008)",
      position: "GK",
      rating: 89,
    },
    {
      player: "Gerard Pique (2012)",
      position: "DEF",
      rating: 88,
    },
    {
      player: "Michael Ballack (2007)",
      position: "MID",
      rating: 87,
    },
    {
      player: "Luka Modric (2018)",
      position: "MID",
      rating: 89,
    },
    {
      player: "Antoine Griezmann (2024)",
      position: "ST",
      rating: 88,
    },
  ] as Player[],
};

export const leagueChallengeTiming = {
  totalFrames:
    leagueChallenge.introFrames +
    leagueChallenge.selectionFrames +
    leagueChallenge.buildFrames +
    leagueChallenge.outroFrames,
};
