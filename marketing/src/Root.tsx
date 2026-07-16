import { Composition } from "remotion";

// Main trailer (Version 3)
import { LaunchTrailer } from "./videos/LaunchTrailer";
import { LaunchTrailerPortrait } from "./videos/LaunchTrailerPortrait";
import {EasySoloChallenge} from "./videos/EasySoloChallenge";
import {EasySoloChallengePortrait} from "./videos/EasySoloChallengePortrait";
import {WorldCup2026Challenge} from "./videos/WorldCup2026Challenge";
import {WorldCup2026ChallengePortrait} from "./videos/WorldCup2026ChallengePortrait";

export const RemotionRoot: React.FC = () => {
  return (
    <>

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

      <Composition
        id="LaunchTrailerPortrait"
        component={LaunchTrailerPortrait}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="EasySoloChallenge"
        component={EasySoloChallenge}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="EasySoloChallengePortrait"
        component={EasySoloChallengePortrait}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="WorldCup2026Challenge"
        component={WorldCup2026Challenge}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="WorldCup2026ChallengePortrait"
        component={WorldCup2026ChallengePortrait}
        durationInFrames={420}
        fps={30}
        width={1080}
        height={1920}
      />

    </>
  );
};