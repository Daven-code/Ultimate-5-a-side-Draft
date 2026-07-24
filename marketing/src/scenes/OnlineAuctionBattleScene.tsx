/******************************************************************************
 * OnlineAuctionBattleScene.tsx - Landscape
 * =============================================================================
 * Bigger, more central 4-player auction layout.
 * Updated: removed "same online room" line and uses longer budget text.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";
import {FootballerSilhouette} from "../components/FootballerSilhouette";
import {AuctionPlayerCard} from "../components/AuctionPlayerCard";
import {AuctionPlayer} from "../data/onlineGameModes";

interface Props { title: string; subtitle?: string; budgetTitle: string; players: AuctionPlayer[]; }

const colours = ["#60A5FA", "#FACC15", "#34D399", "#FB7185"];
const labels = ["PLAYER 1", "PLAYER 2", "PLAYER 3", "PLAYER 4"];

export const OnlineAuctionBattleScene: React.FC<Props> = ({title, budgetTitle, players}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sceneLength = 300;
  const playerIndex = Math.min(players.length - 1, Math.floor(frame / sceneLength));
  const local = frame - playerIndex * sceneLength;
  const auction = players[playerIndex];
  const winner = auction.winnerIndex;
  const winning = local > 182;

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cardIn = spring({fps, frame: local - 8, config: {damping: 12, stiffness: 110}});
  const cardMove = interpolate(local, [188, 232], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cardScale = interpolate(local, [188, 232], [1, 0.50], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  const centre = {x: 960, y: 560};
  const positions = [{x: 460, y: 360}, {x: 1460, y: 360}, {x: 460, y: 735}, {x: 1460, y: 735}];
  const target = {x: positions[winner].x, y: positions[winner].y + 170};
  const cardX = centre.x + (target.x - centre.x) * cardMove;
  const cardY = centre.y + (target.y - centre.y) * cardMove;

  return (
    <AbsoluteFill style={{backgroundColor: "#020617", overflow: "hidden"}}>
      <Background />
      <FootballPitch />
      <LightRays />
      <Particles />

      <AbsoluteFill style={{alignItems: "center", paddingTop: 86}}>
        <div style={{opacity: titleOpacity, color: "white", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 78, letterSpacing: 4, textTransform: "uppercase", textShadow: "0 0 30px rgba(96,165,250,0.72)"}}>{title}</div>
        <div style={{marginTop: 14, opacity: titleOpacity, color: "#FDE68A", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 46, letterSpacing: 2, textTransform: "uppercase", textShadow: "0 0 22px rgba(250,204,21,0.65)"}}>{budgetTitle}</div>
      </AbsoluteFill>

      {positions.map((p, i) => {
        const appear = spring({fps, frame: local - 16 - i * 7, config: {damping: 12, stiffness: 120}});
        const bidStart = 52 + i * 26;
        const bidOpacity = interpolate(local, [bidStart, bidStart + 8, 182, 198], [0, 1, 1, i === winner ? 1 : 0.25], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
        const active = winning && i === winner;
        return (
          <div key={labels[i]} style={{position: "absolute", left: p.x, top: p.y, transform: `translate(-50%, -50%) scale(${appear})`, width: 330, textAlign: "center"}}>
            <div style={{display: "flex", justifyContent: "center"}}><FootballerSilhouette accent={colours[i]} size={145} active={active} /></div>
            <div style={{marginTop: 10, color: "white", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 32, letterSpacing: 1.8}}>{labels[i]}</div>
            <div style={{marginTop: 12, opacity: bidOpacity, color: i === winner && winning ? "#111827" : "white", background: i === winner && winning ? colours[i] : "rgba(15,23,42,0.88)", border: `3px solid ${colours[i]}`, borderRadius: 20, padding: "11px 12px", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 38, letterSpacing: 1.5, boxShadow: `0 0 20px ${colours[i]}88`}}>{auction.bids[i]}</div>
          </div>
        );
      })}

      <div style={{position: "absolute", left: cardX, top: cardY, transform: `translate(-50%, -50%) scale(${cardIn * cardScale})`}}>
        <AuctionPlayerCard player={auction} />
      </div>

      <div style={{position: "absolute", left: 0, right: 0, bottom: 112, opacity: interpolate(local, [192, 212], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), color: colours[winner], fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 66, letterSpacing: 2.4, textAlign: "center", textTransform: "uppercase", textShadow: `0 0 24px ${colours[winner]}`}}>
        {labels[winner]} WINS
      </div>

      <Vignette />
      <SceneFade fadeInFrames={12} fadeOutFrames={12} />
    </AbsoluteFill>
  );
};
