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

const CARD_W = 360;
const CARD_H = 470;
const PITCH_LEFT = 855;
const PITCH_TOP = 178;
const SLOT_W = 164;
const SLOT_H = 104;

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
    borderRadius: 22,
    border: penalty && filled ? "4px solid #EF4444" : active ? "4px solid #FACC15" : "3px solid rgba(255,255,255,0.34)",
    background: filled
      ? "linear-gradient(145deg, rgba(250,204,21,0.95), rgba(180,83,9,0.92))"
      : "rgba(15,23,42,0.76)",
    boxShadow: penalty && filled ? "0 0 42px rgba(239,68,68,0.55)" : active ? "0 0 42px rgba(250,204,21,0.58)" : "0 14px 36px rgba(0,0,0,0.3)",
    color: filled ? "#111827" : "#E5E7EB",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    overflow: "hidden",
    zIndex: active ? 4 : 2,
  }}>
    <div style={{fontSize: filled ? 29 : 36, fontWeight: 950, lineHeight: 1}}>{filled ? rating : label}</div>
    {filled && <div style={{fontSize: 16, fontWeight: 950, marginTop: 6, lineHeight: 1.05, padding: "0 8px"}}>{name}</div>}
    {filled && <div style={{fontSize: 16, fontWeight: 950, marginTop: 4}}>{label}</div>}
  </div>
);

const PitchGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const player = leagueLegendsChallenge.player;
  const existing = leagueLegendsChallenge.existingPlayer;
  const dropped = frame >= 292;
  const active = frame >= 190 && frame < 330;

  return (
    <div style={{
      position: "absolute",
      left: PITCH_LEFT,
      top: PITCH_TOP,
      width: 800,
      height: 730,
      borderRadius: 42,
      background: "linear-gradient(180deg, rgba(22,101,52,0.98), rgba(5,46,22,0.99))",
      border: "5px solid rgba(255,255,255,0.28)",
      boxShadow: "0 24px 90px rgba(0,0,0,0.42), inset 0 0 70px rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}>
      <div style={{position: "absolute", inset: 34, border: "3px solid rgba(255,255,255,0.28)", borderRadius: 32}} />
      <div style={{position: "absolute", top: 365, left: 34, right: 34, height: 3, background: "rgba(255,255,255,0.24)"}} />
      <div style={{position: "absolute", top: 300, left: 331, width: 138, height: 138, borderRadius: 999, border: "3px solid rgba(255,255,255,0.24)"}} />
      <div style={{position: "absolute", top: -68, left: 270, width: 260, height: 145, borderRadius: "0 0 32px 32px", border: "3px solid rgba(255,255,255,0.22)"}} />
      <div style={{position: "absolute", bottom: -68, left: 270, width: 260, height: 145, borderRadius: "32px 32px 0 0", border: "3px solid rgba(255,255,255,0.22)"}} />

      <Slot label="FWD" top={106} left={318} filled name={existing.name} rating={existing.rating} />
      <Slot label="MID" top={286} left={211} active={active || dropped} filled={dropped} name={player.name} rating={dropped ? player.adjustedRating : undefined} penalty />
      <Slot label="MID" top={286} left={425} />
      <Slot label="DEF" top={426} left={318} />
      <Slot label="GK" top={570} left={318} />
    </div>
  );
};

const CantonaCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const player = leagueLegendsChallenge.player;
  const pop = spring({fps, frame: frame - 18, config: {damping: 12, stiffness: 112}});
  const drag = interpolate(frame, [150, 235], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const fade = interpolate(frame, [238, 260], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  const scale = interpolate(drag, [0, 1], [1, 0.32]);
  const rotation = interpolate(drag, [0, 0.5, 1], [0, -3, 0]);
  const targetLeft = PITCH_LEFT + 211 + (SLOT_W / 2) - ((CARD_W * 0.32) / 2);
  const targetTop = PITCH_TOP + 286 + (SLOT_H / 2) - ((CARD_H * 0.32) / 2);
  const x = interpolate(drag, [0, 1], [0, targetLeft - 245]);
  const y = interpolate(drag, [0, 1], [0, targetTop - 278]);

  return (
    <div style={{
      position: "absolute",
      left: 245,
      top: 278,
      width: CARD_W,
      height: CARD_H,
      borderRadius: 32,
      background: "linear-gradient(145deg, #FACC15 0%, #F59E0B 42%, #78350F 100%)",
      border: "4px solid rgba(255,255,255,0.58)",
      boxShadow: "0 30px 90px rgba(0,0,0,0.5), 0 0 70px rgba(250,204,21,0.48)",
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${pop * scale})`,
      transformOrigin: "top left",
      opacity: fade,
      overflow: "hidden",
      zIndex: 8,
    }}>
      <div style={{position: "absolute", inset: 16, borderRadius: 25, border: "2px solid rgba(255,255,255,0.35)"}} />
      <div style={{position: "absolute", top: 28, left: 32, fontSize: 54, fontWeight: 950, color: "#111827", lineHeight: 1}}>{player.rating}</div>
      <div style={{position: "absolute", top: 88, left: 36, fontSize: 30, fontWeight: 950, color: "#111827"}}>{player.position}</div>
      <div style={{position: "absolute", left: 28, right: 28, top: 58, height: 245, display: "flex", alignItems: "flex-start", justifyContent: "center"}}>
        <Img src={staticFile(player.image)} style={{maxHeight: 248, maxWidth: 292, objectFit: "contain", filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.42))"}} />
      </div>
      <div style={{position: "absolute", left: 22, right: 22, bottom: 124, textAlign: "center", color: "#111827", fontWeight: 950, fontSize: 31, letterSpacing: 0.3, lineHeight: 1, textShadow: "0 2px 0 rgba(255,255,255,0.24)"}}>{player.name}</div>
      <div style={{position: "absolute", left: 24, right: 24, bottom: 65, textAlign: "center", color: "#1F2937", fontWeight: 900, fontSize: 21}}>{player.year} • {player.club}</div>
      <div style={{position: "absolute", left: 28, right: 28, bottom: 26, borderRadius: 999, padding: "9px 14px", background: "rgba(17,24,39,0.92)", color: "#FACC15", fontWeight: 950, fontSize: 16, letterSpacing: 1.05, textAlign: "center"}}>PREMIER LEAGUE LEGEND</div>
    </div>
  );
};

export const LeagueLegendsAcceptDeclineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endOpacity = interpolate(frame, [durationInFrames - 24, durationInFrames - 6], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const rulesOpacity = interpolate(frame, [18, 46], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const penaltyOpacity = interpolate(frame, [322, 352], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const commentOpacity = interpolate(frame, [430, 458], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const player = leagueLegendsChallenge.player;

  return (
    <AbsoluteFill style={{opacity: endOpacity}}>
      <Background />
      <Floodlights />
      <FootballPitch />
      <LightRays />
      <Particles />
      <Vignette />

      <div style={{position: "absolute", top: 36, left: 0, right: 0, textAlign: "center", color: "white", fontWeight: 950, fontSize: 49, letterSpacing: 1.1}}>
        {leagueLegendsChallenge.pitchTitle}
      </div>

      <div style={{position: "absolute", top: 106, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: rulesOpacity}}>
        <div style={{borderRadius: 999, padding: "13px 30px", background: "rgba(15,23,42,0.86)", border: "2px solid rgba(250,204,21,0.48)", boxShadow: "0 16px 50px rgba(0,0,0,0.34)", color: "#E5E7EB", fontSize: 22, fontWeight: 900, letterSpacing: 0.35, textAlign: "center"}}>
          <span style={{color: "#FACC15"}}>{leagueLegendsChallenge.rulesTitle}</span>
          <span style={{color: "#94A3B8"}}> • </span>
          {leagueLegendsChallenge.rulesSubtitle}
        </div>
      </div>

      <PitchGraphic />
      <CantonaCard />

      <div style={{position: "absolute", left: 275, top: 455, width: 410, opacity: penaltyOpacity}}>
        <div style={{borderRadius: 28, padding: "20px 28px", background: "rgba(2,6,23,0.9)", border: "2px solid rgba(248,113,113,0.58)", boxShadow: "0 20px 70px rgba(0,0,0,0.34)", textAlign: "center"}}>
          <div style={{fontSize: 29, color: "#FCA5A5", fontWeight: 950}}>POSITION PENALTY</div>
          <div style={{fontSize: 23, color: "white", fontWeight: 900, marginTop: 8}}>{player.position} played at {player.selectedPosition}</div>
          <div style={{fontSize: 37, color: "#FACC15", fontWeight: 950, marginTop: 8}}>{player.rating} → {player.adjustedRating}</div>
        </div>
      </div>

      <div style={{position: "absolute", left: 275, top: 650, width: 410, textAlign: "center", opacity: commentOpacity}}>
        <div style={{display: "block", width: "100%", boxSizing: "border-box", padding: "16px 36px", borderRadius: 24, background: "rgba(2,6,23,0.9)", border: "2px solid rgba(250,204,21,0.5)", color: "white", fontWeight: 950, fontSize: 32}}>
          {leagueLegendsChallenge.commentTitle}
          <div style={{fontSize: 20, color: "#FACC15", marginTop: 6}}>{leagueLegendsChallenge.commentSubtitle}</div>
        </div>
      </div>

      <SceneFade />
    </AbsoluteFill>
  );
};
