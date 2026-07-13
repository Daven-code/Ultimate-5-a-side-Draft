import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {FootballPitch} from "../components/FootballPitch";
import {Particles} from "../components/Particles";
import {LightSweep} from "../components/LightSweep";
import {Logo} from "../components/Logo";
import {AnimatedTitle} from "../components/AnimatedTitle";

export const UltimateIntro: React.FC = () => {

  return (

    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Background />

      <Particles />

      <FootballPitch />

      <LightSweep />

      <Logo />

      <AnimatedTitle
        text="Ultimate 5-a-side"
        top={760}
      />

    </AbsoluteFill>

  );

};