/******************************************************************************
 * Particles.tsx
 *
 * PURPOSE
 * -------
 * Generates subtle floating particles to add depth.
 ******************************************************************************/

import React from "react";

export const Particles: React.FC = () => {

  const particles = [];

  for (let i = 0; i < 35; i++) {

    particles.push(

      <div

        key={i}

        style={{

          position: "absolute",

          left: Math.random() * 1920,

          top: Math.random() * 1080,

          width: 4,

          height: 4,

          borderRadius: "50%",

          background: "#60A5FA",

          opacity: .25,

          boxShadow: "0 0 12px #60A5FA",

        }}

      />

    );

  }

  return <>{particles}</>;

};