import React from "react";

interface Props {
  overall: number;
  position: string;
}

export const PlayerCard: React.FC<Props> = ({
  overall,
  position,
}) => {
  return (
    <div
      style={{
        width: 180,
        height: 250,

        borderRadius: 20,

        background:
          "linear-gradient(180deg,#f8fafc,#dbeafe)",

        border: "3px solid rgba(255,255,255,.4)",

        boxShadow:
          "0 15px 40px rgba(0,0,0,.35)",

        display: "flex",

        flexDirection: "column",

        justifyContent: "space-between",

        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
        }}
      >
        {overall}
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 24,
          color: "#555",
        }}
      >
        ★★★★★
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
        }}
      >
        {position}
      </div>
    </div>
  );
};