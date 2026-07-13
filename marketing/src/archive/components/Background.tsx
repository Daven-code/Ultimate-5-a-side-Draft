/******************************************************************************
 * Background.tsx
 *
 * PURPOSE
 * -------
 * Creates the animated dark football-style background used throughout
 * every Ultimate 5-a-side trailer.
 *
 * CUSTOMISE
 * ---------
 * backgroundColor : Main background colour
 * vignetteOpacity : Darkness around the edges
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at center, #08152d 0%, #020617 70%)",
        overflow: "hidden",
      }}
    >
      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 300px rgba(0,0,0,.65)",
        }}
      />
    </AbsoluteFill>
  );
};