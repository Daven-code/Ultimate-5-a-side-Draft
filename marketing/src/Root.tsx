import { Composition } from "remotion";

import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";

// Main trailer (Version 3)
import { LaunchTrailer } from "./videos/LaunchTrailer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ------------------------------------------------------------------
          Hello World (Remotion example)
          Keep this while learning Remotion.
          Can be deleted later.
      ------------------------------------------------------------------- */}
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* ------------------------------------------------------------------
          Logo test composition
          Useful for experimenting with logo animations.
          Can be deleted later.
      ------------------------------------------------------------------- */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91EAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />

      {/* ------------------------------------------------------------------
          Ultimate 5-a-side Launch Trailer
          This is the main composition we'll be building from now on.
          600 frames @ 30fps = 20 seconds.
      ------------------------------------------------------------------- */}
      <Composition
        id="LaunchTrailer"
        component={LaunchTrailer}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};