/******************************************************************************
 * LightRays.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Creates subtle moving stadium light rays.
 *
 * WHY?
 * ----
 * Adds depth behind the logo without distracting from it.
 ******************************************************************************/

import React from "react";
import {interpolate, useCurrentFrame} from "remotion";

export const LightRays: React.FC = () => {
  const frame = useCurrentFrame();

  const rotate = interpolate(frame, [0, 90], [-8, 8]);

  return (
    <div
      style={{
        position: "absolute",
        width: 1400,
        height: 1400,
        background:
          "conic-gradient(from 0deg, transparent 0deg, rgba(37,99,235,.10) 25deg, transparent 50deg, rgba(37,99,235,.08) 90deg, transparent 130deg)",
        filter: "blur(25px)",
        opacity: 0.8,
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
};