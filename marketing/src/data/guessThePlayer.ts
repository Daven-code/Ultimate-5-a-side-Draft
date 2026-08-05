/****************************************************************************
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
  title: "GUESS THE PLAYER #2",
  subtitle: "Can you work it out?",

  nationalityLabel: "NATIONALITY",
  nationality: "BRAZIL",
  nationalityFlag: "flags/brazil.png",

  promptTitle: "HOW LONG DID IT TAKE YOU?",
  promptSubtitle: "COMMENT BELOW",

  outroHeadline: "PLAY THE 5-A-SIDE DRAFT GAME",
  website: "ultimate5aside.app",
  buttonText: "PLAY FREE NOW",

  introFrames: 150,
  framesPerClue: 60,
  nationalityFrames: 90,
  promptFrames: 120,
  outroFrames: 120,

  career: [
    {year: 2010, team: "Santos", rating: 73, crest: "crest/santos.png"},
    {year: 2011, team: "Santos", rating: 78, crest: "crest/santos.png"},
    {year: 2012, team: "Santos", rating: 85, crest: "crest/santos.png"},
    {year: 2013, team: "Santos", rating: 83, crest: "crest/santos.png"},
    {year: 2014, team: "Barcelona", rating: 85, crest: "crest/barcelona.png"},
    {year: 2015, team: "Barcelona", rating: 86, crest: "crest/barcelona.png"},
    {year: 2016, team: "Barcelona", rating: 90, crest: "crest/barcelona.png"},
    {year: 2017, team: "Barcelona", rating: 92, crest: "crest/barcelona.png"},
    {year: 2018, team: "PSG", rating: 92, crest: "crest/psg.png"},
    {year: 2019, team: "PSG", rating: 92, crest: "crest/psg.png"},
    {year: 2020, team: "PSG", rating: 92, crest: "crest/psg.png"},
    {year: 2021, team: "PSG", rating: 91, crest: "crest/psg.png"},
    {year: 2022, team: "PSG", rating: 90, crest: "crest/psg.png"},
    {year: 2023, team: "PSG", rating: 89, crest: "crest/psg.png"},
    {year: 2024, team: "Al Hilal", rating: 88, crest: "crest/al-hilal.png"},
    {year: 2025, team: "Al Hilal", rating: 84, crest: "crest/al-hilal.png"},
    {year: 2026, team: "Santos", rating: 83, crest: "crest/santos.png"},
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
