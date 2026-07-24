/******************************************************************************
 * SceneFade.tsx
 * =============================================================================
 * Soft fade overlay. Used instead of flash transitions.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";

interface Props {
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

export const SceneFade: React.FC<Props> = ({fadeInFrames = 10, fadeOutFrames = 10}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const fadeInOpacity = interpolate(frame, [0, fadeInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOutOpacity = interpolate(
    frame,
    [durationInFrames - fadeOutFrames, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        opacity: Math.max(fadeInOpacity, fadeOutOpacity),
        pointerEvents: "none",
      }}
    />
  );
};
