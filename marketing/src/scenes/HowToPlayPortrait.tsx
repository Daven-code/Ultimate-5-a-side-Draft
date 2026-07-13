/******************************************************************************
 * HowToPlayPortrait.tsx
 * =============================================================================
 *
 * Portrait hook scene.
 *
 * The words appear one at a time:
 *
 * PICK
 * BUILD
 * COMPETE
 *
 * They remain perfectly centred on any phone screen.
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
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {LightRays} from "../components/LightRays";
import {Vignette} from "../components/Vignette";

export const HowToPlayPortrait: React.FC = () => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const Word = (
    text: string,
    delay: number,
    colour: string,
  ) => {

    const local = frame - delay;

    const scale = spring({
      fps,
      frame: local,
      config: {
        damping: 12,
        stiffness: 120,
      },
    });

    const opacity = interpolate(
      local,
      [0, 10],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    return (

      <div
        style={{
          position: "absolute",

          left: "50%",
          top: "50%",

          transform:
            `translate(-50%, -50%) scale(${0.82 + scale * 0.18})`,

          width: "100%",

          textAlign: "center",

          fontFamily: "Bebas Neue",

          fontSize: 150,

          letterSpacing: 8,

          color: colour,

          opacity,

          textShadow:
            "0 0 40px rgba(37,99,235,.55)",
        }}
      >

        {text}

      </div>

    );

  };

  return (

    <AbsoluteFill>

      <Background/>

      <LightRays/>

      <Particles/>

      <FootballPitch/>

      {frame < 45 && Word("PICK", 0, "#FFFFFF")}

      {frame >= 45 &&
        frame < 90 &&
        Word("BUILD", 45, "#60A5FA")}

      {frame >= 90 &&
        Word("COMPETE", 90, "#FFFFFF")}

      <Vignette/>

    </AbsoluteFill>

  );

};