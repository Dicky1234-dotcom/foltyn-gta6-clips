import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// =========================================================================
// BLENDED PROCEDURAL SNOWFLAKE PARTICLES (DETERMINISTIC 60 FPS)
// =========================================================================
interface SnowFlake {
  id: number;
  x: number;
  speed: number;
  size: number;
  opacity: number;
  swayFreq: number;
  swayAmp: number;
  depth: "fg" | "mg" | "bg";
}

const SEED_PARTICLES: SnowFlake[] = Array.from({ length: 90 }, (_, i) => {
  const seed = (i * 7919 + 65537) % 100000;
  const depthRand = i % 10;
  const depth: "fg" | "mg" | "bg" =
    depthRand < 2 ? "fg" : depthRand < 6 ? "mg" : "bg";
  return {
    id: i,
    x: (seed * 19.2) % 1920,
    speed:
      depth === "fg"
        ? 4.6 + (seed % 1.6)
        : depth === "mg"
        ? 2.7 + (seed % 1.1)
        : 1.3 + (seed % 0.6),
    size:
      depth === "fg"
        ? 3.8 + (seed % 2.0)
        : depth === "mg"
        ? 2.3 + (seed % 1.2)
        : 1.1 + (seed % 0.8),
    opacity: depth === "fg" ? 0.45 : depth === "mg" ? 0.28 : 0.15,
    swayFreq: 0.03 + (seed % 25) / 1000,
    swayAmp:
      depth === "fg"
        ? 22 + (seed % 18)
        : depth === "mg"
        ? 12 + (seed % 12)
        : 6 + (seed % 6),
    depth,
  };
});

export const NightWitchesHook: React.FC = () => {
  const frame = useCurrentFrame();
  const snowCanvasRef = useRef<HTMLCanvasElement>(null);

  // -----------------------------------------------------------------------
  // SHOT PACING: 14 CINEMATIC CUTS (ALL STRICTLY <= 3.0s | NO LINGERING)
  // -----------------------------------------------------------------------
  function crossfadeOpacity(f: number, start: number, end: number) {
    const fadeIn = interpolate(f, [start, start + 6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    const fadeOut = interpolate(f, [end - 6, end], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    return Math.min(fadeIn, fadeOut);
  }

  // Camera pushes per shot (subtle 1.02x–1.04x, zero edge bleed)
  const push01 = interpolate(frame, [0, 85], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push02 = interpolate(frame, [80, 165], [1.0, 1.03], { extrapolateRight: "clamp" });
  const push03 = interpolate(frame, [160, 245], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push04 = interpolate(frame, [240, 335], [2.4, 2.5], { extrapolateRight: "clamp" });
  const push05 = interpolate(frame, [330, 430], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push06 = interpolate(frame, [425, 510], [1.0, 1.045], { extrapolateRight: "clamp" });
  const push07 = interpolate(frame, [505, 630], [1.0, 1.04], { extrapolateRight: "clamp" });
  const push08 = interpolate(frame, [625, 725], [2.15, 2.25], { extrapolateRight: "clamp" });
  const push09 = interpolate(frame, [720, 820], [2.25, 2.35], { extrapolateRight: "clamp" });
  const push10 = interpolate(frame, [815, 920], [2.45, 2.55], { extrapolateRight: "clamp" });
  const push11 = interpolate(frame, [915, 1022], [1.04, 1.08], { extrapolateRight: "clamp" });
  const push12 = interpolate(frame, [1022, 1100], [1.0, 1.04], { extrapolateRight: "clamp" });
  const push13 = interpolate(frame, [1095, 1195], [1.0, 1.04], { extrapolateRight: "clamp" });
  const push14 = interpolate(frame, [1190, 1275], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push15 = interpolate(frame, [1270, 1360], [1.8, 1.95], { extrapolateRight: "clamp" });

  // Detonation screen shake & blast flash
  const isDetonation = frame >= 1022 && frame <= 1080;
  const shakeX = isDetonation
    ? Math.sin((frame - 1022) * 1.6) * Math.max(0, 32 - (frame - 1022) * 0.7)
    : 0;
  const shakeY = isDetonation
    ? Math.cos((frame - 1022) * 1.9) * Math.max(0, 24 - (frame - 1022) * 0.6)
    : 0;
  const blastFlash =
    frame >= 1022 && frame <= 1038
      ? interpolate(frame, [1022, 1038], [0.95, 0], { extrapolateRight: "clamp" })
      : 0;

  // Archival Film Grain & Shutter Transition (At frame 425 on "Then he hears it")
  const isFilmTransition = frame >= 423 && frame <= 436;
  const filmJitterY = isFilmTransition
    ? Math.sin((frame - 425) * 4.6) * Math.max(0, 7 - (frame - 423) * 0.5)
    : 0;
  const filmBurnOpacity =
    frame >= 424 && frame <= 430
      ? interpolate(frame, [424, 426, 430], [0, 0.65, 0], { extrapolateRight: "clamp" })
      : 0;
  const filmGrainBurst =
    frame >= 423 && frame <= 436
      ? interpolate(frame, [423, 426, 436], [0, 0.82, 0], { extrapolateRight: "clamp" })
      : 0;

  // Dynamic Flame Flutter
  const flameRaw =
    Math.sin(frame * 0.38) * 0.05 +
    Math.cos(frame * 0.72) * 0.035 +
    Math.sin(frame * 1.15) * 0.02;
  const flameFlicker = Math.max(0.18, 0.28 + flameRaw);

  // Moving cloud shadow drift
  const cloudShadowX = interpolate(frame, [0, 1360], [-300, 1600]);

  // Sweeping Searchlight Cones in the Clouds (Frames 505 - 920)
  const searchlightAngle1 = Math.sin((frame - 505) * 0.04) * 14 - 18; // swings -32 to -4 deg
  const searchlightAngle2 = Math.cos((frame - 505) * 0.035) * 12 + 15; // swings +3 to +27 deg

  // Archival Field Stamp Opacity (Shot 1: 0 to 85)
  const stampOpacity = interpolate(frame, [10, 22, 70, 82], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // High-Class Vignette Breathing
  const vignetteIntensity =
    0.72 + Math.sin(frame * 0.15) * 0.025 + Math.cos(frame * 0.08) * 0.02;

  // Audio dynamic leveling: Wind ducks to DEAD SILENCE on "everything is completely quiet" (frames 330-460)
  const windVolume =
    frame >= 330 && frame <= 460
      ? 0.0
      : frame > 460 && frame <= 500
      ? interpolate(frame, [460, 500], [0.0, 0.045])
      : 0.045;

  // Brazier embers crackle volume (subtle background texture)
  const embersVolume =
    frame >= 80 && frame <= 330
      ? 0.04
      : frame > 330 && frame <= 345
      ? interpolate(frame, [330, 345], [0.04, 0.0])
      : 0.0;

  // Po-2 gliding broom whistle creeps into the dead silence (subtle eerie build)
  const whistleVolume =
    frame >= 480 && frame <= 1022
      ? interpolate(frame, [480, 850, 1022], [0.0, 0.08, 0.12])
      : 0.0;

  // Post-blast concussion tinnitus (gentle high-frequency ringing, non-piercing)
  const tinnitusVolume =
    frame >= 1022 && frame <= 1180
      ? interpolate(frame, [1022, 1028, 1180], [0.0, 0.065, 0.0], {
          extrapolateRight: "clamp",
        })
      : 0.0;

  // Dark investigative synth drone bed (Rich D-minor cinematic core, clearly audible)
  const droneVolume =
    frame >= 330 && frame < 425
      ? 0.0
      : frame >= 425 && frame < 480
      ? 0.24
      : frame >= 480 && frame <= 1022
      ? interpolate(frame, [480, 850], [0.22, 0.12])
      : frame >= 1022 && frame <= 1065
      ? 0.0
      : frame > 1065 && frame <= 1120
      ? interpolate(frame, [1065, 1120], [0.0, 0.22])
      : 0.20;

  // -----------------------------------------------------------------------
  // PROCEDURAL CANVAS SNOW (BLENDED WIND STREAKS)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = snowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1920, 1080);

    for (const p of SEED_PARTICLES) {
      const top = (frame * p.speed * 3.4 + p.id * 75) % 1160 - 50;
      const windDrift = frame * 2.8;
      const sway = Math.sin((frame + p.id * 18) * p.swayFreq) * p.swayAmp;
      const left = (p.x - windDrift + sway + 5760) % 2020 - 50;

      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(-0.48); // Wind drift ~27 deg
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.7, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(185, 212, 238, ${p.opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#06090E",
        overflow: "hidden",
      }}
    >
      {/* SHAKE CONTAINER FOR BLAST IMPACT & OPTICAL FILM GATE JITTER */}
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY + filmJitterY}px)`,
        }}
      >
        {/* ============================================================= */}
        {/* SHOT 01 (0–85): WIDE FROZEN STEPPE (PLATE 1)                   */}
        {/* ============================================================= */}
        {frame <= 88 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 0, 85),
              transform: `scale(${push01})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/scene1_don_river_steppe.jpg")}
              alt="Frozen Don River Steppe"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 02 (80–165): GERMAN SENTRY IN TRENCH WIDE (PLATE 2)       */}
        {/* ============================================================= */}
        {frame >= 78 && frame <= 168 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 80, 165),
              transform: `scale(${push02})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/scene2_german_sentry.jpg")}
              alt="German Sentry in Trench"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 03 (160–245): SENTRY WEARY EYES CLOSE-UP (PLATE 3)       */}
        {/* ============================================================= */}
        {frame >= 158 && frame <= 248 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 160, 245),
              transform: `scale(${push03})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/scene3_sentry_eyes.jpg")}
              alt="Sentry Cold Eyes Close-up"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 04 (240–335): GLOWING BRAZIER BUCKET & EMBERS MACRO      */}
        {/* ============================================================= */}
        {frame >= 238 && frame <= 338 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 240, 335),
              transform: `scale(${push04})`,
              transformOrigin: "27% 65%",
            }}
          >
            <img
              src={staticFile("night_witches/scene2_german_sentry.jpg")}
              alt="Glowing Brazier Embers"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 05 (330–430): BARBED WIRE & DEAD SILENCE (PLATE 1)       */}
        {/* ============================================================= */}
        {frame >= 328 && frame <= 433 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 330, 430),
              transform: `scale(${push05})`,
              transformOrigin: "40% 70%",
            }}
          >
            <img
              src={staticFile("night_witches/scene1_don_river_steppe.jpg")}
              alt="Barbed Wire & Eerie Silence"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 06 (425–510): SENTRY TERROR REACTION SHOT (PLATE 4)       */}
        {/* ============================================================= */}
        {frame >= 423 && frame <= 513 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 425, 510),
              transform: `scale(${push06})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/scene4_sentry_reaction.jpg")}
              alt="Sentry Reaction Upward Fear"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 07 (505–630): SILENT PO-2 GLIDING IN CLOUDS (PLATE 6)    */}
        {/* ============================================================= */}
        {frame >= 503 && frame <= 633 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 505, 630),
              transform: `scale(${push07})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              alt="Po-2 Gliding Silently in Clouds"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 08 (625–725): SENTRY DILATED EYES SEARCHING SKY          */}
        {/* ============================================================= */}
        {frame >= 623 && frame <= 728 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 625, 725),
              transform: `scale(${push08})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/scene3_sentry_eyes.jpg")}
              alt="Sentry Paranoia Close-up"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 09 (720–820): PO-2 COCKPITS & FEMALE PILOTS SILHOUETTE   */}
        {/* ============================================================= */}
        {frame >= 718 && frame <= 823 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 720, 820),
              transform: `scale(${push09})`,
              transformOrigin: "52% 44%",
            }}
          >
            <img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              alt="Po-2 Female Aviators in Cockpit"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 10 (815–920): WOODEN PROPELLER & ENGINE MACRO           */}
        {/* ============================================================= */}
        {frame >= 813 && frame <= 923 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 815, 920),
              transform: `scale(${push10})`,
              transformOrigin: "31% 52%",
            }}
          >
            <img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              alt="Po-2 Windmilling Propeller"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 11 (915–1022): SENTRY COWERING BEFORE BLAST (PLATE 2)    */}
        {/* ============================================================= */}
        {frame >= 913 && frame <= 1022 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 915, 1022),
              transform: `scale(${push11})`,
              transformOrigin: "60% 45%",
            }}
          >
            <img
              src={staticFile("night_witches/scene2_german_sentry.jpg")}
              alt="Sentry Cowering in Trench"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 12 (1022–1100): CATASTROPHIC TRENCH BLAST (PLATE 5)       */}
        {/* ============================================================= */}
        {frame >= 1022 && frame <= 1104 && (
          <AbsoluteFill
            style={{
              opacity:
                frame === 1022 ? 1 : crossfadeOpacity(frame, 1022, 1100),
              transform: `scale(${push12})`,
              transformOrigin: "42% 48%",
            }}
          >
            <img
              src={staticFile("night_witches/scene8_trench_detonation.jpg")}
              alt="Catastrophic Trench Detonation"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.10) brightness(0.96) saturate(0.95)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 13 (1095–1195): GERMAN PANZER ARMORED COLUMN (PLATE 6)   */}
        {/* ============================================================= */}
        {frame >= 1093 && frame <= 1198 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1095, 1195),
              transform: `scale(${push13})`,
              transformOrigin: "45% 55%",
            }}
          >
            <img
              src={staticFile("night_witches/scene9_german_panzer_column.jpg")}
              alt="German Panzer Armored Column"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 14 (1190–1275): SOVIET NIGHT WITCH HERO REVEAL WIDE (PL 8)*/}
        {/* ============================================================= */}
        {frame >= 1188 && frame <= 1278 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1190, 1275),
              transform: `scale(${push14})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
              alt="Soviet Night Witch Pilot Reveal Wide"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 15 (1270–1360): HERO PORTRAIT PUNCH-IN ON RESOLUTE EYES  */}
        {/* ============================================================= */}
        {frame >= 1268 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1270, 1360),
              transform: `scale(${push15})`,
              transformOrigin: "49% 18%",
            }}
          >
            <img
              src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
              alt="Night Witch Resolute Eyes Punch-in"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.08) brightness(0.93) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* DYNAMIC SWEEPING GERMAN SEARCHLIGHTS IN CLOUDS (505 - 920)    */}
        {/* ============================================================= */}
        {frame >= 505 && frame <= 920 && (
          <AbsoluteFill style={{ pointerEvents: "none", zIndex: 6 }}>
            {/* Beam 1: Sweeps from bottom left across the sky */}
            <div
              style={{
                position: "absolute",
                bottom: -200,
                left: 380,
                width: 140,
                height: 1600,
                background:
                  "linear-gradient(to top, rgba(142, 232, 255, 0.45) 0%, rgba(142, 232, 255, 0.15) 50%, rgba(0,0,0,0) 100%)",
                transformOrigin: "bottom center",
                transform: `rotate(${searchlightAngle1}deg)`,
                filter: "blur(14px)",
                mixBlendMode: "screen",
              }}
            />
            {/* Beam 2: Sweeps from bottom right */}
            <div
              style={{
                position: "absolute",
                bottom: -200,
                right: 420,
                width: 120,
                height: 1500,
                background:
                  "linear-gradient(to top, rgba(142, 232, 255, 0.40) 0%, rgba(142, 232, 255, 0.12) 50%, rgba(0,0,0,0) 100%)",
                transformOrigin: "bottom center",
                transform: `rotate(${searchlightAngle2}deg)`,
                filter: "blur(12px)",
                mixBlendMode: "screen",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* ENVIRONMENTAL COLOR GRADING & DYNAMIC LIVING LIGHTING         */}
        {/* ============================================================= */}
        {/* 1. Ambient Night Wash */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(145deg, rgba(16, 28, 48, 0.38) 0%, rgba(10, 16, 26, 0.18) 45%, rgba(20, 36, 56, 0.35) 100%)",
            mixBlendMode: "soft-light",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />

        {/* 2. Cold Snow Ground Bounce */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to top, rgba(135, 200, 240, 0.14) 0%, rgba(110, 175, 225, 0.05) 28%, rgba(0,0,0,0) 50%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* 3. Deep Shadow Anchor */}
        <AbsoluteFill
          style={{
            backgroundColor: "#0A0F18",
            opacity: 0.15,
            mixBlendMode: "multiply",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* 4. Moving Cloud Shadow Drift */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: cloudShadowX,
            width: 1400,
            height: 1500,
            background:
              "radial-gradient(ellipse at center, rgba(3, 6, 12, 0.25) 0%, rgba(0,0,0,0) 70%)",
            transform: "rotate(-15deg)",
            pointerEvents: "none",
            zIndex: 7,
          }}
        />

        {/* 5. Dynamic Warm Brazier / Lantern Glow */}
        {((frame >= 80 && frame <= 335) || (frame >= 915 && frame <= 1022)) && (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 27% 65%, rgba(255, 142, 35, ${
                flameFlicker * 0.85
              }) 0%, rgba(230, 90, 20, ${flameFlicker * 0.35}) 25%, rgba(0,0,0,0) 55%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 7,
            }}
          />
        )}

        {((frame >= 425 && frame <= 510) || (frame >= 625 && frame <= 725)) && (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 88%, rgba(255, 145, 35, ${
                flameFlicker * 0.65
              }) 0%, rgba(0,0,0,0) 45%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 7,
            }}
          />
        )}

        {frame >= 1135 && (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 78% 46%, rgba(255, 150, 40, ${
                flameFlicker * 0.95
              }) 0%, rgba(240, 100, 20, ${flameFlicker * 0.4}) 22%, rgba(0,0,0,0) 48%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 7,
            }}
          />
        )}

        {/* 6. Catastrophic Bomb Flash */}
        {blastFlash > 0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#FFF5EA",
              opacity: blastFlash,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}

        {/* 7. Blended Procedural Snow Canvas */}
        <canvas
          ref={snowCanvasRef}
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
            zIndex: 11,
          }}
        />

        {/* 8. High-Class Lens Vignette */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 55% 45%, rgba(0, 0, 0, 0) 32%, rgba(3, 5, 10, ${vignetteIntensity}) 72%, rgba(1, 2, 5, 0.98) 100%)`,
            pointerEvents: "none",
            zIndex: 12,
          }}
        />

        {/* 9. Cinematic Letterbox Border */}
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

        {/* 10. Archival Film Grain Burst & Vertical Scratches (Frame 423–436) */}
        {filmGrainBurst > 0 && (
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              zIndex: 15,
              mixBlendMode: "screen",
              opacity: filmGrainBurst,
              background: `repeating-linear-gradient(
                90deg,
                rgba(240, 220, 190, 0.22) 0px,
                rgba(240, 220, 190, 0.22) 2px,
                transparent 2px,
                transparent 7px
              )`,
              filter: "contrast(1.6) brightness(1.2)",
            }}
          />
        )}

        {/* 11. Optical Film Burn Amber Flash (Frame 424–430) */}
        {filmBurnOpacity > 0 && (
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              zIndex: 16,
              mixBlendMode: "color-dodge",
              backgroundColor: "#FFE5B4",
              opacity: filmBurnOpacity,
            }}
          />
        )}

        {/* ============================================================= */}
        {/* ARCHIVAL FORENSIC METADATA STAMP (LEMMiNO / FERN TYPOGRAPHY)  */}
        {/* Appears in Shot 01 establishing the battlefield coordinates   */}
        {/* ============================================================= */}
        {stampOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 48,
              left: 56,
              opacity: stampOpacity,
              fontFamily: "'Courier New', Courier, monospace",
              color: "#EDE8DE",
              letterSpacing: "0.14em",
              zIndex: 20,
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "inline-block",
                backgroundColor: "rgba(139, 37, 25, 0.85)",
                color: "#FFF",
                fontSize: 10,
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: 2,
                marginBottom: 6,
                letterSpacing: "0.18em",
              }}
            >
              ARCHIVAL FIELD LOG // SECTOR 1942
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FAF6EE" }}>
              EASTERN FRONT — DON RIVER BEND
            </div>
            <div style={{ fontSize: 11, color: "#8E9EAF", marginTop: 2 }}>
              14 NOVEMBER 1942 // 02:40 HOURS // -28°C
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* ============================================================= */}
      {/* SYNCHRONIZED MASTER AUDIO SUITE (BROADCAST CALIBRATED MIX)    */}
      {/* ============================================================= */}
      {/* 1. Master Cold-Case Voiceover (0 dB Reference) */}
      <Audio
        src={staticFile("night_witches/voiceover.wav")}
        volume={1.0}
        startFrom={0}
      />

      {/* 2. Dark Investigative Synth Drone Bed (-24 dB background texture) */}
      {droneVolume > 0 && (
        <Audio
          src={staticFile("night_witches/sfx_investigative_drone_bed.wav")}
          volume={droneVolume}
          startFrom={0}
        />
      )}

      {/* 3. Ambient Steppe Wind (Ducks to silence at 330-460) */}
      {windVolume > 0 && (
        <Audio
          src={staticFile("night_witches/sfx_winter_steppe_wind_howl.mp3")}
          volume={windVolume}
          startFrom={0}
        />
      )}

      {/* 4. Physical Trench Foley: Brazier Embers Crackle */}
      {embersVolume > 0 && (
        <Audio
          src={staticFile("night_witches/sfx_trench_brazier_embers.mp3")}
          volume={embersVolume}
          startFrom={20}
        />
      )}

      {/* 5. Physical Trench Foley: Frozen Mud Crunch (Shifting weight) */}
      {frame >= 145 && frame <= 195 && (
        <Audio
          src={staticFile("night_witches/sfx_boots_frozen_mud_crunch.mp3")}
          volume={0.06}
          startFrom={10}
        />
      )}

      {/* 6. Vintage Film Shutter Snap & Gate Whoosh (At Frame 425 on "Then he hears it") */}
      {frame >= 424 && frame <= 465 && (
        <Audio
          src={staticFile("night_witches/sfx_film_shutter_transition.wav")}
          volume={0.42}
          startFrom={0}
        />
      )}

      {/* 7. Po-2 Eerie Broom Wind Glide Whistle (Creeps in gently) */}
      {whistleVolume > 0 && (
        <Audio
          src={staticFile("night_witches/sfx_po2_wind_glide_whistle.mp3")}
          volume={whistleVolume}
          startFrom={30}
        />
      )}

      {/* 7. FAB-50 Bomb Detonation Impact (Calibrated, no ear pain) */}
      {frame >= 1022 && frame <= 1120 && (
        <Audio
          src={staticFile("night_witches/sfx_fab50_bomb_detonation_heavy.mp3")}
          volume={0.38}
        />
      )}

      {/* 8. Sub-Bass Concussion 35Hz Drop (Chest rumble thump) */}
      {frame >= 1022 && frame <= 1090 && (
        <Audio
          src={staticFile("night_witches/sfx_sub_bass_concussion_drop.wav")}
          volume={0.28}
        />
      )}

      {/* 9. Psychological Post-Blast Tinnitus (Gentle shimmer, non-piercing) */}
      {tinnitusVolume > 0 && (
        <Audio
          src={staticFile("night_witches/sfx_post_blast_tinnitus.wav")}
          volume={tinnitusVolume}
          startFrom={0}
        />
      )}

      {/* 10. German Panzer Diesel Engine & Steel Tracks Foley */}
      {frame >= 1095 && frame <= 1195 && (
        <Audio
          src={staticFile("night_witches/sfx_panzer_diesel_tracks.wav")}
          volume={0.08}
          startFrom={0}
        />
      )}
    </AbsoluteFill>
  );
};
