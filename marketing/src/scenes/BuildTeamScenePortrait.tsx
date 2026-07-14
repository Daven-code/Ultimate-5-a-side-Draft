/******************************************************************************
 * BuildTeamScenePortrait.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Reusable portrait team reveal.
 *
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";

import {Background} from "../components/Background";
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {LightRays} from "../components/LightRays";
import {Vignette} from "../components/Vignette";
import {AnimatedText} from "../components/AnimatedText";
import {PLAYER_CARD_WIDTH} from "../components/PlayerCard";

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

export const BuildTeamScenePortrait: React.FC<Props> = ({
  title = "BUILD YOUR DREAM TEAM",
  team = defaultTeam,
  score = 467,
}) => {

  const {width} = useVideoConfig();

  const goalkeeper = team.find((p) => p.position === "GK");
  const defender = team.find((p) => p.position === "DEF");
  const midfielders = team.filter((p) => p.position === "MID");
  const striker = team.find((p) => p.position === "ST");

  /*
   * Automatically centre the formation based on the
   * composition width and player card size.
   */
  const centreX = (width - PLAYER_CARD_WIDTH) / 2;

  const midfieldSpacing = 270;

  const leftMidX = centreX - midfieldSpacing;
  const rightMidX = centreX + midfieldSpacing;

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
        top={120}
        size={56}
      />

      {/* ---------------- STRIKER ---------------- */}

      {striker && (
        <PlayerFlyIn
          delay={72}
          x={centreX}
          y={350}
          player={striker}
        />
      )}

      {/* ---------------- MIDFIELD ---------------- */}

      {midfielders[0] && (
        <PlayerFlyIn
          delay={36}
          x={leftMidX}
          y={620}
          player={midfielders[0]}
        />
      )}

      {midfielders[1] && (
        <PlayerFlyIn
          delay={54}
          x={rightMidX}
          y={620}
          player={midfielders[1]}
        />
      )}

      {/* ---------------- DEFENDER ---------------- */}

      {defender && (
        <PlayerFlyIn
          delay={18}
          x={centreX}
          y={900}   // moved up 30px
          player={defender}
        />
      )}

      {/* ---------------- GOALKEEPER ---------------- */}

      {goalkeeper && (
        <PlayerFlyIn
          delay={0}
          x={centreX}
          y={1250}  // moved down 10px
          player={goalkeeper}
        />
      )}

      <ScoreReveal
        score={score}
      />

      <Vignette/>

    </AbsoluteFill>

  );

};