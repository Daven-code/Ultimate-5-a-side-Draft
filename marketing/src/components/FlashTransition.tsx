/******************************************************************************
 * FlashTransition.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Creates a very quick white flash used between scenes.
 *
 * This mimics the style often seen in sports game trailers.
 *
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const FlashTransition: React.FC = () => {

  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 2, 4],
    [0, 0.9, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (

    <AbsoluteFill
      style={{
        backgroundColor: "#FFFFFF",
        opacity,
        pointerEvents: "none",
      }}
    />

  );

};