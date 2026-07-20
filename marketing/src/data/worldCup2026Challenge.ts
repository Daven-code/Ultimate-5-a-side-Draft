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
  title: "WORLD CUP 2026 CHALLENGE",
  subtitle: "OUT NOW",

  buildTitle: "DRAFT YOUR BEST WORLD CUP FIVE",
  outroHeadline: "CAN YOU TOP THE LEADERBOARD?",
  website: "ultimate5aside.app",
  buttonText: "PLAY FREE NOW",

  score: 446,

  team: [
    {
      player: "Thibaut Courtois",
      position: "GK",
      rating: 90,
    },
    {
      player: "William Saliba",
      position: "DEF",
      rating: 88,
    },
    {
      player: "Vitinha",
      position: "MID",
      rating: 90,
    },
    {
      player: "Luiz Diaz",
      position: "MID",
      rating: 87,
    },
    {
      player: "Erling Haaland",
      position: "ST",
      rating: 91,
    },
  ],
};
