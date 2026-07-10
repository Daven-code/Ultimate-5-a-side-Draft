/******************************************************************************
 * BuildTeamScene.tsx
 * =============================================================================
 *
 * PURPOSE
 * -------
 * This is the emotional "hero" shot.
 *
 * Instead of showing your website,
 * we show what the player is trying to achieve.
 *
 ******************************************************************************/

import React from "react";

import {AbsoluteFill} from "remotion";

import {Background} from "../components/Background";

import {FootballPitch} from "../components/FootballPitch";

import {Particles} from "../components/Particles";

import {PulseRing} from "../components/PulseRing";

import {HeroCards} from "../components/HeroCards";

import {AnimatedText} from "../components/AnimatedText";

export const BuildTeamScene = () => (

<AbsoluteFill
style={{
justifyContent:"center",
alignItems:"center",
}}>

<Background/>

<Particles/>

<FootballPitch/>

<PulseRing/>

<AnimatedText
text="BUILD YOUR DREAM TEAM"
top={120}
/>

<HeroCards/>

</AbsoluteFill>

);
