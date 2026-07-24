/******************************************************************************
 * AuctionPlayerCard.tsx
 * =============================================================================
 * Small premium auction card for the online game modes promo.
 * Updated:
 * - No star in the middle.
 * - Player name is larger and centred.
 * - Rating number is larger and more obvious.
 ******************************************************************************/

import React from "react";
import {AuctionPlayer} from "../data/onlineGameModes";

interface Props {
  player: AuctionPlayer;
  scale?: number;
}

export const AuctionPlayerCard: React.FC<Props> = ({player, scale = 1}) => {
  const isLongName = player.name.length > 18;

  return (
    <div
      style={{
        width: 245 * scale,
        height: 315 * scale,
        borderRadius: 28 * scale,
        background: "linear-gradient(160deg,#FACC15,#F59E0B 46%,#78350F)",
        border: `${4 * scale}px solid #FDE68A`,
        boxShadow: "0 0 34px rgba(250,204,21,0.7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 18 * scale,
        color: "#111827",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 950,
        textAlign: "center",
      }}
    >
      <div style={{alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div style={{fontSize: 30 * scale, lineHeight: 1, letterSpacing: 1}}>{player.position}</div>
        <div style={{fontSize: 60 * scale, lineHeight: 0.9, letterSpacing: -2 * scale, textShadow: "0 2px 0 rgba(255,255,255,0.35)"}}>{player.rating}</div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${8 * scale}px`,
          fontSize: isLongName ? 31 * scale : 39 * scale,
          lineHeight: 0.96,
          letterSpacing: -0.6 * scale,
          textTransform: "uppercase",
          textShadow: "0 2px 0 rgba(255,255,255,0.28)",
        }}
      >
        {player.name}
      </div>

      <div style={{width: "100%", height: 10 * scale, borderRadius: 999, background: "rgba(17,24,39,0.72)", boxShadow: "inset 0 0 8px rgba(255,255,255,0.25)"}} />
    </div>
  );
};
