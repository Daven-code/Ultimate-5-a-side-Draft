import React from "react";

import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";

import {Camera} from "../components/Camera";

import {ScreenshotFrame} from "../components/ScreenshotFrame";

import {AnimatedTitle} from "../components/AnimatedTitle";

import {MouseCursor} from "../components/MouseCursor";

import {Highlight} from "../components/Highlight";

export const HomepageScene=()=>{

return(

<AbsoluteFill
style={{
justifyContent:"center",
alignItems:"center",
}}>

<Background/>

<AnimatedTitle
text="Choose Your Challenge"
top={80}
/>

<Camera>

<ScreenshotFrame
file="homepage.png"
width={1500}
/>

</Camera>

<Highlight

left={610}

top={510}

width={650}

height={150}

/>

<MouseCursor/>

</AbsoluteFill>

);

};