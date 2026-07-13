/******************************************************************************
 * Logo.tsx
 *
 * PURPOSE
 * -------
 * Displays the Ultimate 5-a-side logo with
 * smooth scaling and fade animation.
 *
 * HOW TO CUSTOMISE
 * ----------------
 * width
 * glowSize
 * opacity timings
 ******************************************************************************/

import React from "react";

import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {BlueGlow} from "./BlueGlow";

export const Logo: React.FC = () => {
  const frame = useCurrentFrame();

  const {fps} = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 90,
    },
  });

  const opacity = interpolate(
    frame,
    [0, 20, 80, 95],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <>
      <BlueGlow />

      <Img
        src={staticFile("logo/logo.png")}
        style={{
          width: 430,
          opacity,
          transform: `scale(${0.82 + scale * 0.18})`,
          filter:
            "drop-shadow(0 0 60px rgba(37,99,235,.6))",
        }}
      />
    </>
  );
};