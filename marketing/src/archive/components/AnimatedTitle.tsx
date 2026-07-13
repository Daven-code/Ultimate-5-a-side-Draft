/******************************************************************************
 * AnimatedTitle.tsx
 *
 * PURPOSE
 * -------
 * Displays large cinematic title text.
 *
 * FEATURES
 * --------
 * • Spring animation
 * • Fade in
 * • Letter spacing
 * • Easy colour changes
 ******************************************************************************/

import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  text: string;
  top?: number;
}

export const AnimatedTitle: React.FC<Props> = ({
  text,
  top = 180,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 13,
      stiffness: 90,
    },
  });

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top,

        textAlign: "center",

        fontFamily: "Arial",

        fontWeight: 800,

        fontSize: 82,

        letterSpacing: 4,

        color: "white",

        textTransform: "uppercase",

        transform: `scale(${0.8 + scale * .2})`,

        textShadow: "0 0 30px rgba(37,99,235,.6)",
      }}
    >
      {text}
    </div>
  );
};