/******************************************************************************
 * Vignette.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Darkens the edges of the screen.
 *
 * WHY?
 * ----
 * Helps draw the viewer's eye towards the centre of the frame.
 ******************************************************************************/

import React from "react";

export const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      boxShadow: "inset 0 0 350px rgba(0,0,0,.85)",
      pointerEvents: "none",
    }}
  />
);