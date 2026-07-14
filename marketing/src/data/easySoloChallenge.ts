/******************************************************************************
 * easySoloChallenge.ts
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Data for the Easy Solo Challenge marketing video.
 *
 * The animation code never changes.
 * Only this file changes for future campaigns.
 *
 ******************************************************************************/

import {Player} from "../components/PlayerFlyIn";

export interface ChallengeVideo {

  title: string;

  subtitle: string;

  score: number;

  team: Player[];

}

export const easySoloChallenge: ChallengeVideo = {

  title: "EASY SOLO CHALLENGE",

  subtitle: "Build your dream 5-a-side",

  score: 450,

  team: [

    {
      player: "Manuel Neuer (2015)",
      position: "GK",
      rating: 90,
    },

    {
      player: "Alessandro Nesta (2007)",
      position: "DEF",
      rating: 91,
    },

    {
      player: "Mesut Özil (2017)",
      position: "MID",
      rating: 89,
    },

    {
      player: "Frank Lampard (2007)",
      position: "MID",
      rating: 89,
    },

    {
      player: "Robert Lewandowski (2023)",
      position: "ST",
      rating: 91,
    },

  ],

};