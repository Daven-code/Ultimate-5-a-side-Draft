/******************************************************************************
 * AnimatedCounter.tsx
 *
 * PURPOSE
 * -------
 * Counts smoothly from 0 to the target value.
 ******************************************************************************/

import React from "react";
import {interpolate, useCurrentFrame} from "remotion";

interface Props {
  value: number;
}

export const AnimatedCounter: React.FC<Props> = ({value}) => {
  const frame = useCurrentFrame();

  const score = Math.round(
    interpolate(frame, [0, 60], [0, value], {
      extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        fontSize: 130,
        fontWeight: 900,
        color: "#fff",
        textShadow: "0 0 35px rgba(37,99,235,.7)",
        fontFamily: "Arial",
      }}
    >
      {score}
    </div>
  );
};