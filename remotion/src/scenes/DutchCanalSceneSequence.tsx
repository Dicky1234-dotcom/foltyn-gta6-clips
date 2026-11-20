import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { DutchCanalLivingStill } from '../components/DutchCanalLivingStill';

export const DutchCanalSceneSequence: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        backgroundColor: '#0a0f18',
        overflow: 'hidden',
      }}
    >
      {/* 🎵 MASTER AUDIO TRACK */}
      <Audio
        src={staticFile('sfx/sfx_trench_brazier_embers.mp3')}
        volume={0.7}
        startFrom={0}
      />
      <Audio
        src={staticFile('sfx/sfx_investigative_drone_bed.wav')}
        volume={0.4}
        startFrom={0}
      />
      <Audio
        src={staticFile('sfx/sfx_winter_steppe_wind_howl.mp3')}
        volume={0.25}
        startFrom={0}
      />

      {/* Transition whooshes on cuts */}
      <Sequence from={80}>
        <Audio src={staticFile('sfx/sfx_camera_whoosh_transition.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={150}>
        <Audio src={staticFile('sfx/sfx_sub_bass_concussion_drop.wav')} volume={0.55} />
      </Sequence>

      {/* 🎬 CUT 1: Wide Establishing Living Still (0-80 frames | 2.67s) */}
      <Sequence from={0} durationInFrames={80}>
        <DutchCanalLivingStill punchIn={false} />
      </Sequence>

      {/* 🎬 CUT 2: Rapid Micro-Accent Punch-In to Captain's Face & Ruff (80-150 frames | 2.33s) */}
      <Sequence from={80} durationInFrames={70}>
        <DutchCanalLivingStill punchIn={true} />
      </Sequence>

      {/* 🎬 CUT 3: Dynamic Wide-Medium Cadence Cut (150-240 frames | 3.0s) */}
      <Sequence from={150} durationInFrames={90}>
        <DutchCanalLivingStill punchIn={false} />
      </Sequence>
    </div>
  );
};
