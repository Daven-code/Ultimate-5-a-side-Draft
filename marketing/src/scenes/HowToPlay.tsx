/******************************************************************************
 * HowToPlay.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * This is the "hook" section of the trailer.
 *
 * Instead of explaining lots of information,
 * we use three powerful words that quickly tell the viewer
 * what Ultimate 5-a-side is all about.
 *
 * Timeline
 * --------
 *
 * 0-1.5 sec
 * PICK
 *
 * 1.5-3 sec
 * BUILD
 *
 * 3-5 sec
 * COMPETE
 *
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

export const HowToPlay: React.FC = () => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  /**
   * Helper function that creates one animated word.
   *
   * We offset the animation by "delay" frames so each word
   * appears at a different point in time.
   */
  const renderWord = (
    word: string,
    delay: number,
    colour: string
  ) => {

    const localFrame = frame - delay;

    const scale = spring({
      fps,
      frame: localFrame,
      config: {
        damping: 12,
        stiffness: 110,
      },
    });

    const opacity = interpolate(
      localFrame,
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

          width: "100%",

          top: "42%",

          textAlign: "center",

          fontFamily: "Bebas Neue, Arial",

          fontWeight: 700,

          fontSize: 140,

          letterSpacing: 8,

          color: colour,

          opacity,

          transform: `scale(${0.75 + scale * 0.25})`,

          textShadow:
            "0 0 40px rgba(37,99,235,.45)",
        }}
      >
        {word}
      </div>

    );

  };

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Background />

      <LightRays />

      <FootballPitch />

      <Particles />

      {/* ----------------------------------------------------
          Each word appears on a different beat.
      ----------------------------------------------------- */}

      {frame < 45 && renderWord("PICK", 0, "#FFFFFF")}

      {frame >= 45 &&
        frame < 90 &&
        renderWord("BUILD", 45, "#60A5FA")}

      {frame >= 90 &&
        renderWord("COMPETE", 90, "#FFFFFF")}

      <Vignette />

    </AbsoluteFill>

  );

};