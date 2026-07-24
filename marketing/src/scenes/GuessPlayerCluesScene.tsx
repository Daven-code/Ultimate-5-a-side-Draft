/******************************************************************************
 * GuessPlayerCluesScene.tsx - Landscape
 * =============================================================================
 * v9 changes:
 * - Removed crest blend mode so transparent PNGs render normally.
 * - Clue grid, arrows and nationality all fade out together at scene end.
 * - Smooth curved edge arrows retained from v8.
 ******************************************************************************/

import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {FootballPitch} from "../components/FootballPitch";
import {LightRays} from "../components/LightRays";
import {Particles} from "../components/Particles";
import {Vignette} from "../components/Vignette";
import {SceneFade} from "../components/SceneFade";
import {PlayerClue} from "../data/guessThePlayer";

interface Props {
  career: PlayerClue[];
  nationalityLabel: string;
  nationality: string;
  nationalityFlag?: string;
  framesPerClue: number;
}

const columns = 4;
const cardWidth = 260;
const cardHeight = 158;
const layoutWidth = 1535;
const stepX = (layoutWidth - cardWidth) / (columns - 1);
const stepY = 205;
const layoutHeight = cardHeight + 2 * stepY;

const getSnakePosition = (index: number) => {
  const row = Math.floor(index / columns);
  const rawCol = index % columns;
  const col = row % 2 === 0 ? rawCol : columns - 1 - rawCol;
  return {x: cardWidth / 2 + col * stepX, y: cardHeight / 2 + row * stepY, row, col};
};

const crestStyle: React.CSSProperties = {
  maxWidth: 82,
  maxHeight: 82,
  objectFit: "contain",
  backgroundColor: "transparent",
  border: "none",
  boxShadow: "none",
  filter: "drop-shadow(0 0 12px rgba(255,255,255,0.35))",
};

const ClueCard: React.FC<{clue: PlayerClue; index: number; framesPerClue: number;}> = ({clue, index, framesPerClue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - index * framesPerClue;
  const opacity = interpolate(local, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const scale = spring({fps, frame: local, config: {damping: 13, stiffness: 120}});

  return (
    <div style={{width: cardWidth, height: cardHeight, opacity, transform: `translate(-50%, -50%) scale(${scale})`, borderRadius: 24, padding: "14px 18px 12px", background: "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.82))", border: "3px solid rgba(96,165,250,0.86)", boxShadow: "0 0 28px rgba(96,165,250,0.44), inset 0 0 18px rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", color: "white", fontFamily: "Bebas Neue", textAlign: "center", overflow: "hidden"}}>
      <div style={{fontSize: 30, color: "#60A5FA", letterSpacing: 2, lineHeight: 1}}>{clue.year}</div>
      <div style={{flex: 1, width: "100%", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", alignItems: "center", gap: 12, paddingTop: 5}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent"}}>
          {clue.crest ? <Img src={staticFile(clue.crest)} style={crestStyle} /> : <div style={{fontSize: clue.team.length > 14 ? 24 : 31, lineHeight: 0.93, letterSpacing: 1.1, textTransform: "uppercase", textShadow: "0 0 14px rgba(255,255,255,0.32)"}}>{clue.team}</div>}
        </div>
        <div style={{fontSize: 52, color: "#FDE68A", lineHeight: 1, textShadow: "0 0 14px rgba(250,204,21,0.55)"}}>{clue.rating}</div>
      </div>
    </div>
  );
};

const ConnectorArrows: React.FC<{careerLength: number; framesPerClue: number;}> = ({careerLength, framesPerClue}) => {
  const frame = useCurrentFrame();
  const connectors = Array.from({length: careerLength - 1}, (_, index) => {
    const from = getSnakePosition(index);
    const to = getSnakePosition(index + 1);
    const local = frame - (index + 1) * framesPerClue + 8;
    const opacity = interpolate(local, [0, 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
    const sameRow = from.row === to.row;
    const fromRight = from.x + cardWidth / 2;
    const fromLeft = from.x - cardWidth / 2;
    const toRight = to.x + cardWidth / 2;
    const toLeft = to.x - cardWidth / 2;
    let path = "";
    if (sameRow) {
      path = to.x > from.x ? `M ${fromRight + 20} ${from.y} L ${toLeft - 24} ${to.y}` : `M ${fromLeft - 20} ${from.y} L ${toRight + 24} ${to.y}`;
    } else if (from.col === columns - 1) {
      const outsideX = fromRight + 128;
      const endX = toRight + 24;
      path = `M ${fromRight + 20} ${from.y} C ${outsideX} ${from.y}, ${outsideX} ${to.y}, ${endX} ${to.y}`;
    } else {
      const outsideX = fromLeft - 128;
      const endX = toLeft - 24;
      path = `M ${fromLeft - 20} ${from.y} C ${outsideX} ${from.y}, ${outsideX} ${to.y}, ${endX} ${to.y}`;
    }
    return {path, opacity};
  });

  return (
    <svg width={layoutWidth} height={layoutHeight} viewBox={`0 0 ${layoutWidth} ${layoutHeight}`} style={{position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none"}}>
      <defs><marker id="arrowheadLandscape" markerWidth="6" markerHeight="6" refX="5" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L5,2.5 L0,5 z" fill="#60A5FA" /></marker></defs>
      {connectors.map((connector, index) => <path key={`connector-${index}`} d={connector.path} fill="none" stroke="#60A5FA" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrowheadLandscape)" opacity={connector.opacity} style={{filter: "drop-shadow(0 0 5px rgba(96,165,250,0.85))"}} />)}
    </svg>
  );
};

export const GuessPlayerCluesScene: React.FC<Props> = ({career, nationalityLabel, nationality, nationalityFlag, framesPerClue}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const nationalityStart = career.length * framesPerClue;
  const nationalityLocal = frame - nationalityStart;
  const nationalityOpacity = interpolate(nationalityLocal, [0, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const nationalityScale = spring({fps, frame: nationalityLocal, config: {damping: 12, stiffness: 120}});
  const sceneEndOpacity = interpolate(frame, [durationInFrames - 22, durationInFrames - 6], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: "#020617", overflow: "hidden"}}>
      <Background /><FootballPitch /><LightRays /><Particles />
      <AbsoluteFill style={{alignItems: "center", paddingTop: 44, textAlign: "center", opacity: sceneEndOpacity}}>
        <div style={{color: "#FFFFFF", fontFamily: "Bebas Neue", fontWeight: 950, fontSize: 62, letterSpacing: 4, textTransform: "uppercase", textShadow: "0 0 28px rgba(96,165,250,0.7)"}}>Guess the Player</div>
        <div style={{marginTop: 4, color: "#93C5FD", fontFamily: "Bebas Neue", fontWeight: 850, fontSize: 34, letterSpacing: 2.5, textTransform: "uppercase", textShadow: "0 0 18px rgba(37,99,235,.35)"}}>Career clues</div>
      </AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: "52%", width: layoutWidth, height: layoutHeight, transform: "translate(-50%, -50%)", opacity: sceneEndOpacity}}>
        <ConnectorArrows careerLength={career.length} framesPerClue={framesPerClue} />
        {career.map((clue, index) => {const pos = getSnakePosition(index); return <div key={`${clue.year}-${clue.team}`} style={{position: "absolute", left: pos.x, top: pos.y, zIndex: 20}}><ClueCard clue={clue} index={index} framesPerClue={framesPerClue} /></div>;})}
      </div>
      <div style={{position: "absolute", left: "50%", bottom: 38, transform: `translateX(-50%) scale(${nationalityScale})`, opacity: nationalityOpacity * sceneEndOpacity, minWidth: 760, borderRadius: 28, padding: "18px 34px", background: "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.82))", border: "3px solid #FDE68A", boxShadow: "0 0 34px rgba(250,204,21,0.48)", textAlign: "center", fontFamily: "Bebas Neue", color: "white", zIndex: 30}}>
        <div style={{fontSize: 28, letterSpacing: 2.2, color: "#FDE68A"}}>{nationalityLabel}</div>
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 20}}>{nationalityFlag && <Img src={staticFile(nationalityFlag)} style={{width: 74, height: 50, objectFit: "cover", borderRadius: 8, boxShadow: "0 0 16px rgba(255,255,255,0.28)", backgroundColor: "transparent"}} />}<div style={{fontSize: 58, letterSpacing: 3, lineHeight: 1}}>{nationality}</div></div>
      </div>
      <Vignette /><SceneFade fadeInFrames={12} fadeOutFrames={12} />
    </AbsoluteFill>
  );
};
