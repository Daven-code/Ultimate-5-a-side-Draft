/**
 * World Cup 2026 Challenge marketing-video data.
 *
 * This mirrors the same pattern as your Easy Solo Challenge data file:
 * - video files import one challenge object
 * - FeatureIntro receives title/subtitle
 * - BuildTeamScene receives title/team/score
 * - FeatureOutro receives headline/button text
 *
 * The team below is for the promo animation only. If you want the trailer to
 * display real generated picks later, just swap these five cards.
 */

export const worldCup2026Challenge = {
  title: "WORLD CUP 2026",
  subtitle: "LAST 16 DRAFT CHALLENGE",

  buildTitle: "DRAFT YOUR WORLD CUP FIVE",
  outroHeadline: "CAN YOU TOP THE WORLD CUP LEADERBOARD?",
  website: "ultimate5aside.app",
  buttonText: "PLAY FREE NOW",

  score: 470,

  team: [
    {
      player: "World Cup GK",
      position: "GK",
      rating: 91,
    },
    {
      player: "Elite Defender",
      position: "DEF",
      rating: 93,
    },
    {
      player: "Midfield Maestro",
      position: "MID",
      rating: 94,
    },
    {
      player: "Creative Winger",
      position: "MID",
      rating: 95,
    },
    {
      player: "Tournament Striker",
      position: "ST",
      rating: 97,
    },
  ],
};
