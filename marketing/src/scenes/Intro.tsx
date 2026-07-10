/******************************************************************************
 * Intro Scene
 ******************************************************************************/

import React from "react";
import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {Particles} from "../components/Particles";
import {FootballPitch} from "../components/FootballPitch";
import { Logo } from "../components/Logo";
import {AnimatedText} from "../components/AnimatedText";
import {Brand} from "../core/Brand";
import {LightRays} from "../components/LightRays";
import {Vignette} from "../components/Vignette";

export const Intro=()=>{

return(

<AbsoluteFill
  style={{
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <Background />

  <Floodlights />

  <LightRays />

  <Particles />

  <FootballPitch />

  <Logo />

  <AnimatedText
    text={Brand.hook}
    top={770}
    size={72}
  />

  <Vignette />
</AbsoluteFill>

);

};