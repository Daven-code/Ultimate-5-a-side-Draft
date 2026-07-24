/******************************************************************************
 * FootballerSilhouette.tsx
 * =============================================================================
 * Inline football silhouette so no extra image files are needed.
 ******************************************************************************/

import React from "react";

interface Props {
  accent: string;
  size?: number;
  active?: boolean;
}

export const FootballerSilhouette: React.FC<Props> = ({accent, size = 120, active = false}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        filter: `drop-shadow(0 0 ${active ? 28 : 16}px ${accent})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: active ? -10 : 0,
          borderRadius: "50%",
          border: active ? `5px solid ${accent}` : "none",
          boxShadow: active ? `0 0 28px ${accent}` : "none",
          background: `radial-gradient(circle, ${accent}44 0%, rgba(15,23,42,0.55) 54%, rgba(2,6,23,0) 74%)`,
        }}
      />
      <div style={{position: "absolute", left: size * 0.41, top: size * 0.1, width: size * 0.18, height: size * 0.18, borderRadius: "50%", background: "#E5E7EB"}} />
      <div style={{position: "absolute", left: size * 0.37, top: size * 0.3, width: size * 0.26, height: size * 0.34, borderRadius: "42% 42% 22% 22%", background: "#E5E7EB", transform: "skew(-5deg)"}} />
      <div style={{position: "absolute", left: size * 0.21, top: size * 0.34, width: size * 0.25, height: size * 0.075, borderRadius: 999, background: "#E5E7EB", transform: "rotate(-28deg)"}} />
      <div style={{position: "absolute", left: size * 0.56, top: size * 0.34, width: size * 0.25, height: size * 0.075, borderRadius: 999, background: "#E5E7EB", transform: "rotate(24deg)"}} />
      <div style={{position: "absolute", left: size * 0.39, top: size * 0.6, width: size * 0.095, height: size * 0.32, borderRadius: 999, background: "#E5E7EB", transform: "rotate(17deg)"}} />
      <div style={{position: "absolute", left: size * 0.54, top: size * 0.6, width: size * 0.095, height: size * 0.32, borderRadius: 999, background: "#E5E7EB", transform: "rotate(-20deg)"}} />
      <div style={{position: "absolute", right: size * 0.01, bottom: size * 0.05, width: size * 0.16, height: size * 0.16, borderRadius: "50%", background: "#FFFFFF", border: `3px solid ${accent}`}} />
    </div>
  );
};
