import React from "react";
import { Composition } from "remotion";
import { ChildrensCrusadeLivingStills } from "./scenes/ChildrensCrusadeLivingStills";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 📜 THE DARK TRUTH BEHIND THE CHILDREN'S CRUSADE (1212) - MASTER LIVING STILLS (26 Cuts | 3,120 Frames @ 30 FPS) */}
      <Composition
        id="ChildrensCrusadeLivingStills"
        component={ChildrensCrusadeLivingStills}
        durationInFrames={3120}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
