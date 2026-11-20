import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { DutchCanalLivingStill } from '../components/DutchCanalLivingStill';

export const HistoricalColorGradeSuite: React.FC = () => {
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
      {/* 🎵 MASTER AUDIO */}
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

      {/* Transition sound effects between color grade styles */}
      <Sequence from={60}>
        <Audio src={staticFile('sfx/sfx_map_parchment_slide.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={120}>
        <Audio src={staticFile('sfx/sfx_camera_whoosh_transition.mp3')} volume={0.35} />
      </Sequence>
      <Sequence from={180}>
        <Audio src={staticFile('sfx/sfx_map_parchment_slide.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={240}>
        <Audio src={staticFile('sfx/sfx_sub_bass_concussion_drop.wav')} volume={0.5} />
      </Sequence>

      {/* 🎨 STYLE 1: Rembrandt Baroque Golden Age Chiaroscuro (0-60 frames | 2.0s) */}
      <Sequence from={0} durationInFrames={60}>
        <DutchCanalLivingStill gradeStyle="rembrandt" />
      </Sequence>

      {/* 🎨 STYLE 2: Cold-Case Investigative / LEMMiNO Slate (60-120 frames | 2.0s) */}
      <Sequence from={60} durationInFrames={60}>
        <DutchCanalLivingStill gradeStyle="lemmino" />
      </Sequence>

      {/* 🎨 STYLE 3: Archival Vellum & Iron Gall Etching (120-180 frames | 2.0s) */}
      <Sequence from={120} durationInFrames={60}>
        <DutchCanalLivingStill gradeStyle="vellum" />
      </Sequence>

      {/* 🎨 STYLE 4: Baltic Frost / Nordic Midnight Indigo (180-240 frames | 2.0s) */}
      <Sequence from={180} durationInFrames={60}>
        <DutchCanalLivingStill gradeStyle="baltic" />
      </Sequence>

      {/* 🎨 STYLE 5: Armchair Historian Khaki War Grade (240-300 frames | 2.0s) */}
      <Sequence from={240} durationInFrames={60}>
        <DutchCanalLivingStill gradeStyle="khaki" />
      </Sequence>
    </div>
  );
};
