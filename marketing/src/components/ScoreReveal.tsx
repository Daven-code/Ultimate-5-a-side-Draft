/******************************************************************************
 * ScoreReveal.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Dramatic Team Score reveal.
 *
 * Animation
 * ---------
 * • Counts from 0 → 447
 * • Blue glow
 * • Small landing pulse
 * • Subtitle
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

export const ScoreReveal: React.FC = () => {

  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  /*
   * Number counts up over roughly 2 seconds.
   */
  const score = Math.round(
    interpolate(
      frame,
      [45, 105],
      [0, 467],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    )
  );

  /*
   * Small pulse once the score lands.
   */
  const pulse = spring({
    fps,
    frame: frame - 95,
    config: {
      damping: 8,
      stiffness: 170,
    },
  });

  /*
   * Fade in.
   */
  const opacity = interpolate(
    frame,
    [25, 40],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  /*
   * Blue glow increases as the score settles.
   */
  const glow = interpolate(
    frame,
    [70, 110],
    [0.25, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (

    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 70,
        pointerEvents: "none",
      }}
    >

      {/* ----------------------------------------------------------
          Score
      ----------------------------------------------------------- */}

      <div
        style={{
          opacity,

          transform:
            `scale(${1 + pulse * 0.08})`,

          fontFamily: "Bebas Neue",

          fontSize: 140,

          fontWeight: 700,

          color: "#FFFFFF",

          lineHeight: 1,

          textShadow:
            `0 0 ${40 * glow}px rgba(37,99,235,.9)`,

          letterSpacing: 4,
        }}
      >
        {score}
      </div>

      {/* ----------------------------------------------------------
          Subtitle
      ----------------------------------------------------------- */}

      <div
        style={{
          marginTop: 6,

          fontFamily: "Bebas Neue",

          fontSize: 44,

          letterSpacing: 8,

          color: "#60A5FA",

          opacity,
        }}
      >
        TEAM SCORE
      </div>

    </AbsoluteFill>

  );

};