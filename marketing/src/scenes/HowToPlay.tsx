import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {Particles} from "../components/Particles";
import {FootballPitch} from "../components/FootballPitch";
import {StaggeredTitle} from "../components/StaggeredTitle";

import {Trailer} from "../data/trailer";

export const HowToPlay = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Background />

    <Particles />

    <FootballPitch />

    <StaggeredTitle
      lines={Trailer.title}
    />
  </AbsoluteFill>
);