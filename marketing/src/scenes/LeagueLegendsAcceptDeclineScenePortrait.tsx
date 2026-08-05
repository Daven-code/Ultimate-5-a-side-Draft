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
import {leagueLegendsChallenge} from "../data/leagueLegendsChallenge";

const CARD_W = 430;
const CARD_H = 540;
const PITCH_LEFT = 155;
const PITCH_TOP = 820;
const SLOT_W = 136;
const SLOT_H = 90;

const Slot: React.FC<{
  label: string;
  top: number;
  left: number;
  filled?: boolean;
  name?: string;
  rating?: number;
  active?: boolean;
  penalty?: boolean;
}> = ({label, top, left, filled, name, rating, active, penalty}) => (
  <div style={{
    position: "absolute",
    top,
    left,
    width: SLOT_W,
    height: SLOT_H,
    borderRadius: 19,
    border: penalty && filled ? "4px solid #EF4444" : active ? "4px solid #FACC15" : "3px solid rgba(255,255,255,0.34)",
    background: filled ? "linear-gradient(145deg, rgba(250,204,21,0.95), rgba(180,83,9,0.92))" : "rgba(15,23,42,0.76)",
    boxShadow: penalty && filled ? "0 0 36px rgba(239,68,68,0.55)" : active ? "0 0 36px rgba(250,204,21,0.6)" : "0 12px 30px rgba(0,0,0,0.3)",
    color: filled ? "#111827" : "#E5E7EB",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    zIndex: active ? 5 : 2,
  }}>
    <div style={{fontSize: filled ? 23 : 31, fontWeight: 950, lineHeight: 1}}>{filled ? rating : label}</div>
    {filled && <div style={{fontSize: 14, fontWeight: 950, marginTop: 5, lineHeight: 1.05, padding: "0 6px"}}>{name}</div>}
    {filled && <div style={{fontSize: 14, fontWeight: 950, marginTop: 3}}>{label}</div>}
  </div>
);

const PortraitPitch: React.FC = () => {
  const frame = useCurrentFrame();
  const player = leagueLegendsChallenge.player;
  const existing = leagueLegendsChallenge.existingPlayer;
  const dropped = frame >= 240;
  const active = frame >= 198 && frame < 310;
  const pitchLift = interpolate(frame, [270, 350], [0, -205], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <div style={{
      position: "absolute",
      left: PITCH_LEFT,
      top: PITCH_TOP,
      width: 770,
      height: 690,
      borderRadius: 40,
      background: "linear-gradient(180deg, rgba(22,101,52,0.98), rgba(5,46,22,0.99))",
      border: "5px solid rgba(255,255,255,0.28)",
      boxShadow: "0 24px 90px rgba(0,0,0,0.42), inset 0 0 70px rgba(255,255,255,0.08)",
      overflow: "hidden",
      transform: `translateY(${pitchLift}px)`,
    }}>
      <div style={{position: "absolute", inset: 34, border: "3px solid rgba(255,255,255,0.28)", borderRadius: 30}} />
      <div style={{position: "absolute", top: 345, left: 34, right: 34, height: 3, background: "rgba(255,255,255,0.24)"}} />
      <div style={{position: "absolute", top: 292, left: 321, width: 128, height: 128, borderRadius: 999, border: "3px solid rgba(255,255,255,0.24)"}} />
      <div style={{position: "absolute", top: -58, left: 260, width: 250, height: 130, borderRadius: "0 0 30px 30px", border: "3px solid rgba(255,255,255,0.22)"}} />
      <div style={{position: "absolute", bottom: -58, left: 260, width: 250, height: 130, borderRadius: "30px 30px 0 0", border: "3px solid rgba(255,255,255,0.22)"}} />

      <Slot label="FWD" top={86} left={317} filled name={existing.name} rating={existing.rating} />
      <Slot label="MID" top={268} left={205} active={active || dropped} filled={dropped} name={player.name} rating={dropped ? player.adjustedRating : undefined} penalty />
      <Slot label="MID" top={268} left={429} />
      <Slot label="DEF" top={430} left={317} />
      <Slot label="GK" top={558} left={317} />
    </div>
  );
};

const PortraitCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const player = leagueLegendsChallenge.player;
  const pop = spring({fps, frame: frame - 18, config: {damping: 12, stiffness: 112}});
  const drag = interpolate(frame, [162, 240], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const fade = interpolate(frame, [243, 266], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  const scale = interpolate(drag, [0, 1], [1, 0.24]);
  const rotation = interpolate(drag, [0, 0.5, 1], [0, -3, 0]);
  const targetLeft = PITCH_LEFT + 205 + (SLOT_W / 2) - ((CARD_W * 0.24) / 2);
  const targetTop = PITCH_TOP + 268 + (SLOT_H / 2) - ((CARD_H * 0.24) / 2);
  const x = interpolate(drag, [0, 1], [0, targetLeft - 325]);
  const y = interpolate(drag, [0, 1], [0, targetTop - 292]);

  return (
    <div style={{
      position: "absolute",
      left: 325,
      top: 292,
      width: CARD_W,
      height: CARD_H,
      borderRadius: 38,
      background: "linear-gradient(145deg, #FACC15 0%, #F59E0B 43%, #78350F 100%)",
      border: "5px solid rgba(255,255,255,0.58)",
      boxShadow: "0 35px 100px rgba(0,0,0,0.56), 0 0 80px rgba(250,204,21,0.44)",
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${pop * scale})`,
      transformOrigin: "top left",
      opacity: fade,
      overflow: "hidden",
      zIndex: 8,
    }}>
      <div style={{position: "absolute", inset: 20, borderRadius: 31, border: "2px solid rgba(255,255,255,0.34)"}} />
      <div style={{position: "absolute", top: 34, left: 38, fontSize: 64, fontWeight: 950, color: "#111827", lineHeight: 1}}>{player.rating}</div>
      <div style={{position: "absolute", top: 103, left: 43, fontSize: 35, fontWeight: 950, color: "#111827"}}>{player.position}</div>
      <div style={{position: "absolute", left: 36, right: 36, top: 70, height: 276, display: "flex", alignItems: "flex-start", justifyContent: "center"}}>
        <Img src={staticFile(player.image)} style={{maxHeight: 278, maxWidth: 328, objectFit: "contain", filter: "drop-shadow(0 18px 26px rgba(0,0,0,0.42))"}} />
      </div>
      <div style={{position: "absolute", left: 30, right: 30, bottom: 140, textAlign: "center", color: "#111827", fontWeight: 950, fontSize: 38, lineHeight: 1, textShadow: "0 2px 0 rgba(255,255,255,0.25)"}}>{player.name}</div>
      <div style={{position: "absolute", left: 30, right: 30, bottom: 72, textAlign: "center", color: "#1F2937", fontWeight: 900, fontSize: 23}}>{player.year} • {player.club}</div>
      <div style={{position: "absolute", left: 36, right: 36, bottom: 31, borderRadius: 999, padding: "11px 16px", background: "rgba(17,24,39,0.92)", color: "#FACC15", fontWeight: 950, fontSize: 17, letterSpacing: 1.05, textAlign: "center"}}>PREMIER LEAGUE LEGEND</div>
    </div>
  );
};

export const LeagueLegendsAcceptDeclineScenePortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endOpacity = interpolate(frame, [durationInFrames - 24, durationInFrames - 6], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const ruleOpacity = interpolate(frame, [18, 46], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const penaltyOpacity = interpolate(frame, [300, 328], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const commentOpacity = interpolate(frame, [388, 418], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const player = leagueLegendsChallenge.player;

  return (
    <AbsoluteFill style={{opacity: endOpacity}}>
      <Background />
      <Floodlights />
      <FootballPitch />
      <LightRays />
      <Particles />
      <Vignette />

      <div style={{position: "absolute", top: 72, left: 68, right: 68, textAlign: "center", color: "white", fontWeight: 950, fontSize: 45, lineHeight: 1.04, letterSpacing: 1.05}}>
        PICK YOUR PREMIER LEAGUE LEGENDS
      </div>

      <div style={{position: "absolute", top: 174, left: 78, right: 78, borderRadius: 26, padding: "17px 26px", background: "rgba(15,23,42,0.86)", border: "2px solid rgba(250,204,21,0.48)", boxShadow: "0 18px 56px rgba(0,0,0,0.36)", textAlign: "center", opacity: ruleOpacity}}>
        <div style={{color: "#FACC15", fontSize: 27, fontWeight: 950, lineHeight: 1.08}}>{leagueLegendsChallenge.rulesTitle}</div>
        <div style={{color: "#E5E7EB", fontSize: 22, fontWeight: 850, marginTop: 6, lineHeight: 1.12}}>{leagueLegendsChallenge.rulesSubtitle}</div>
      </div>

      <PortraitPitch />
      <PortraitCard />

      <div style={{position: "absolute", left: 110, right: 110, bottom: 216, opacity: penaltyOpacity}}>
        <div style={{borderRadius: 28, padding: "22px 32px", background: "rgba(2,6,23,0.9)", border: "2px solid rgba(248,113,113,0.58)", textAlign: "center", boxShadow: "0 20px 70px rgba(0,0,0,0.34)"}}>
          <div style={{fontSize: 32, color: "#FCA5A5", fontWeight: 950}}>POSITION PENALTY</div>
          <div style={{fontSize: 25, color: "white", fontWeight: 900, marginTop: 8}}>{player.position} played at {player.selectedPosition}</div>
          <div style={{fontSize: 45, color: "#FACC15", fontWeight: 950, marginTop: 8}}>{player.rating} → {player.adjustedRating}</div>
        </div>
      </div>

      <div style={{position: "absolute", left: 170, right: 170, bottom: 62, textAlign: "center", opacity: commentOpacity}}>
        <div style={{display: "inline-block", padding: "22px 38px", borderRadius: 26, background: "rgba(2,6,23,0.9)", border: "2px solid rgba(250,204,21,0.5)", color: "white", fontWeight: 950, fontSize: 36}}>
          {leagueLegendsChallenge.commentTitle}
          <div style={{fontSize: 22, color: "#FACC15", marginTop: 7}}>{leagueLegendsChallenge.commentSubtitle}</div>
        </div>
      </div>

      <SceneFade />
    </AbsoluteFill>
  );
};
