/******************************************************************************
 * BlueGlow.tsx
 *
 * PURPOSE
 * -------
 * Adds the soft blue glow used behind logos, text and screenshots.
 ******************************************************************************/

import React from "react";

interface Props {
  size?: number;
  opacity?: number;
}

export const BlueGlow: React.FC<Props> = ({
  size = 600,
  opacity = 0.45,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(37,99,235,.95) 0%, rgba(37,99,235,0) 70%)",
        opacity,
        filter: "blur(60px)",
      }}
    />
  );
};