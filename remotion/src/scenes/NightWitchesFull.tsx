import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { NightWitchesHook } from "./NightWitchesHook";
import { NightWitchesAct2 } from "./NightWitchesAct2";
import { NightWitchesAct3 } from "./NightWitchesAct3";

// =========================================================================
// FULL CONTINUOUS MASTER: ACT 1 (HOOK) + ACT 2 (ORIGINS) + ACT 3 (PO-2)
// Total: 8,060 Frames @ 30 FPS (4 Minutes 28.6 Seconds)
// =========================================================================
export const NightWitchesFull: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#080B10", overflow: "hidden" }}>
      {/* ACT 1: THE HOOK (0:00 - 0:58 | Frames 0 - 1740) */}
      <Sequence from={0} durationInFrames={1740}>
        <NightWitchesHook />
      </Sequence>

      {/* ACT 2: BARBAROSSA, RASKOVA & ORDER 0099 (0:58 - 2:49 | Frames 1740 - 5083) */}
      <Sequence from={1740} durationInFrames={3343}>
        <NightWitchesAct2 />
      </Sequence>

      {/* ACT 3: THE WORLD'S WORST BOMBER (2:49 - 4:28 | Frames 5083 - 8060) */}
      <Sequence from={5083} durationInFrames={2977}>
        <NightWitchesAct3 />
      </Sequence>
    </AbsoluteFill>
  );
};
