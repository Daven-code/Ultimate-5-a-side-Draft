/******************************************************************************
 * BuildTeamScenePortrait.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Portrait team reveal.
 *
 * Five legendary players appear in a 2-1-2 formation that is
 * optimised for TikTok / Reels / Shorts.
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

export const BuildTeamScenePortrait: React.FC = () => {

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
        text="BUILD YOUR DREAM TEAM"
        top={110}
        size={56}
      />

      {/* ======================================================
          STRIKER
      ======================================================= */}

      <PlayerFlyIn
        delay={0}
        x={430}
        y={260}
        player="Lionel Messi (2012)"
        rating={94}
        position="ST"
      />

      {/* ======================================================
          MIDFIELD
      ======================================================= */}

      <PlayerFlyIn
        delay={18}
        x={120}
        y={590}
        player="Ronaldinho (2006)"
        rating={95}
        position="MID"
      />

      <PlayerFlyIn
        delay={36}
        x={740}
        y={590}
        player="Kevin De Bruyne (2022)"
        rating={91}
        position="MID"
      />

      {/* ======================================================
          DEFENDER
      ======================================================= */}

      <PlayerFlyIn
        delay={54}
        x={430}
        y={950}
        player="Sergio Ramos (2018)"
        rating={90}
        position="DEF"
      />

      {/* ======================================================
          GOALKEEPER
      ======================================================= */}

      <PlayerFlyIn
        delay={72}
        x={430}
        y={1310}
        player="Buffon (2005)"
        rating={97}
        position="GK"
      />

      <ScoreReveal/>

      <Vignette/>

    </AbsoluteFill>

  );

};