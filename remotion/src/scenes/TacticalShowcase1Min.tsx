import React from "react";
import {
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TacticalMap2D5 } from "../components/TacticalMap2D5";
import { LivingStillScene } from "../components/LivingStillScene";

export const TacticalShowcase1Min: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle master audio leveling
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: "#000000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* =========================================================================
          AUDIO DESIGN LAYER: Multi-Track Documentary Bed & SFX
      ========================================================================= */}
      {/* Track 1: Ambient Investigative Drone (Continuous Bed) */}
      <Audio
        src={staticFile("sfx/sfx_investigative_drone_bed.wav")}
        volume={0.65}
        startFrom={0}
      />

      {/* Track 2: Fire Crackle on Living Still segments */}
      <Sequence from={400} durationInFrames={400}>
        <Audio
          src={staticFile("sfx/sfx_trench_brazier_embers.mp3")}
          volume={0.5}
        />
      </Sequence>
      <Sequence from={1180} durationInFrames={300}>
        <Audio
          src={staticFile("sfx/sfx_trench_brazier_embers.mp3")}
          volume={0.5}
        />
      </Sequence>

      {/* Map Transition Whooshes & Parchment Slides */}
      <Sequence from={0} durationInFrames={40}>
        <Audio src={staticFile("sfx/sfx_sub_bass_concussion_drop.wav")} volume={0.8} />
      </Sequence>
      <Sequence from={80} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_map_parchment_slide.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={160} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_camera_whoosh_transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={320} durationInFrames={40}>
        <Audio src={staticFile("sfx/sfx_sub_bass_concussion_drop.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={400} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_film_shutter_transition.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={480} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_camera_whoosh_transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={550} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_map_parchment_slide.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={790} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_camera_whoosh_transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={1020} durationInFrames={40}>
        <Audio src={staticFile("sfx/sfx_sub_bass_concussion_drop.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={1180} durationInFrames={30}>
        <Audio src={staticFile("sfx/sfx_film_shutter_transition.wav")} volume={0.65} />
      </Sequence>

      {/* =========================================================================
          VIDEO SEQUENCE: 20 Relentless 2.5s–3.0s Cuts (Strict 3-Second Ceiling)
      ========================================================================= */}

      {/* SHOT 1 (f0–f80 | 2.67s): 2.5D Macro Strategic Map Tilt */}
      <Sequence from={0} durationInFrames={80}>
        <Shot1MacroMap />
      </Sequence>

      {/* SHOT 2 (f80–f160 | 2.67s): 3D Camera Dive into Topographic Sector */}
      <Sequence from={80} durationInFrames={80}>
        <Shot2CameraDive />
      </Sequence>

      {/* SHOT 3 (f160–f240 | 2.67s): Northern Attack Pincer Surge */}
      <Sequence from={160} durationInFrames={80}>
        <Shot3NorthernPincer />
      </Sequence>

      {/* SHOT 4 (f240–f320 | 2.67s): Southern Attack Pincer Convergence */}
      <Sequence from={240} durationInFrames={80}>
        <Shot4SouthernPincer />
      </Sequence>

      {/* SHOT 5 (f320–f400 | 2.67s): Tactical Encirclement Pocket */}
      <Sequence from={320} durationInFrames={80}>
        <Shot5EncirclementPocket />
      </Sequence>

      {/* SHOT 6 (f400–f480 | 2.67s): Living Still Master Reveal (Value-Pop Plate) */}
      <Sequence from={400} durationInFrames={80}>
        <Shot6LivingStillWide />
      </Sequence>

      {/* SHOT 7 (f480–f550 | 2.33s): Micro-Accent Punch-In on Captain's Eyes & Ruff */}
      <Sequence from={480} durationInFrames={70}>
        <Shot7LivingStillPunchIn />
      </Sequence>

      {/* SHOT 8 (f550–f630 | 2.67s): Topographic Elevation Hillshade & Contour Cross-Section */}
      <Sequence from={550} durationInFrames={80}>
        <Shot8TopographicContours />
      </Sequence>

      {/* SHOT 9 (f630–f710 | 2.67s): Coordinated NATO Division Advance */}
      <Sequence from={630} durationInFrames={80}>
        <Shot9UnitAdvance />
      </Sequence>

      {/* SHOT 10 (f710–f790 | 2.67s): Wide Living Still (Canal Mist & Torchlight Reflections) */}
      <Sequence from={710} durationInFrames={80}>
        <Shot10LivingStillMist />
      </Sequence>

      {/* SHOT 11 (f790–f870 | 2.67s): 35-Degree Isometric Low-Angle Map Tilt */}
      <Sequence from={790} durationInFrames={80}>
        <Shot11IsometricTilt />
      </Sequence>

      {/* SHOT 12 (f870–f950 | 2.67s): Full Dual Pincer Surge with Objective Radar */}
      <Sequence from={870} durationInFrames={80}>
        <Shot12RadarSweep />
      </Sequence>

      {/* SHOT 13 (f950–f1020 | 2.33s): Kinetic Punch-In on Halberdier & Torch Flame */}
      <Sequence from={950} durationInFrames={70}>
        <Shot13HalberdierPunchIn />
      </Sequence>

      {/* SHOT 14 (f1020–f1100 | 2.67s): Continental Theater Strategic Overview */}
      <Sequence from={1020} durationInFrames={80}>
        <Shot14ContinentalMap />
      </Sequence>

      {/* SHOT 15 (f1100–f1180 | 2.67s): Harbor Objective Climax (Target Locked) */}
      <Sequence from={1100} durationInFrames={80}>
        <Shot15ObjectiveCaptured />
      </Sequence>

      {/* SHOT 16 (f1180–f1260 | 2.67s): Living Still Hero Silhouette (Warm Torchlight) */}
      <Sequence from={1180} durationInFrames={80}>
        <Shot16HeroSilhouette />
      </Sequence>

      {/* SHOT 17 (f1260–f1340 | 2.67s): High-Speed Topographic Contour Flyover */}
      <Sequence from={1260} durationInFrames={80}>
        <Shot17ContourFlyover />
      </Sequence>

      {/* SHOT 18 (f1340–f1420 | 2.67s): Division Counter Collision & Shockwave */}
      <Sequence from={1340} durationInFrames={80}>
        <Shot18CounterCollision />
      </Sequence>

      {/* SHOT 19 (f1420–f1510 | 3.0s): Grand Operational Synthesis (All Vectors Active) */}
      <Sequence from={1420} durationInFrames={90}>
        <Shot19GrandSynthesis />
      </Sequence>

      {/* SHOT 20 (f1510–f1800 | 9.67s): Master Outro Title Card & Film Fade */}
      <Sequence from={1510} durationInFrames={290}>
        <Shot20MasterOutro />
      </Sequence>

      {/* Master 4-Frame Film Dissolve Crossfade Glue */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: "inset 0 0 140px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// =========================================================================
// SHOT IMPLEMENTATIONS (Strict 2.5s–3.0s Modular Cuts)
// =========================================================================

const Shot1MacroMap: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [0.92, 1.04]);
  const rotX = interpolate(frame, [0, 80], [28, 22]);
  return (
    <TacticalMap2D5
      rotateX={rotX}
      rotateZ={-4}
      scale={scale}
      showPincers={false}
      showUnits={false}
      title="STRATEGIC WAR ROOM // MACRO THEATER"
      theaterLabel="NORTH PACIFIC OPERATIONAL OVERVIEW"
    />
  );
};

const Shot2CameraDive: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.0, 1.35]);
  const panX = interpolate(frame, [0, 80], [0, -140]);
  const rotX = interpolate(frame, [0, 80], [22, 16]);
  return (
    <TacticalMap2D5
      rotateX={rotX}
      rotateZ={-2}
      scale={scale}
      panX={panX}
      showPincers={false}
      showUnits={true}
      title="CAMERA DIVE: OPERATIONAL SECTOR KISKA"
      theaterLabel="TACTICAL ELEVATION RELIEF MAPPING"
    />
  );
};

const Shot3NorthernPincer: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 80], [0, 0.75]);
  const panX = interpolate(frame, [0, 80], [-80, -200]);
  return (
    <TacticalMap2D5
      rotateX={18}
      rotateZ={-3}
      scale={1.28}
      panX={panX}
      panY={-30}
      showPincers={true}
      pincerProgress={progress}
      showUnits={true}
      title="PHASE 1: NORTHERN PINCER ADVANCE"
      theaterLabel="LILLY BEACH SECTOR // 7th INFANTRY ASSAULT"
    />
  );
};

const Shot4SouthernPincer: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 80], [0.5, 1.0]);
  const panX = interpolate(frame, [0, 80], [120, 20]);
  return (
    <TacticalMap2D5
      rotateX={19}
      rotateZ={-2}
      scale={1.32}
      panX={panX}
      panY={-40}
      showPincers={true}
      pincerProgress={progress}
      showUnits={true}
      title="PHASE 2: SOUTHERN PINCER CONVERGENCE"
      theaterLabel="GERTRUDE COVE // 13th CANADIAN BRIGADE"
    />
  );
};

const Shot5EncirclementPocket: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.25, 1.45]);
  return (
    <TacticalMap2D5
      rotateX={15}
      rotateZ={-1}
      scale={scale}
      panX={-40}
      panY={-50}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      activeEncirclement={true}
      title="PHASE 3: COMPLETE ENCIRCLEMENT"
      theaterLabel="PULSING OBJECTIVE CAPTURE ZONE"
    />
  );
};

const Shot6LivingStillWide: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.0, 1.04]);
  return (
    <LivingStillScene
      scale={scale}
      flickerIntensity={1.0}
      caption="DUTCH MILITIA COMMANDER // CANAL PATROL"
    />
  );
};

const Shot7LivingStillPunchIn: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 70], [1.75, 1.88]);
  return (
    <LivingStillScene
      scale={scale}
      originX="70%"
      originY="35%"
      flickerIntensity={1.3}
      caption="FOCAL ACCENT: RESIDUARY TENSION"
    />
  );
};

const Shot8TopographicContours: React.FC = () => {
  const frame = useCurrentFrame();
  const rotX = interpolate(frame, [0, 80], [25, 18]);
  const panY = interpolate(frame, [0, 80], [60, -30]);
  return (
    <TacticalMap2D5
      rotateX={rotX}
      rotateZ={-5}
      scale={1.35}
      panY={panY}
      showPincers={false}
      showUnits={false}
      showContours={true}
      title="TOPOGRAPHIC ELEVATION RELIEF"
      theaterLabel="CONTOUR INTERVAL: 200 METERS"
    />
  );
};

const Shot9UnitAdvance: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 80], [0.3, 0.9]);
  return (
    <TacticalMap2D5
      rotateX={18}
      rotateZ={-2}
      scale={1.22}
      showPincers={true}
      pincerProgress={progress}
      showUnits={true}
      title="SYNCHRONIZED DIVISION MOVEMENT"
      theaterLabel="7th INF & 13th BDE COORDINATION"
    />
  );
};

const Shot10LivingStillMist: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.02, 1.06]);
  return (
    <LivingStillScene
      scale={scale}
      originX="40%"
      originY="50%"
      showMist={true}
      caption="ATMOSPHERIC VALUE POP // PALE CANAL MIST"
    />
  );
};

const Shot11IsometricTilt: React.FC = () => {
  const frame = useCurrentFrame();
  const rotX = interpolate(frame, [0, 80], [32, 26]);
  const rotZ = interpolate(frame, [0, 80], [-8, -4]);
  return (
    <TacticalMap2D5
      rotateX={rotX}
      rotateZ={rotZ}
      scale={1.4}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      title="35° ISOMETRIC LOW-ANGLE TILT"
      theaterLabel="TACTICAL CARTOGRAPHY DEPTH PERSPECTIVE"
    />
  );
};

const Shot12RadarSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.18, 1.3]);
  return (
    <TacticalMap2D5
      rotateX={16}
      rotateZ={-2}
      scale={scale}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      activeEncirclement={true}
      title="SURFACE RADAR DETECTION SWEEP"
      theaterLabel="BERING SEA CONVOY SCAN"
    />
  );
};

const Shot13HalberdierPunchIn: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 70], [1.65, 1.78]);
  return (
    <LivingStillScene
      scale={scale}
      originX="52%"
      originY="45%"
      flickerIntensity={1.4}
      caption="SECONDARY SUBJECT // TORCHBEARER ACCENT"
    />
  );
};

const Shot14ContinentalMap: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [0.95, 1.08]);
  return (
    <TacticalMap2D5
      rotateX={24}
      rotateZ={-4}
      scale={scale}
      showPincers={false}
      showUnits={false}
      title="CONTINENTAL STRATEGIC CONTEXT"
      theaterLabel="ALASKA DEFENSE COMMAND // 1943"
    />
  );
};

const Shot15ObjectiveCaptured: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.3, 1.5]);
  return (
    <TacticalMap2D5
      rotateX={14}
      rotateZ={0}
      scale={scale}
      panX={-80}
      panY={-60}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      activeEncirclement={true}
      title="OBJECTIVE SECURED // KISKA HARBOR"
      theaterLabel="ALLIED TASK FORCE 16 REACHES GOAL"
    />
  );
};

const Shot16HeroSilhouette: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.05, 1.09]);
  return (
    <LivingStillScene
      scale={scale}
      originX="65%"
      originY="40%"
      flickerIntensity={1.2}
      caption="ARMCHAIR HISTORIAN FIGURE-GROUND POP"
    />
  );
};

const Shot17ContourFlyover: React.FC = () => {
  const frame = useCurrentFrame();
  const panX = interpolate(frame, [0, 80], [-200, 100]);
  return (
    <TacticalMap2D5
      rotateX={20}
      rotateZ={-3}
      scale={1.38}
      panX={panX}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      title="RAPID TACTICAL FLYOVER"
      theaterLabel="ACROSS VOLCANIC RIDGELINE"
    />
  );
};

const Shot18CounterCollision: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 80], [1.4, 1.58]);
  return (
    <TacticalMap2D5
      rotateX={15}
      rotateZ={-1}
      scale={scale}
      panX={-50}
      panY={-50}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      activeEncirclement={true}
      title="DIVISION LEVEL ENGAGEMENT"
      theaterLabel="7th INF & KISKA DEFENSE LINE"
    />
  );
};

const Shot19GrandSynthesis: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 90], [1.15, 1.02]);
  const rotX = interpolate(frame, [0, 90], [16, 22]);
  return (
    <TacticalMap2D5
      rotateX={rotX}
      rotateZ={-3}
      scale={scale}
      showPincers={true}
      pincerProgress={1.0}
      showUnits={true}
      activeEncirclement={true}
      title="COMPLETE CAMPAIGN INTEGRATION"
      theaterLabel="2.5D VECTOR CARTOGRAPHY ENGINE"
    />
  );
};

const Shot20MasterOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = interpolate(frame, [0, 290], [1.0, 1.05]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0B0E14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#F8FAFC",
        opacity,
        transform: `scale(${scale})`,
        boxShadow: "inset 0 0 160px rgba(0,0,0,0.95)",
      }}
    >
      <div style={{ color: "#38BDF8", fontSize: "16px", letterSpacing: "4px", marginBottom: "12px" }}>
        [THE ARMCHAIR HISTORIAN // LIVING STILLS & CARTOGRAPHY ENGINE]
      </div>
      <div style={{ fontSize: "44px", fontWeight: "bold", letterSpacing: "6px", textAlign: "center" }}>
        TACTICAL VECTOR SHOWCASE
      </div>
      <div
        style={{
          width: "360px",
          height: "3px",
          backgroundColor: "#38BDF8",
          margin: "24px 0",
        }}
      />
      <div style={{ fontSize: "18px", color: "#94A3B8", letterSpacing: "2px", textAlign: "center" }}>
        2.5D HILLSHADES • ANIMATED PINCERS • 3D CAMERA TILTS • LIVING STILLS
      </div>
    </div>
  );
};
