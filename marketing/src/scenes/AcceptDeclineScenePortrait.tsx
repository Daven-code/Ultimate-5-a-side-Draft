/******************************************************************************
 * AcceptDeclineScenePortrait.tsx - Portrait
 * =============================================================================
 * v6: Declines box simplified and moved down.
 * - Removed "Your team still needs".
 * - Removed GK/DEF/MID/ST pills.
 * - Kept only "Only 3 declines" and "Gamble for someone better?".
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Background} from "../components/Background";
import {Floodlights} from "../components/Floodlights";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";
import {acceptDeclineRonaldinho} from "../data/acceptDeclineRonaldinho";

const PlayerCardPortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({fps, frame: frame - 14, config: {damping: 12, stiffness: 112}});
  const player = acceptDeclineRonaldinho.player;

  return (
    <div
      style={{
        width: 480,
        height: 610,
        borderRadius: 40,
        padding: "26px 26px 22px",
        transform: `scale(${0.9 + scale * 0.1})`,
        background: "linear-gradient(145deg, #FACC15, #F59E0B 42%, #92400E 100%)",
        boxShadow: "0 0 58px rgba(250,204,21,0.74)",
        border: "4px solid rgba(254,243,199,0.92)",
        fontFamily: "Bebas Neue",
        color: "#111827",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{position: "absolute", inset: 12, border: "2px solid rgba(255,255,255,0.45)", borderRadius: 31}} />
      <div style={{position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div style={{fontSize: 92, lineHeight: 0.9}}>{player.rating}</div>
        <div style={{fontSize: 44, letterSpacing: 1}}>{player.position}</div>
      </div>

      <div style={{position: "relative", margin: "-58px auto -12px", width: 420, height: 400, display: "flex", alignItems: "flex-end", justifyContent: "center"}}>
        <Img
          src={staticFile(player.image)}
          style={{
            maxWidth: "90%",
            maxHeight: "90%",
            objectFit: "contain",
            transform: "translateY(-30px)",
            filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.35))",
          }}
        />
      </div>

      <div style={{position: "relative", textAlign: "center", fontSize: 60, letterSpacing: 1.4, lineHeight: 0.88, whiteSpace: "nowrap", marginTop: -20}}>
        {player.name}
      </div>
      <div style={{position: "relative", marginTop: 2, textAlign: "center", fontSize: 32, color: "#7C2D12", letterSpacing: 1}}>
        {player.year} • {player.club}
      </div>
      <div style={{position: "relative", marginTop: 7, display: "flex", justifyContent: "center", gap: 11}}>
        <span style={{background: "rgba(17,24,39,0.92)", color: "white", borderRadius: 999, padding: "8px 18px", fontSize: 26}}>BRAZIL</span>
        <span style={{background: "rgba(17,24,39,0.92)", color: "white", borderRadius: 999, padding: "8px 18px", fontSize: 26}}>LEGEND</span>
      </div>
    </div>
  );
};

const DecisionButtonPortrait: React.FC<{label: string; colour: string; delay: number; highlight?: boolean}> = ({label, colour, delay, highlight}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({fps, frame: frame - delay, config: {damping: 11, stiffness: 130}});
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const pulse = highlight ? interpolate(frame, [170, 190, 215, 245], [0, 1, 0.55, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${pop * (highlight ? 1 + pulse * 0.045 : 1)})`,
        width: 340,
        padding: "20px 22px",
        borderRadius: 24,
        background: colour,
        color: "white",
        fontFamily: "Bebas Neue",
        fontSize: 50,
        letterSpacing: 2,
        textAlign: "center",
        boxShadow: highlight
          ? `0 0 ${24 + pulse * 34}px rgba(34,197,94,${0.55 + pulse * 0.35}), 0 14px 34px rgba(0,0,0,0.34)`
          : "0 14px 34px rgba(0,0,0,0.34)",
        border: highlight ? "4px solid rgba(254,243,199,0.95)" : "3px solid rgba(255,255,255,0.38)",
      }}
    >
      {label}
    </div>
  );
};

export const AcceptDeclineScenePortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endOpacity = interpolate(frame, [durationInFrames - 24, durationInFrames - 6], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const needsOpacity = interpolate(frame, [134, 158], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const commentOpacity = interpolate(frame, [255, 282], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: "#020617", overflow: "hidden"}}>
      <Background />
      <FootballPitch />
      <Floodlights />
      <LightRays />
      <Particles />

      <AbsoluteFill style={{opacity: endOpacity, alignItems: "center"}}>
        <div style={{position: "absolute", top: 135, width: "100%", textAlign: "center", fontFamily: "Bebas Neue", color: "white"}}>
          <div style={{fontSize: 76, letterSpacing: 3, lineHeight: 0.92, textShadow: "0 0 24px rgba(96,165,250,0.68)"}}>CHOOSE YOUR PLAYER</div>
        </div>

        <div style={{position: "absolute", top: 300, left: "50%", transform: "translateX(-50%)"}}>
          <PlayerCardPortrait />
        </div>

        <div style={{position: "absolute", top: 972, display: "flex", justifyContent: "center", gap: 24, width: "100%"}}>
          <DecisionButtonPortrait label="ACCEPT" colour="linear-gradient(135deg, #22C55E, #15803D)" delay={66} highlight />
          <DecisionButtonPortrait label="DECLINE" colour="linear-gradient(135deg, #EF4444, #B91C1C)" delay={82} />
        </div>

        <div style={{opacity: needsOpacity, position: "absolute", top: 1215, width: 760, left: "50%", transform: "translateX(-50%)", padding: "20px 24px", borderRadius: 26, background: "rgba(15,23,42,0.82)", border: "2px solid rgba(96,165,250,0.58)", boxShadow: "0 0 28px rgba(37,99,235,0.28)", fontFamily: "Bebas Neue", textAlign: "center"}}>
          <div style={{fontSize: 36, color: "#FDE68A", letterSpacing: 1.6, lineHeight: 1}}>{acceptDeclineRonaldinho.declineText}</div>
          <div style={{fontSize: 32, color: "white", marginTop: 8, letterSpacing: 1.2, lineHeight: 1}}>{acceptDeclineRonaldinho.gambleText}</div>
        </div>

        <div style={{opacity: commentOpacity, position: "absolute", bottom: 205, width: "100%", textAlign: "center", fontFamily: "Bebas Neue"}}>
          <div style={{fontSize: 56, color: "white", letterSpacing: 3, textShadow: "0 0 26px rgba(96,165,250,0.6)"}}>{acceptDeclineRonaldinho.commentTitle}</div>
          <div style={{fontSize: 44, color: "#FDE68A", letterSpacing: 2}}>{acceptDeclineRonaldinho.commentSubtitle}</div>
        </div>
      </AbsoluteFill>

      <Vignette />
      <SceneFade fadeInFrames={10} fadeOutFrames={10} />
    </AbsoluteFill>
  );
};
