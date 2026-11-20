import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  staticFile,
  Audio,
  Easing,
} from "remotion";

// Soft, atmospheric deterministic snow particles
const SEED_PARTICLES = Array.from({ length: 85 }, (_, i) => {
  const seed = (i * 7919 + 65537) % 100000;
  const depthRand = i % 10;
  const depth = depthRand < 2 ? "fg" : depthRand < 6 ? "mg" : "bg";
  return {
    id: i,
    x: (seed * 19.2) % 1920,
    speed: depth === "fg" ? 4.5 + (seed % 1.5) : depth === "mg" ? 2.6 + (seed % 1.0) : 1.3 + (seed % 0.6),
    size: depth === "fg" ? 3.6 + (seed % 1.8) : depth === "mg" ? 2.2 + (seed % 1.2) : 1.1 + (seed % 0.8),
    // Softened, blended opacities (no chalky pop)
    opacity: depth === "fg" ? 0.45 : depth === "mg" ? 0.28 : 0.15,
    swayFreq: 0.03 + (seed % 25) / 1000,
    swayAmp: depth === "fg" ? 22 + (seed % 18) : depth === "mg" ? 12 + (seed % 12) : 6 + (seed % 6),
    depth,
  };
});

export const BenchmarkCutSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // -------------------------------------------------------------
  // SHOT PACING & SMOOTH 6-FRAME CROSS-DISSOLVES
  // Cut 1: 0 to 74 frames (2.4s)
  // Cut 2: 70 to 128 frames (1.9s) -> 6-frame smooth cross-dissolve from Cut 1 (70-76)
  // Cut 3: 124 to 180 frames (1.8s) -> 6-frame smooth cross-dissolve from Cut 2 (124-130)
  // -------------------------------------------------------------

  // Cut 1 Camera (Wide Establishing)
  const cut1Scale = interpolate(frame, [0, 76], [1.0, 1.04], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateRight: "clamp",
  });

  // Cut 2 Camera (Resolute Pilot Face & Round Goggles - Origin 66% 33%)
  const cut2Local = Math.max(0, frame - 70);
  const cut2Scale = interpolate(cut2Local, [0, 60], [2.35, 2.45], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateRight: "clamp",
  });
  const cut2Opacity = interpolate(frame, [70, 76], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cut 3 Camera (Engine & Propeller Macro - Origin 26% 48%)
  const cut3Local = Math.max(0, frame - 124);
  const cut3Scale = interpolate(cut3Local, [0, 56], [2.15, 2.25], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateRight: "clamp",
  });
  const cut3Opacity = interpolate(frame, [124, 130], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const activeCut = frame < 72 ? 1 : frame < 126 ? 2 : 3;

  // -------------------------------------------------------------
  // DYNAMIC LIVING LIGHTING & MOVING SHADOWS
  // -------------------------------------------------------------
  const flickerRaw =
    Math.sin(frame * 0.38) * 0.05 +
    Math.cos(frame * 0.72) * 0.035 +
    Math.sin(frame * 1.15) * 0.02;
  const lanternFlicker = Math.max(0.18, 0.28 + flickerRaw);

  const cloudShadowX = interpolate(frame, [0, 180], [-200, 600]);

  const vignetteIntensity =
    0.72 + Math.sin(frame * 0.15) * 0.025 + Math.cos(frame * 0.08) * 0.02;

  // -------------------------------------------------------------
  // BLENDED PROCEDURAL SNOW ENGINE (WIND-STREAKED & TINTED)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1920, 1080);

    for (const p of SEED_PARTICLES) {
      const top = (frame * p.speed * 3.4 + p.id * 75) % 1160 - 50;
      const windDrift = frame * 2.8;
      const sway = Math.sin((frame + p.id * 18) * p.swayFreq) * p.swayAmp;
      const left = (p.x - windDrift + sway + 3840) % 2020 - 50;

      // Soft wind-angled ellipse streak (blends naturally into motion)
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(-0.48); // Wind drift tilt ~27 degrees
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.7, p.size * 0.65, 0, 0, Math.PI * 2);
      // Tinted pale icy cyan-slate (blends with midnight background)
      ctx.fillStyle = `rgba(185, 212, 238, ${p.opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070A0F",
        overflow: "hidden",
      }}
    >
      {/* --------------------------------------------------------- */}
      {/* BASE PLATES (COLOR GRADED TO SINK INTO ENVIRONMENT)       */}
      {/* --------------------------------------------------------- */}

      {/* CUT 1: WIDE ESTABLISHING */}
      {frame <= 78 && (
        <AbsoluteFill
          style={{
            transform: `scale(${cut1Scale})`,
            transformOrigin: "50% 50%",
            overflow: "hidden",
          }}
        >
          <img
            src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
            alt="Soviet Airfield Wide"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              // Environmental Tone Curve: Sinks deep blacks, softens oversaturation
              filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* CUT 2: HERO PORTRAIT PUNCH-IN */}
      {frame >= 70 && frame <= 132 && (
        <AbsoluteFill
          style={{
            opacity: cut2Opacity,
            transform: `scale(${cut2Scale})`,
            transformOrigin: "66% 33%",
            overflow: "hidden",
          }}
        >
          <img
            src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
            alt="Soviet Pilot Portrait"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* CUT 3: ENGINE & PROPELLER MACRO */}
      {frame >= 124 && (
        <AbsoluteFill
          style={{
            opacity: cut3Opacity,
            transform: `scale(${cut3Scale})`,
            transformOrigin: "26% 48%",
            overflow: "hidden",
          }}
        >
          <img
            src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
            alt="Polikarpov Engine & Propeller Macro"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* --------------------------------------------------------- */}
      {/* ENVIRONMENTAL COLOR GRADING LAYERS                        */}
      {/* Harmonizes the character directly into the cold Russian night */}
      {/* --------------------------------------------------------- */}

      {/* 1. Cold Ambient Steppe Night Wash (Soft-Light) */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(145deg, rgba(16, 28, 48, 0.40) 0%, rgba(10, 16, 26, 0.20) 45%, rgba(20, 36, 56, 0.35) 100%)",
          mixBlendMode: "soft-light",
          pointerEvents: "none",
        }}
      />

      {/* 2. Frozen Snow Upward Ground Reflection (Cyan Ice Bounce) */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(135, 200, 240, 0.14) 0%, rgba(110, 175, 225, 0.05) 28%, rgba(0,0,0,0) 50%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* 3. Deep Shadow Anchor (Binds blacks to midnight indigo #0A0F18) */}
      <AbsoluteFill
        style={{
          backgroundColor: "#0A0F18",
          opacity: 0.16,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      {/* --------------------------------------------------------- */}
      {/* MOVING CLOUD / MOONLIGHT SHADOW SWEEP                     */}
      {/* --------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: cloudShadowX,
          width: 1400,
          height: 1500,
          background: "radial-gradient(ellipse at center, rgba(3, 6, 12, 0.26) 0%, rgba(0,0,0,0) 70%)",
          transform: "rotate(-15deg)",
          pointerEvents: "none",
        }}
      />

      {/* --------------------------------------------------------- */}
      {/* DYNAMIC AMBER LANTERN LIGHT (INTEGRATED & BALANCED)       */}
      {/* --------------------------------------------------------- */}
      {activeCut === 1 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 78% 46%, rgba(255, 145, 35, ${lanternFlicker * 0.75}) 0%, rgba(230, 95, 20, ${lanternFlicker * 0.30}) 20%, rgba(0,0,0,0) 45%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
      {activeCut === 2 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 86% 40%, rgba(255, 150, 40, ${lanternFlicker * 1.05}) 0%, rgba(235, 105, 25, ${lanternFlicker * 0.45}) 26%, rgba(0,0,0,0) 55%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
      {activeCut === 3 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 35% 55%, rgba(255, 140, 35, ${lanternFlicker * 0.28}) 0%, rgba(0,0,0,0) 38%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}

      {/* --------------------------------------------------------- */}
      {/* BLENDED PROCEDURAL SNOWFALL LAYER                         */}
      {/* Soft wind streaks with subtle blur (eliminates harsh pop) */}
      {/* --------------------------------------------------------- */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: 0.82,
          filter: "blur(0.4px)",
          zIndex: 8,
        }}
      />

      {/* --------------------------------------------------------- */}
      {/* HIGH-CLASS LENS VIGNETTE & ARCHIVAL CORNER SHADOW         */}
      {/* --------------------------------------------------------- */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 55% 45%, rgba(0, 0, 0, 0) 32%, rgba(3, 5, 10, ${vignetteIntensity}) 72%, rgba(1, 2, 5, 0.98) 100%)`,
          pointerEvents: "none",
          zIndex: 12,
        }}
      />

      {/* SUBTLE CINEMATIC BORDER ACCENT */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "inset 0 0 80px rgba(0, 0, 0, 0.75)",
          pointerEvents: "none",
          zIndex: 13,
        }}
      />

      {/* HUD BADGE / SHOT INFO */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 48,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "'Courier New', Courier, monospace",
          zIndex: 25,
        }}
      >
        <div
          style={{
            backgroundColor: "#8B2519",
            color: "#FAF6EE",
            fontSize: 12,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 4,
            letterSpacing: "0.15em",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          {activeCut === 1
            ? "CUT 1: WIDE ESTABLISHING"
            : activeCut === 2
            ? "CUT 2: HERO PORTRAIT PUNCH-IN"
            : "CUT 3: MACRO ENGINE & PROPELLER"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#D0D9E5",
            textShadow: "0 2px 6px rgba(0,0,0,0.9)",
          }}
        >
          BLENDED SNOW STREAKS + CINEMATIC NIGHT COLOR GRADE
        </div>
      </div>

      {/* AMBIENT AUDIO & DISSOLVE WHOOSH */}
      <Audio
        src={staticFile("night_witches/sfx_winter_steppe_wind_howl.mp3")}
        volume={0.12}
        startFrom={0}
      />
      {frame >= 70 && frame <= 85 && (
        <Audio
          src={staticFile("night_witches/sfx_camera_whoosh_transition.mp3")}
          volume={0.18}
        />
      )}
      {frame >= 124 && frame <= 140 && (
        <Audio
          src={staticFile("night_witches/sfx_camera_whoosh_transition.mp3")}
          volume={0.18}
        />
      )}
    </AbsoluteFill>
  );
};
