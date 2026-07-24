/******************************************************************************
 * guessThePlayer.ts
 * =============================================================================
 * Data for the reusable Guess The Player marketing video.
 ******************************************************************************/

export interface PlayerClue {
  year: number;
  team: string;
  rating: number;
  crest?: string;
}

export const guessThePlayer = {
  title: "GUESS THE PLAYER",
  subtitle: "Can you work it out?",

  nationalityLabel: "NATIONALITY",
  nationality: "NORWAY",
  nationalityFlag: "flags/norway.png",

  promptTitle: "HOW LONG DID IT TAKE YOU?",
  promptSubtitle: "COMMENT BELOW",

  outroHeadline: "PLAY THE 5-A-SIDE DRAFT GAME",
  website: "ultimate5aside.app",
  buttonText: "PLAY FREE NOW",

  introFrames: 150,
  framesPerClue: 60, // 2 seconds at 30fps
  nationalityFrames: 90,
  promptFrames: 120,
  outroFrames: 120,

  career: [
    {year: 2015, team: "Real Madrid", rating: 67, crest: "crest/real-madrid.png"},
    {year: 2016, team: "Real Madrid", rating: 69, crest: "crest/real-madrid.png"},
    {year: 2017, team: "Real Madrid", rating: 70, crest: "crest/real-madrid.png"},
    {year: 2018, team: "SC Heerenveen", rating: 74, crest: "crest/sc-heerenveen.png"},
    {year: 2019, team: "Vitesse", rating: 77, crest: "crest/vitesse.png"},
    {year: 2020, team: "Real Sociedad", rating: 82, crest: "crest/real-sociedad.png"},
    {year: 2021, team: "Arsenal", rating: 83, crest: "crest/arsenal.png"},
    {year: 2022, team: "Arsenal", rating: 83, crest: "crest/arsenal.png"},
    {year: 2023, team: "Arsenal", rating: 86, crest: "crest/arsenal.png"},
    {year: 2024, team: "Arsenal", rating: 88, crest: "crest/arsenal.png"},
    {year: 2025, team: "Arsenal", rating: 87, crest: "crest/arsenal.png"},
    {year: 2026, team: "Arsenal", rating: 86, crest: "crest/arsenal.png"},
  ] as PlayerClue[],
};

export const guessThePlayerTiming = {
  clueFrames:
    guessThePlayer.career.length * guessThePlayer.framesPerClue +
    guessThePlayer.nationalityFrames,

  totalFrames:
    guessThePlayer.introFrames +
    guessThePlayer.career.length * guessThePlayer.framesPerClue +
    guessThePlayer.nationalityFrames +
    guessThePlayer.promptFrames +
    guessThePlayer.outroFrames,
};
