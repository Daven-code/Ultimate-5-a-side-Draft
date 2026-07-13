/******************************************************************************
 * BuildTeamScene.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Landscape team reveal.
 *
 * Five legendary players fly into position before the team rating is revealed.
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

import {PlayerFlyIn} from "../components/PlayerFlyIn";
import {ScoreReveal} from "../components/ScoreReveal";

export const BuildTeamScene: React.FC = () => {

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Background />

      <LightRays />

      <Particles />

      <FootballPitch />

      <AnimatedText
        text="BUILD YOUR DREAM TEAM"
        top={70}
        size={58}
      />

      {/* --------------------------------------------------
          Goalkeeper
      --------------------------------------------------- */}

      <PlayerFlyIn
        delay={0}
        x={180}
        y={300}
        player="Buffon (2005)"
        rating={97}
        position="GK"
      />

      {/* --------------------------------------------------
          Defender
      --------------------------------------------------- */}

      <PlayerFlyIn
        delay={15}
        x={510}
        y={300}
        player="Sergio Ramos (2018)"
        rating={90}
        position="DEF"
      />

      {/* --------------------------------------------------
          Midfielder
      --------------------------------------------------- */}

      <PlayerFlyIn
        delay={30}
        x={840}
        y={300}
        player="Ronaldinho (2006)"
        rating={95}
        position="MID"
      />

      {/* --------------------------------------------------
          Midfielder
      --------------------------------------------------- */}

      <PlayerFlyIn
        delay={45}
        x={1170}
        y={300}
        player="Kevin De Bruyne (2022)"
        rating={91}
        position="MID"
      />

      {/* --------------------------------------------------
          Striker
      --------------------------------------------------- */}

      <PlayerFlyIn
        delay={60}
        x={1500}
        y={300}
        player="Lionel Messi (2012)"
        rating={94}
        position="ST"
      />

      <ScoreReveal />

      <Vignette />

    </AbsoluteFill>

  );

};