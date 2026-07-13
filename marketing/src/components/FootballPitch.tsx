/******************************************************************************
 * FootballPitch.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Draws the subtle football pitch used behind the trailer.
 *
 * This version automatically centres itself on ANY video size
 * (landscape or portrait).
 *
 * Because we centre using CSS rather than fixed coordinates,
 * it works for:
 *
 * • 1920x1080
 * • 1080x1920
 * • any future resolution
 *
 ******************************************************************************/

import React from "react";

export const FootballPitch: React.FC = () => {

  return (

    <svg
      width="950"
      height="950"
      viewBox="0 0 950 950"
      style={{
        position: "absolute",

        /* ---- Centre the SVG ---- */
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",

        opacity: 0.08,

        pointerEvents: "none",
      }}
    >

      {/* Outer circle */}

      <circle
        cx="475"
        cy="475"
        r="430"
        stroke="#60A5FA"
        strokeWidth="6"
        fill="none"
      />

      {/* Centre circle */}

      <circle
        cx="475"
        cy="475"
        r="95"
        stroke="#60A5FA"
        strokeWidth="5"
        fill="none"
      />

      {/* Halfway line */}

      <line
        x1="45"
        y1="475"
        x2="905"
        y2="475"
        stroke="#60A5FA"
        strokeWidth="5"
      />

    </svg>

  );

};