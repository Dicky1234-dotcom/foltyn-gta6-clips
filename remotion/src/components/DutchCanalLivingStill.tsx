import React from 'react';
import {
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Helper for animated flame cycle (slot-swap simulation with procedural combustion)
interface FlameProps {
  x: string;
  y: string;
  scale?: number;
  flip?: boolean;
}

const AnimatedTorchFlame: React.FC<FlameProps> = ({ x, y, scale = 1, flip = false }) => {
  const frame = useCurrentFrame();

  const flicker1 = Math.sin(frame * 0.45) * 0.08 + Math.cos(frame * 1.3) * 0.06;
  const flicker2 = Math.cos(frame * 0.6) * 0.1 + Math.sin(frame * 1.9) * 0.05;
  const sway = Math.sin(frame * 0.28) * 3.5 + Math.cos(frame * 0.8) * 2;

  const flameScaleY = (1 + flicker1) * scale;
  const flameScaleX = (1 - flicker2 * 0.5) * scale * (flip ? -1 : 1);

  const shapeIndex = Math.floor(frame / 2.5) % 4;
  const pathD = [
    'M 0 0 C -12 -25 -22 -55 0 -85 C 8 -65 18 -50 15 -35 C 22 -45 20 -60 25 -70 C 28 -50 20 -20 0 0 Z',
    'M 0 0 C -15 -30 -18 -60 -4 -90 C 4 -70 12 -55 18 -40 C 25 -50 28 -65 22 -78 C 26 -48 18 -18 0 0 Z',
    'M 0 0 C -10 -22 -24 -50 3 -82 C 10 -62 14 -48 20 -32 C 20 -44 24 -58 28 -66 C 24 -45 16 -16 0 0 Z',
    'M 0 0 C -14 -28 -20 -58 -2 -88 C 6 -68 15 -52 16 -38 C 24 -48 22 -62 26 -74 C 27 -49 19 -19 0 0 Z',
  ][shapeIndex];

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -100%) rotate(${sway}deg) scale(${flameScaleX}, ${flameScaleY})`,
        transformOrigin: '50% 100%',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    >
      <svg width="80" height="120" viewBox="-40 -100 80 120" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={`flame-glow-${x}`} cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#FFF9D2" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#FF9429" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#E53E3E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#B91C1C" stopOpacity="0" />
          </radialGradient>
          <filter id={`blur-flame-${x}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        <path
          d={pathD}
          fill={`url(#flame-glow-${x})`}
          filter={`url(#blur-flame-${x})`}
          opacity={0.8}
          transform="scale(1.15, 1.1) translate(0, 5)"
        />
        <path d={pathD} fill="#FF9429" opacity={0.92} />
        <path
          d={pathD}
          fill="#FFF4B8"
          opacity={0.95}
          transform="scale(0.55, 0.65) translate(0, -10)"
        />
      </svg>
    </div>
  );
};

// 💨 CONTINUOUS PROCEDURAL MOVING SMOKE PLUME
interface SmokePlumeProps {
  originX: number;
  originY: number;
  count?: number;
  windDrift?: number;
}

const AnimatedSmokePlume: React.FC<SmokePlumeProps> = ({
  originX,
  originY,
  count = 14,
  windDrift = 1.0,
}) => {
  const frame = useCurrentFrame();

  const puffs = Array.from({ length: count }).map((_, i) => {
    const seed = i * 47.3;
    const speed = 0.85 + (i % 4) * 0.25;
    const lifeCycle = (frame * speed + seed * 9) % 95;
    const progress = lifeCycle / 95;

    const puffScale = 0.5 + progress * 2.8;
    const drift = Math.sin(frame * 0.05 + seed) * 18 + progress * 32 * windDrift;
    const posX = originX + drift * 0.07;
    const posY = originY - progress * 24;

    const alpha =
      progress < 0.2
        ? (progress / 0.2) * 0.22
        : (1 - progress) * 0.22;

    const blurRadius = 6 + progress * 14;

    return {
      posX,
      posY,
      puffScale,
      alpha,
      blurRadius,
      key: i,
    };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {puffs.map((p) => (
        <div
          key={p.key}
          style={{
            position: 'absolute',
            left: `${p.posX}%`,
            top: `${p.posY}%`,
            width: 44,
            height: 38,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(200, 215, 230, 0.9) 0%, rgba(180, 195, 210, 0.4) 45%, transparent 75%)',
            transform: `translate(-50%, -50%) scale(${p.puffScale})`,
            filter: `blur(${p.blurRadius}px)`,
            opacity: p.alpha,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  );
};

// 👁️ NATURAL CHARACTER BLINK ENGINE (Discrete Slot-Swap Overlay)
// Eliminates SVG matrix transform displacement bugs entirely.
// Uses pixel-aligned 1024x571 transparent PNGs matching original graphic novel artwork.
const CaptainNaturalBlink: React.FC<{ filter?: string; punchIn?: boolean }> = ({
  filter,
  punchIn = false,
}) => {
  const frame = useCurrentFrame();

  // Natural biological blink schedule:
  // 4-frame cycle: Half -> Closed -> Closed -> Half -> Open
  // If punchIn shot (duration ~70 frames): blink at local frame 35 (~1.1s in)
  // If full wide shot: blink at frame 42, 126, 205
  const blinkKeyframes = punchIn ? [35] : [42, 126, 205];
  let sprite: 'half' | 'closed' | null = null;

  for (const start of blinkKeyframes) {
    if (frame >= start && frame < start + 4) {
      const step = frame - start;
      if (step === 0) sprite = 'half';
      else if (step === 1 || step === 2) sprite = 'closed';
      else if (step === 3) sprite = 'half';
      break;
    }
  }

  if (!sprite) return null;

  return (
    <img
      src={staticFile(sprite === 'closed' ? 'captain_eyes_closed.png' : 'captain_eyes_half.png')}
      alt="Captain Blink"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter,
        pointerEvents: 'none',
        zIndex: 6,
      }}
    />
  );
};

export const DutchCanalLivingStill: React.FC<{
  punchIn?: boolean;
  gradeStyle?: 'rembrandt' | 'lemmino' | 'vellum' | 'baltic' | 'khaki';
}> = ({ punchIn = false, gradeStyle = 'vellum' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 1. DYNAMIC LIGHT DIRECTION & NOTICEABLE MICRO-SHAKING MATH
  const microShakeX = Math.sin(frame * 0.85) * 3.2 + Math.cos(frame * 2.2) * 2.1;
  const microShakeY = Math.cos(frame * 0.95) * 2.8 + Math.sin(frame * 2.5) * 1.8;
  const intensityFlutter =
    0.28 + Math.sin(frame * 0.4) * 0.06 + Math.cos(frame * 1.6) * 0.04;
  const rimLightFlutter =
    0.35 + Math.sin(frame * 0.5) * 0.08 + Math.cos(frame * 2.1) * 0.05;

  // Camera slow cinematic breathing / push
  const baseScale = punchIn
    ? interpolate(frame, [0, durationInFrames], [1.75, 1.82])
    : interpolate(frame, [0, durationInFrames], [1.01, 1.05]);
  const camPanX = punchIn ? -140 : interpolate(frame, [0, durationInFrames], [0, -15]);
  const camPanY = punchIn ? -30 : interpolate(frame, [0, durationInFrames], [0, -5]);
  const transformOrigin = punchIn ? '62% 45%' : '50% 50%';

  // 24 Procedural Rising Embers
  const embers = Array.from({ length: 24 }).map((_, i) => {
    const seed = i * 73.1;
    const speed = 1.6 + (i % 5) * 0.45;
    const lifeCycle = (frame * speed + seed * 12) % 180;
    const progress = lifeCycle / 180;

    const isLeftTorch = i % 3 !== 0;
    const originX = isLeftTorch ? 30.5 : 83.2;
    const originY = isLeftTorch ? 23 : 19;

    const driftX = Math.sin(frame * 0.06 + seed) * 35 + progress * 25;
    const posY = originY - progress * 40;
    const posX = originX + driftX * 0.08;
    const alpha = (1 - progress) * 0.85;
    const size = 2 + (i % 3);

    return { posX, posY, alpha, size, key: i };
  });

  // 🎨 COLOR GRADING FILTER PRESETS (Mature Historical Styles)
  const gradeFilters = {
    // Style 1: Golden Age Rembrandt Baroque Chiaroscuro
    rembrandt: {
      filter: 'contrast(1.15) brightness(0.92) saturate(1.12) sepia(0.22)',
      overlayColor: 'rgba(60, 35, 10, 0.25)',
      overlayBlend: 'soft-light' as const,
      shadowMultiply: 'rgba(25, 15, 8, 0.35)',
    },
    // Style 2: Cold-Case Investigative (LEMMiNO / Fincher Slate)
    lemmino: {
      filter: 'contrast(1.08) brightness(0.95) saturate(0.85) hue-rotate(-6deg)',
      overlayColor: 'rgba(18, 28, 44, 0.32)',
      overlayBlend: 'soft-light' as const,
      shadowMultiply: 'rgba(10, 16, 26, 0.4)',
    },
    // Style 3: Archival Vellum & Iron Gall Etching (Requested as default)
    vellum: {
      filter: 'contrast(1.12) brightness(0.90) saturate(0.70) sepia(0.42)',
      overlayColor: 'rgba(215, 195, 160, 0.28)',
      overlayBlend: 'multiply' as const,
      shadowMultiply: 'rgba(35, 28, 20, 0.45)',
    },
    // Style 4: Baltic Frost / Nordic Midnight (Cold Indigo vs Vivid Amber)
    baltic: {
      filter: 'contrast(1.18) brightness(0.90) saturate(0.95) hue-rotate(-12deg)',
      overlayColor: 'rgba(10, 24, 48, 0.42)',
      overlayBlend: 'hard-light' as const,
      shadowMultiply: 'rgba(5, 12, 22, 0.5)',
    },
    // Style 5: Armchair Historian Khaki War Grade (Muted Grounded Historical)
    khaki: {
      filter: 'contrast(1.10) brightness(0.94) saturate(0.88)',
      overlayColor: 'rgba(75, 78, 65, 0.22)',
      overlayBlend: 'soft-light' as const,
      shadowMultiply: 'rgba(18, 20, 18, 0.35)',
    },
  }[gradeStyle];

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
      {/* 🎵 AUDIO MASTER LAYER */}
      <Audio
        src={staticFile('sfx/sfx_trench_brazier_embers.mp3')}
        volume={0.65}
        startFrom={0}
      />
      <Audio
        src={staticFile('sfx/sfx_winter_steppe_wind_howl.mp3')}
        volume={0.25}
        startFrom={0}
      />
      <Audio
        src={staticFile('sfx/sfx_investigative_drone_bed.wav')}
        volume={0.35}
        startFrom={0}
      />

      {/* Main Scaled World Container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${baseScale}) translate(${camPanX}px, ${camPanY}px)`,
          transformOrigin,
          width: '100%',
          height: '100%',
        }}
      >
        {/* BASE MASTER ILLUSTRATION PLATE WITH MATURE COLOR GRADE */}
        <img
          src={staticFile('dutch_canal_night_torch_patrol.jpg')}
          alt="Dutch Militia Canal Patrol"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: gradeFilters.filter,
          }}
        />

        {/* 👁️ NATURAL CHARACTER BLINK LAYER (Captain blinks naturally) */}
        <CaptainNaturalBlink filter={gradeFilters.filter} punchIn={punchIn} />

        {/* 💨 CONTINUOUS MOVING SMOKE PLUMES FROM BOTH TORCHES */}
        <AnimatedSmokePlume originX={30.2} originY={18.0} count={16} windDrift={1.2} />
        <AnimatedSmokePlume originX={83.5} originY={13.5} count={12} windDrift={-0.6} />

        {/* 🌫️ ATMOSPHERIC CANAL HAZE DRIFT */}
        <div
          style={{
            position: 'absolute',
            left: '-20%',
            top: '36%',
            width: '140%',
            height: '35%',
            background:
              'radial-gradient(ellipse at 40% 50%, rgba(200, 220, 240, 0.12) 0%, rgba(180, 205, 230, 0.05) 50%, transparent 80%)',
            transform: `translateX(${interpolate(frame, [0, durationInFrames], [0, 80])}px)`,
            filter: 'blur(16px)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />

        {/* 🔥 ANIMATED TORCH 1 (Left Soldier Torch Basket at 30.2% X, 23.8% Y) */}
        <AnimatedTorchFlame x="30.2%" y="23.8%" scale={1.05} />

        {/* 🔥 ANIMATED TORCH 2 (Right Soldier Torch Basket at 83.5% X, 18.2% Y) */}
        <AnimatedTorchFlame x="83.5%" y="18.2%" scale={0.92} flip={true} />

        {/* 💡 THE NOTICEABLE MICRO-SHAKING TORCHLIGHT ON BODIES & FACES */}
        {/* A. Left Torch Primary Radial Light Source */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${30.2 + microShakeX * 0.12}% ${
              23.8 + microShakeY * 0.12
            }%, rgba(255, 148, 41, ${intensityFlutter}) 0%, rgba(245, 110, 25, ${
              intensityFlutter * 0.65
            }) 24%, rgba(180, 60, 10, ${intensityFlutter * 0.25}) 48%, transparent 72%)`,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* B. Right Torch Radial Light Source */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${83.5 - microShakeX * 0.08}% ${
              18.2 + microShakeY * 0.08
            }%, rgba(255, 148, 41, ${intensityFlutter * 0.85}) 0%, rgba(245, 110, 25, ${
              intensityFlutter * 0.5
            }) 20%, transparent 55%)`,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* C. Direct Chiaroscuro Rim-Light Flutter across Captain's Face & Starched White Ruff */}
        <div
          style={{
            position: 'absolute',
            left: '52%',
            top: '20%',
            width: '28%',
            height: '60%',
            background: `radial-gradient(ellipse at 35% 38%, rgba(255, 180, 70, ${
              rimLightFlutter * 0.95
            }) 0%, rgba(255, 130, 30, ${rimLightFlutter * 0.45}) 40%, transparent 75%)`,
            transform: `translate(${microShakeX * 1.4}px, ${microShakeY * 1.1}px)`,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* D. Additional High-Luminance Flash on the White Ruff */}
        <div
          style={{
            position: 'absolute',
            left: '56%',
            top: '29%',
            width: '18%',
            height: '18%',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255, 210, 120, ${
              rimLightFlutter * 0.75
            }) 0%, transparent 65%)`,
            transform: `translate(${microShakeX * 1.8}px, ${microShakeY * 1.2}px)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* 🌊 CANAL WATER TORCHLIGHT REFLECTION RIPPLE */}
        <div
          style={{
            position: 'absolute',
            left: '12%',
            top: '62%',
            width: '24%',
            height: '24%',
            background: `radial-gradient(ellipse at center, rgba(255, 140, 35, ${
              0.22 + Math.sin(frame * 0.4) * 0.08
            }) 0%, rgba(200, 90, 15, 0.12) 45%, transparent 75%)`,
            transform: `scale(${1 + Math.sin(frame * 0.3) * 0.08}, ${
              1 + Math.cos(frame * 0.35) * 0.12
            }) skewX(${Math.sin(frame * 0.25) * 6}deg)`,
            mixBlendMode: 'color-dodge',
            filter: 'blur(3px)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* 🌫️ LOW CANAL WATER MIST DRIFT */}
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            top: '48%',
            width: '60%',
            height: '30%',
            background:
              'linear-gradient(90deg, rgba(160, 200, 225, 0) 0%, rgba(160, 200, 225, 0.12) 40%, rgba(160, 200, 225, 0.05) 80%, transparent 100%)',
            transform: `translateX(${interpolate(frame, [0, durationInFrames], [0, 50])}px)`,
            filter: 'blur(10px)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* ✨ RISING GLOWING EMBERS */}
        {embers.map((e) => (
          <div
            key={e.key}
            style={{
              position: 'absolute',
              left: `${e.posX}%`,
              top: `${e.posY}%`,
              width: e.size,
              height: e.size,
              borderRadius: '50%',
              backgroundColor: '#FFB24D',
              boxShadow: '0 0 6px #FF8C00, 0 0 12px #FF4500',
              opacity: e.alpha,
              pointerEvents: 'none',
              zIndex: 7,
            }}
          />
        ))}

        {/* Environmental Historical Tint Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: gradeFilters.overlayColor,
            mixBlendMode: gradeFilters.overlayBlend,
            pointerEvents: 'none',
            zIndex: 8,
          }}
        />

        {/* Shadow Multiplier Tone Curve */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: gradeFilters.shadowMultiply,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
            zIndex: 8,
          }}
        />
      </div>

      {/* Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  );
};
