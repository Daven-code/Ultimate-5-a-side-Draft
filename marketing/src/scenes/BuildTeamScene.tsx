/******************************************************************************
 * BuildTeamScene.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Reusable landscape team reveal.
 *
 * Used by:
 * • Launch Trailer
 * • Easy Solo Challenge
 * • Monthly Challenge
 * • Future marketing videos
 *
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {LightRays} from "../components/LightRays";
import {Vignette} from "../components/Vignette";
import {AnimatedText} from "../components/AnimatedText";

import {
  Player,
  PlayerFlyIn,
} from "../components/PlayerFlyIn";

import {ScoreReveal} from "../components/ScoreReveal";

interface Props {

  title?: string;

  team?: Player[];

  score?: number;

}

/*
 * Default team used by the Launch Trailer.
 */

const defaultTeam: Player[] = [

  {
    player: "Buffon (2005)",
    position: "GK",
    rating: 97,
  },

  {
    player: "Sergio Ramos (2018)",
    position: "DEF",
    rating: 90,
  },

  {
    player: "Ronaldinho (2006)",
    position: "MID",
    rating: 95,
  },

  {
    player: "Kevin De Bruyne (2022)",
    position: "MID",
    rating: 91,
  },

  {
    player: "Lionel Messi (2012)",
    position: "ST",
    rating: 94,
  },

];

export const BuildTeamScene: React.FC<Props> = ({

  title = "BUILD YOUR TEAM",

  team = defaultTeam,

  score = 467,

}) => {

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Background/>

      <LightRays/>

      <Particles/>

      <FootballPitch/>

      <AnimatedText
        text={title}
        top={70}
        size={60}
      />

      <PlayerFlyIn
        delay={0}
        x={250}
        y={320}
        player={team[0]}
      />

      <PlayerFlyIn
        delay={15}
        x={560}
        y={320}
        player={team[1]}
      />

      <PlayerFlyIn
        delay={30}
        x={870}
        y={320}
        player={team[2]}
      />

      <PlayerFlyIn
        delay={45}
        x={1180}
        y={320}
        player={team[3]}
      />

      <PlayerFlyIn
        delay={60}
        x={1490}
        y={320}
        player={team[4]}
      />

      <ScoreReveal
        score={score}
      />

      <Vignette/>

    </AbsoluteFill>

  );

};