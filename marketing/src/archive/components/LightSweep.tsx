/******************************************************************************
 * LightSweep.tsx
 *
 * PURPOSE
 * -------
 * Creates the moving light beam often seen in sports promos.
 *
 * HOW IT WORKS
 * ------------
 * A large blurred white gradient moves across the screen.
 ******************************************************************************/

import React from "react";
import {interpolate, useCurrentFrame} from "remotion";

export const LightSweep: React.FC = () => {
  const frame = useCurrentFrame();

  const x = interpolate(frame, [0, 90], [-800, 2200]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: -300,
        width: 250,
        height: 1800,
        transform: "rotate(18deg)",
        background:
          "linear-gradient(180deg, transparent, rgba(255,255,255,.18), transparent)",
        filter: "blur(20px)",
      }}
    />
  );
};