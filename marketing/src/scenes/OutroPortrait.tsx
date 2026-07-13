/******************************************************************************
 * OutroPortrait.tsx
 * ============================================================================
 *
 * Final portrait CTA.
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Logo} from "../components/Logo";
import {Vignette} from "../components/Vignette";

export const OutroPortrait: React.FC = () => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config:{
      damping:12,
      stiffness:80,
    },
  });

  return(

    <AbsoluteFill
      style={{
        justifyContent:"center",
        alignItems:"center",
      }}
    >

      <Background/>
      <Floodlights/>
      <LightRays/>
      <Particles/>

      <div
        style={{
          position:"absolute",
          top:220,
          left:"50%",
          transform:`translateX(-50%) scale(${0.62 + scale*0.10})`,
        }}
      >
        <Logo/>
      </div>

      <div
        style={{
          position:"absolute",
          top:760,
          width:"100%",
          textAlign:"center",
          fontFamily:"Bebas Neue",
          fontSize:74,
          lineHeight:1,
          color:"white",
          letterSpacing:3,
        }}
      >
        CAN YOU BEAT
        <br/>
        THE LEADERBOARD?
      </div>

      <div
        style={{
          position:"absolute",
          top:980,
          width:"100%",
          textAlign:"center",
          fontFamily:"Bebas Neue",
          fontSize:54,
          color:"#60A5FA",
          letterSpacing:2,
        }}
      >
        ultimate5aside.app
      </div>

      <div
        style={{
          position:"absolute",
          top:1130,
          left:"50%",
          transform:"translateX(-50%)",
          padding:"22px 46px",
          background:"#2563EB",
          borderRadius:14,
          color:"white",
          fontFamily:"Bebas Neue",
          fontSize:44,
          letterSpacing:2,
          boxShadow:"0 10px 30px rgba(37,99,235,.35)",
        }}
      >
        PLAY FREE NOW
      </div>

      <Vignette/>

    </AbsoluteFill>

  );

};