/******************************************************************************
 * LeagueSelectionScene.tsx
 * =============================================================================
 * Landscape scene for the League Challenge marketing video.
 ******************************************************************************/

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
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
import {leagueChallenge, LeagueOption} from "../data/leagueChallenge";

const LeagueButton: React.FC<{league: LeagueOption; index: number}> = ({league, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - index * 8;
  const pop = spring({fps, frame: local, config: {damping: 12, stiffness: 130}});
  const opacity = interpolate(local, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const selectedPulse = league.selected
    ? interpolate(frame, [165, 190, 245, 290], [0.55, 1, 0.72, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 0;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${0.92 + pop * 0.08})`,
        minHeight: 82,
        borderRadius: 22,
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        background: league.selected
          ? `linear-gradient(135deg, ${league.accent}, #2563EB)`
          : "rgba(15,23,42,0.82)",
        border: league.selected
          ? "3px solid rgba(255,255,255,0.88)"
          : "2px solid rgba(147,197,253,0.34)",
        boxShadow: league.selected
          ? `0 0 ${24 + selectedPulse * 28}px rgba(96,165,250,${0.38 + selectedPulse * 0.28})`
          : "0 12px 28px rgba(0,0,0,0.24)",
        fontFamily: "Bebas Neue",
        color: "white",
      }}
    >
      <span style={{fontSize: 36, letterSpacing: 1.4, lineHeight: 1}}>{league.name}</span>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: league.selected ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.12)",
          color: league.selected ? "#1D4ED8" : "rgba(255,255,255,0.48)",
          fontSize: 24,
          fontWeight: 950,
        }}
      >
        {league.selected ? "✓" : ""}
      </span>
    </div>
  );
};

export const LeagueSelectionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const headerScale = spring({fps, frame, config: {damping: 14, stiffness: 100}});
  const gridOpacity = interpolate(frame, [12, 32], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const summaryOpacity = interpolate(frame, [205, 235], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const endOpacity = interpolate(frame, [durationInFrames - 22, durationInFrames - 6], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: "#020617", overflow: "hidden"}}>
      <Background />
      <FootballPitch />
      <Floodlights />
      <LightRays />
      <Particles />

      <AbsoluteFill style={{opacity: endOpacity}}>
        <div
          style={{
            position: "absolute",
            top: 92,
            width: "100%",
            textAlign: "center",
            fontFamily: "Bebas Neue",
            transform: `scale(${0.94 + headerScale * 0.06})`,
          }}
        >
          <div style={{fontSize: 78, color: "white", letterSpacing: 4, textShadow: "0 0 24px rgba(96,165,250,0.72)"}}>
            {leagueChallenge.selectionTitle}
          </div>
          <div style={{fontSize: 34, color: "#93C5FD", letterSpacing: 2, marginTop: 6}}>
            {leagueChallenge.selectionSubtitle}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 170,
            right: 170,
            top: 345,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 22,
            opacity: gridOpacity,
          }}
        >
          {leagueChallenge.leagues.map((league, index) => (
            <LeagueButton key={league.name} league={league} index={index} />
          ))}
        </div>

        <div
          style={{
            opacity: summaryOpacity,
            position: "absolute",
            left: "50%",
            bottom: 150,
            transform: "translateX(-50%)",
            width: 980,
            padding: "22px 34px",
            borderRadius: 28,
            textAlign: "center",
            background: "rgba(15,23,42,0.84)",
            border: "2px solid rgba(96,165,250,0.62)",
            boxShadow: "0 0 34px rgba(37,99,235,0.34)",
            fontFamily: "Bebas Neue",
          }}
        >
          <div style={{fontSize: 50, color: "#FDE68A", letterSpacing: 2}}>
            {leagueChallenge.selectedSummary}
          </div>
          <div style={{fontSize: 32, color: "white", letterSpacing: 2, marginTop: 8}}>
            {leagueChallenge.poolLabel}
          </div>
        </div>
      </AbsoluteFill>

      <Vignette />
      <SceneFade fadeInFrames={8} fadeOutFrames={8} />
    </AbsoluteFill>
  );
};
