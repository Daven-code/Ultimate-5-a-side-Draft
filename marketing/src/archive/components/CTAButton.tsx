/******************************************************************************
 * CTAButton.tsx
 *
 * PURPOSE
 * -------
 * Standard call-to-action button used at the end of every trailer.
 ******************************************************************************/

import React from "react";

interface Props{

    text:string;

}

export const CTAButton:React.FC<Props>=({text})=>{

    return(

        <div
            style={{

                padding:"22px 50px",

                borderRadius:18,

                background:"#2563EB",

                color:"white",

                fontFamily:"Arial",

                fontWeight:700,

                fontSize:34,

                letterSpacing:1,

                boxShadow:"0 0 40px rgba(37,99,235,.5)",

            }}
        >

            {text}

        </div>

    );

};