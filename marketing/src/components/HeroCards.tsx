/******************************************************************************
 * HeroCards.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Displays five generic football cards.
 *
 * These are NOT final.
 *
 * Later they will become animated versions of your real draft cards.
 *
 ******************************************************************************/

import React from "react";

import {PlayerCard} from "./PlayerCard";

export const HeroCards: React.FC = () => {

    const players = [

        ["GK", 91],

        ["DEF", 92],

        ["MID", 94],

        ["MID", 95],

        ["FWD", 97],

    ];

    return (

        <div
            style={{

                display: "flex",

                gap: 30,

                justifyContent: "center",

                marginTop: 320,

            }}
        >

            {players.map(([position, overall]) => (

                <PlayerCard

                    key={position.toString()}

                    position={position.toString()}

                    overall={Number(overall)}

                />

            ))}

        </div>

    );

};