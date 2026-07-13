/******************************************************************************
 * Outro.tsx
 * =============================================================================
 *
 * Landscape outro
 *
 * PURPOSE
 * -------
 * Final call-to-action.
 *
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Logo} from "../components/Logo";
import {Vignette} from "../components/Vignette";

export const Outro: React.FC = () => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 80,
    },
  });

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Background />

      <Floodlights />

      <LightRays />

      <Particles />

      {/* ------------------------------------------------------------------
          Logo
      ------------------------------------------------------------------- */}

      <div
        style={{
          position: "absolute",
          top: 70,
          left: "50%",
          transform: `translateX(-50%) scale(${0.58 + scale * 0.10})`,
        }}
      >
        <Logo />
      </div>

      {/* ------------------------------------------------------------------
          Headline
      ------------------------------------------------------------------- */}

      <div
        style={{
          position: "absolute",
          top: 500, // Was 420
          width: "100%",
          textAlign: "center",
          color: "white",
          fontFamily: "Bebas Neue",
          fontSize: 74,
          letterSpacing: 3,
          lineHeight: 1,
          textShadow: "0 0 24px rgba(37,99,235,.45)",
        }}
      >
        CAN YOU BEAT THE LEADERBOARD?
      </div>

      {/* ------------------------------------------------------------------
          Website
      ------------------------------------------------------------------- */}

      <div
        style={{
          position: "absolute",
          top: 620, // Was 540
          width: "100%",
          textAlign: "center",
          color: "#60A5FA",
          fontFamily: "Bebas Neue",
          fontSize: 52,
          letterSpacing: 2,
        }}
      >
        ultimate5aside.app
      </div>

      {/* ------------------------------------------------------------------
          CTA Button
      ------------------------------------------------------------------- */}

      <div
        style={{
          position: "absolute",
          top: 730, // Was 650
          left: "50%",
          transform: "translateX(-50%)",
          padding: "20px 44px",
          borderRadius: 14,
          background: "#2563EB",
          color: "white",
          fontFamily: "Bebas Neue",
          fontSize: 40,
          letterSpacing: 2,
          boxShadow: "0 10px 30px rgba(37,99,235,.35)",
        }}
      >
        PLAY FREE NOW
      </div>

      <Vignette />

    </AbsoluteFill>

  );

};