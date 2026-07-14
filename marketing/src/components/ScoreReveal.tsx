/******************************************************************************
 * ScoreReveal.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Animated Team Score reveal.
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

interface ScoreRevealProps {
  score: number;
}

export const ScoreReveal: React.FC<ScoreRevealProps> = ({
  score,
}) => {

  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  const animatedScore = Math.round(
    interpolate(
      frame,
      [45, 105],
      [0, score],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    )
  );

  const pulse = spring({
    fps,
    frame: frame - 95,
    config: {
      damping: 8,
      stiffness: 170,
    },
  });

  const opacity = interpolate(
    frame,
    [25, 40],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

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

      <div
        style={{
          opacity,
          transform: `scale(${1 + pulse * 0.08})`,
          fontFamily: "Bebas Neue",
          fontSize: 140,
          fontWeight: 700,
          color: "white",
          lineHeight: 1,
          letterSpacing: 4,
          textShadow: `0 0 ${40 * glow}px rgba(37,99,235,.9)`,
        }}
      >
        {animatedScore}
      </div>

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