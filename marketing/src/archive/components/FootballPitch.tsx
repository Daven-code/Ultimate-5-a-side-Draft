/******************************************************************************
 * FootballPitch.tsx
 *
 * PURPOSE
 * -------
 * Decorative football pitch used behind the logo and screenshots.
 ******************************************************************************/

import React from "react";

export const FootballPitch: React.FC = () => {

  return (

    <svg
      width="900"
      height="900"
      viewBox="0 0 900 900"

      style={{
        position: "absolute",
        opacity: .08,
      }}
    >

      <circle

        cx="450"

        cy="450"

        r="420"

        stroke="#3B82F6"

        strokeWidth="6"

        fill="none"

      />

      <circle

        cx="450"

        cy="450"

        r="90"

        stroke="#3B82F6"

        strokeWidth="5"

        fill="none"

      />

      <line

        x1="30"

        y1="450"

        x2="870"

        y2="450"

        stroke="#3B82F6"

        strokeWidth="5"

      />

    </svg>

  );

};