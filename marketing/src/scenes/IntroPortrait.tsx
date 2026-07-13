/******************************************************************************
 * IntroPortrait.tsx
 * =============================================================================
 *
 * Portrait introduction for TikTok / Reels / Shorts.
 *
 * Design goals:
 * • Centre everything
 * • Larger logo
 * • Cleaner spacing
 * • Premium feel
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {LightRays} from "../components/LightRays";
import {Logo} from "../components/Logo";
import {Vignette} from "../components/Vignette";

export const IntroPortrait: React.FC = () => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 70,
    },
  });

  const opacity = interpolate(
    frame,
    [0, 20],
    [0, 1],
    {
      extrapolateRight: "clamp",
    }
  );

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >

      <Background/>

      <Floodlights/>

      <LightRays/>

      <Particles/>

      <FootballPitch/>

      {/* ----------------------------------------------------------
          Logo
      ----------------------------------------------------------- */}

      <div
        style={{
          position: "absolute",

          left: "50%",
          top: "38%",

          transform: `translate(-50%, -50%) scale(${0.62 + logoScale * 0.12})`,
        }}
      >
        <Logo/>
      </div>

      {/* ----------------------------------------------------------
          Hook
      ----------------------------------------------------------- */}

      <div
        style={{
          position: "absolute",

          left: "50%",
          top: "56%",

          transform: "translate(-50%, -50%)",

          width: "92%",

          textAlign: "center",

          color: "white",

          fontFamily: "Bebas Neue",

          fontSize: 90,

          lineHeight: 1,

          letterSpacing: 3,

          textShadow: "0 0 24px rgba(37,99,235,.45)",
        }}
      >

        THINK YOU KNOW

        <br/>

        FOOTBALL?

      </div>

      <Vignette/>

    </AbsoluteFill>

  );

};