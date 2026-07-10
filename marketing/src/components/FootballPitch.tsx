/******************************************************************************
 * Football pitch graphic.
 ******************************************************************************/

import React from "react";

export const FootballPitch=()=>{

return(

<svg

width="950"

height="950"

viewBox="0 0 950 950"

style={{

position:"absolute",

opacity:.08,

}}

>

<circle

cx="475"

cy="475"

r="430"

stroke="#60A5FA"

strokeWidth="6"

fill="none"

/>

<circle

cx="475"

cy="475"

r="95"

stroke="#60A5FA"

strokeWidth="5"

fill="none"

/>

<line

x1="45"

y1="475"

x2="905"

y2="475"

stroke="#60A5FA"

strokeWidth="5"

/>

</svg>

);

};