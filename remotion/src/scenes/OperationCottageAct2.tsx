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
// ALEUTIAN VOLUMETRIC FOG & ATMOSPHERE ENGINE
// =========================================================================
interface FogParticle {
  id: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number;
  opacity: number;
}

const SEED_FOG: FogParticle[] = Array.from({ length: 40 }, (_, i) => {
  const seed = (i * 8191 + 524287) % 100000;
  return {
    id: i,
    x: (seed * 19.2) % 2200 - 100,
    y: ((seed * 7.1) % 1150) - 30,
    radiusX: 190 + (seed % 220),
    radiusY: 70 + (seed % 90),
    speedX: 0.7 + ((seed % 14) / 10),
    opacity: 0.06 + ((seed % 10) / 100),
  };
});

export const OperationCottageAct2: React.FC = () => {
  const frame = useCurrentFrame();
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);

  // Time in seconds offset from 36.76s
  const currentSec = 36.76 + frame / 30;

  // Soft Dissolve Helper
  function softDissolve(f: number, start: number, end: number, dissolveFrames = 6) {
    const fadeIn = interpolate(f, [start, start + dissolveFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    const fadeOut = interpolate(f, [end - dissolveFrames, end], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    return Math.min(fadeIn, fadeOut);
  }

  // -----------------------------------------------------------------------
  // SHOT FRAME BOUNDARIES (30 FPS, Aligned with Master Timestamps)
  // -----------------------------------------------------------------------
  // Chapter 2: How Japan Ended Up in Alaska (36.76s to 86.80s = 0 to 1,501 frames)
  // Shot 15 (0 to 127 | 36.76s to 41.00s): P14 (Naval Staff Room table)
  // Shot 16 (127 to 350 | 41.00s to 48.40s): P14 / M1 Pacific Chart Push
  // Shot 17 (350 to 650 | 48.40s to 58.44s): P15 (Aleutian Chain Landscape)
  // Shot 18 (650 to 772 | 58.44s to 62.50s): P15 (Wind-bent slopes)
  // Shot 19 (772 to 892 | 62.50s to 66.50s): P16 (Attu Landing Party)
  // Shot 20 (892 to 1017 | 66.50s to 70.66s): P17 (Kiska Harbor Ships in Fog)
  // Shot 21 (1017 to 1132 | 70.66s to 74.50s): P18 (War of 1812 Sailing Ship)
  // Shot 22 (1132 to 1245 | 74.50s to 78.28s): P19 (1942 Japanese Sentry on Crest)
  // Shot 23 (1245 to 1501 | 78.28s to 86.80s): P15 (Strategic Overview)
  //
  // Chapter 3: The Weather Problem (86.80s to 104.02s = 1,501 to 2,018 frames)
  // Shot 24 (1501 to 1620 | 86.80s to 90.76s): P20 (Storm-Lashed Coast, exploding surf)
  // Shot 25 (1620 to 1731 | 90.76s to 94.48s): P21 (Bay Drowned in Milk Fog)
  // Shot 26 (1731 to 1890 | 94.48s to 99.76s): P22 (Advancing Black Storm Wall)
  // Shot 27 (1890 to 2018 | 99.76s to 104.02s): P21 (Pushing Into Dense Milk Fog)
  //
  // Chapter 4: Why Everyone Expected a Bloodbath (104.02s to 143.38s = 2,018 to 3,198 frames)
  // Shot 28 (2018 to 2170 | 104.02s to 109.10s): P23 (Attu Snow-Streaked Valley)
  // Shot 29 (2170 to 2256 | 109.10s to 111.98s): P24 (Unopposed Attu Beach Landing)
  // Shot 30 (2256 to 2411 | 111.98s to 117.14s): P25 (Attu Mountain Ridge Muzzle Flashes)
  // Shot 31 (2411 to 2480 | 117.14s to 119.42s): P26 (Soldiers Hunched in Muddy Foxhole)
  // Shot 32 (2480 to 2830 | 119.42s to 131.10s): P27 (Stretcher-Bearers Descending in Fog)
  // Shot 33 (2830 to 2895 | 131.10s to 133.26s): P28 (Kiska Bruised Storm Clouds)
  // Shot 34 (2895 to 3128 | 133.26s to 141.02s): P29 (Aerial Recon Photo on Table)
  // Shot 35 (3128 to 3198 | 141.02s to 143.38s): P30 (Command Tent Planning Table)

  // -----------------------------------------------------------------------
  // LIVING LIGHTING & ENVIRONMENTAL PHYSICS
  // -----------------------------------------------------------------------
  // War room lamp swing on P14
  const lampSwing = frame < 350 ? Math.sin(frame * 0.05) * 4 : 0;
  const lampGlow = frame < 350 ? 0.45 + Math.sin(frame * 0.15) * 0.08 : 0;

  // Attu ridge muzzle flash flicker on P25 (Frames 2256 to 2411)
  const ridgeFlash =
    frame >= 2256 && frame < 2411
      ? 0.35 + Math.sin(frame * 1.6) * 0.3 + (frame % 4 === 0 ? 0.45 : 0)
      : 0;

  // Foxhole cold breath condensation on P26 (Frames 2411 to 2480)
  const breathMist =
    frame >= 2411 && frame < 2480 ? 0.25 + Math.sin((frame - 2411) * 0.2) * 0.15 : 0;

  // Somber desaturation drain on P27 (Frames 2480 to 2830)
  const graveSaturation =
    frame >= 2480 && frame <= 2830
      ? interpolate(frame, [2480, 2750], [0.95, 0.35], { extrapolateRight: "clamp" })
      : 0.90;

  // Command tent warm amber lantern on P30 (Frames 3128 to 3198)
  const tentGlow =
    frame >= 3128 ? 0.55 + Math.sin(frame * 0.12) * 0.1 : 0;

  // -----------------------------------------------------------------------
  // PROCEDURAL CANVAS VOLUMETRIC FOG
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1920, 1080);

    for (const p of SEED_FOG) {
      const currentX = (p.x + frame * p.speedX * 1.5) % 2160 - 100;
      const currentY = p.y + Math.sin(frame * 0.03 + p.id) * 12;

      ctx.save();
      ctx.translate(currentX, currentY);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radiusX);
      grad.addColorStop(0, `rgba(210, 225, 238, ${p.opacity})`);
      grad.addColorStop(0.7, `rgba(180, 200, 218, ${p.opacity * 0.4})`);
      grad.addColorStop(1, "rgba(180, 200, 218, 0)");

      ctx.fillStyle = grad;
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
      {/* ============================================================= */}
      {/* SHOT 15 (0–350): P14 NAVAL STAFF ROOM CHART TABLE             */}
      {/* ============================================================= */}
      {frame < 350 && (
        <AbsoluteFill
          style={{
            opacity: frame >= 344 ? softDissolve(frame, 0, 350) : 1,
            transform: `scale(${interpolate(frame, [0, 350], [1.0, 1.05], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P14.jpg")}
            alt="Naval Staff Room Chart Table"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.10) brightness(0.94) saturate(0.90)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 17 & 18 (346–772): P15 BARREN ALEUTIAN TUNDRA SLOPES     */}
      {/* ============================================================= */}
      {frame >= 346 && frame < 772 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 350, 772),
            transform: `scale(${interpolate(frame, [350, 772], [1.02, 1.05], { extrapolateRight: "clamp" })}) translateX(${interpolate(frame, [350, 772], [-10, 10], { extrapolateRight: "clamp" })}px)`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P15.jpg")}
            alt="Barren Windswept Aleutian Tundra"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 19 (768–892): P16 JAPANESE LANDING PARTY AT ATTU         */}
      {/* ============================================================= */}
      {frame >= 768 && frame < 892 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 772, 892),
            transform: `scale(${interpolate(frame, [772, 892], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P16.jpg")}
            alt="Japanese Landing Party at Attu"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.92) saturate(0.88)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 20 (888–1017): P17 JAPANESE WARSHIPS IN KISKA FOG        */}
      {/* ============================================================= */}
      {frame >= 888 && frame < 1017 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 892, 1017),
            transform: `scale(${interpolate(frame, [892, 1017], [1.0, 1.045], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P17.jpg")}
            alt="Japanese Ships Anchored in Kiska Fog"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.90) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 21 (1013–1132): P18 WAR OF 1812 HISTORICAL CONTRAST     */}
      {/* ============================================================= */}
      {frame >= 1013 && frame < 1132 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1017, 1132),
            transform: `scale(${interpolate(frame, [1017, 1132], [1.0, 1.035], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P18.jpg")}
            alt="War of 1812 British Landing"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.05) brightness(0.96) sepia(0.25)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 22 (1128–1245): P19 1942 JAPANESE SENTRY ON CREST       */}
      {/* ============================================================= */}
      {frame >= 1128 && frame < 1245 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1132, 1245),
            transform: `scale(${interpolate(frame, [1132, 1245], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 45%",
          }}
        >
          <img
            src={staticFile("cottage/P19.jpg")}
            alt="Japanese Sentry on Aleutian Ridge"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.92) saturate(0.88)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 23 (1241–1501): P15 STRATEGIC OVERVIEW                   */}
      {/* ============================================================= */}
      {frame >= 1241 && frame < 1501 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1245, 1501),
            transform: `scale(${interpolate(frame, [1245, 1501], [1.0, 1.05], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P15.jpg")}
            alt="Aleutian Strategic Overview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 24 (1497–1620): P20 STORM-LASHED COAST & SURF EXPLOSION  */}
      {/* ============================================================= */}
      {frame >= 1497 && frame < 1620 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1501, 1620),
            transform: `scale(${interpolate(frame, [1501, 1620], [1.0, 1.05], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 60%",
          }}
        >
          <img
            src={staticFile("cottage/P20.jpg")}
            alt="Storm-Lashed Aleutian Coast"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.10) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 25 (1616–1731): P21 BAY DROWNED IN MILK FOG             */}
      {/* ============================================================= */}
      {frame >= 1616 && frame < 1731 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1620, 1731),
            transform: `scale(${interpolate(frame, [1620, 1731], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P21.jpg")}
            alt="Aleutian Bay Drowned in Milk Fog"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.06) brightness(0.90) saturate(0.80)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 26 (1727–1890): P22 ADVANCING BLACK STORM WALL           */}
      {/* ============================================================= */}
      {frame >= 1727 && frame < 1890 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1731, 1890),
            transform: `scale(${interpolate(frame, [1731, 1890], [1.0, 1.06], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 45%",
          }}
        >
          <img
            src={staticFile("cottage/P22.jpg")}
            alt="Advancing Black Storm Wall Over Sea"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.12) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 27 (1886–2018): P21 PUSHING STRAIGHT INTO DENSE FOG      */}
      {/* ============================================================= */}
      {frame >= 1886 && frame < 2018 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 1890, 2018),
            transform: `scale(${interpolate(frame, [1890, 2018], [1.02, 1.08], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P21.jpg")}
            alt="Pushing Into Dense Fog"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.05) brightness(0.94) saturate(0.75)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 28 (2014–2170): P23 ATTU SNOW-STREAKED VALLEY            */}
      {/* ============================================================= */}
      {frame >= 2014 && frame < 2170 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2018, 2170),
            transform: `scale(${interpolate(frame, [2018, 2170], [1.0, 1.045], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P23.jpg")}
            alt="American Troops Climbing Snow-Streaked Attu Valley"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 29 (2166–2256): P24 UNOPPOSED ATTU BEACH LANDING         */}
      {/* ============================================================= */}
      {frame >= 2166 && frame < 2256 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2170, 2256),
            transform: `scale(${interpolate(frame, [2170, 2256], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P24.jpg")}
            alt="Unopposed Attu Beach Landing"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 30 (2252–2411): P25 ATTU MOUNTAIN RIDGE MUZZLE FLASHES   */}
      {/* ============================================================= */}
      {frame >= 2252 && frame < 2411 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2256, 2411),
            transform: `scale(${interpolate(frame, [2256, 2411], [1.0, 1.05], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 40%",
          }}
        >
          <img
            src={staticFile("cottage/P25.jpg")}
            alt="Attu Mountain Ridge Muzzle Flashes in Fog"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.12) brightness(0.94) saturate(0.95)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 31 (2407–2480): P26 SOLDIERS HUNCHED IN MUDDY FOXHOLE   */}
      {/* ============================================================= */}
      {frame >= 2407 && frame < 2480 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2411, 2480),
            transform: `scale(${interpolate(frame, [2411, 2480], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P26.jpg")}
            alt="Soldiers Hunched in Muddy Foxhole at Dusk"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) brightness(0.90) saturate(0.80)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 32 (2476–2830): P27 STRETCHER-BEARERS IN FOG (DESATURATE)*/}
      {/* ============================================================= */}
      {frame >= 2476 && frame < 2830 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2480, 2830),
            transform: `scale(${interpolate(frame, [2480, 2830], [1.0, 1.05], { extrapolateRight: "clamp" })})`,
            transformOrigin: "40% 55%",
          }}
        >
          <img
            src={staticFile("cottage/P27.jpg")}
            alt="Stretcher-Bearers Descending Through Fog"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `contrast(1.06) brightness(0.88) saturate(${graveSaturation})`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 33 (2826–2895): P28 KISKA UNDER BRUISED STORM CLOUDS    */}
      {/* ============================================================= */}
      {frame >= 2826 && frame < 2895 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2830, 2895),
            transform: `scale(${interpolate(frame, [2830, 2895], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P28.jpg")}
            alt="Kiska Under Bruised Storm Clouds"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.10) brightness(0.92) saturate(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 34 (2891–3128): P29 AERIAL RECON PHOTO ON TABLE          */}
      {/* ============================================================= */}
      {frame >= 2891 && frame < 3128 && (
        <AbsoluteFill
          style={{
            opacity: softDissolve(frame, 2895, 3128),
            transform: `scale(${interpolate(frame, [2895, 3128], [1.0, 1.05], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P29.jpg")}
            alt="Aerial Reconnaissance Photo on Table"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.15) brightness(0.95) grayscale(0.85)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* SHOT 35 (3124–3198): P30 COMMAND TENT PLANNING TABLE          */}
      {/* ============================================================= */}
      {frame >= 3124 && (
        <AbsoluteFill
          style={{
            opacity: frame >= 3192 ? softDissolve(frame, 3128, 3198) : 1,
            transform: `scale(${interpolate(frame, [3128, 3198], [1.0, 1.04], { extrapolateRight: "clamp" })})`,
            transformOrigin: "50% 50%",
          }}
        >
          <img
            src={staticFile("cottage/P30.jpg")}
            alt="Command Tent Planning Table With Kiska Model"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.10) brightness(0.94) saturate(0.92)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* ============================================================= */}
      {/* LIVING LIGHTING & ENVIRONMENTAL ATMOSPHERE                    */}
      {/* ============================================================= */}
      {/* 1. War Room Hanging Lamp Glow (P14) */}
      {lampGlow > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 35%, rgba(255, 175, 60, ${
              lampGlow * 0.7
            }) 0%, rgba(220, 110, 30, ${lampGlow * 0.25}) 30%, rgba(0,0,0,0) 60%)`,
            transform: `rotate(${lampSwing}deg)`,
            transformOrigin: "50% 0%",
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}

      {/* 2. Attu Ridge Muzzle Flash Glow (P25) */}
      {ridgeFlash > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 45% 42%, rgba(255, 130, 30, ${
              ridgeFlash * 0.8
            }) 0%, rgba(220, 60, 15, ${ridgeFlash * 0.3}) 25%, rgba(0,0,0,0) 55%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}

      {/* 3. Command Tent Warm Lantern Glow (P30) */}
      {tentGlow > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 52% 48%, rgba(255, 160, 50, ${
              tentGlow * 0.75
            }) 0%, rgba(220, 100, 25, ${tentGlow * 0.25}) 30%, rgba(0,0,0,0) 60%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}

      {/* 4. Procedural Volumetric Fog Canvas */}
      <canvas
        ref={fogCanvasRef}
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: 0.75,
          filter: "blur(0.6px)",
          zIndex: 15,
        }}
      />

      {/* 5. Cold Aleutian Ground Tint & Ambient Wash */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(145deg, rgba(15, 25, 38, 0.30) 0%, rgba(10, 16, 26, 0.12) 50%, rgba(18, 30, 45, 0.28) 100%)",
          mixBlendMode: "soft-light",
          pointerEvents: "none",
          zIndex: 16,
        }}
      />

      {/* 6. High-Class Lens Falloff & Archival Corner Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0) 35%, rgba(3, 5, 8, 0.70) 75%, rgba(1, 2, 4, 0.96) 100%)",
          pointerEvents: "none",
          zIndex: 17,
        }}
      />

      {/* 7. Letterbox Inset Border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "inset 0 0 70px rgba(0, 0, 0, 0.8)",
          pointerEvents: "none",
          zIndex: 18,
        }}
      />

      {/* ============================================================= */}
      {/* SYNCHRONIZED MASTER AUDIO SUITE                               */}
      {/* ============================================================= */}
      {/* 1. Master Cold-Case Voiceover (starting at 36.76s = frame 1,103) */}
      <Audio
        src={staticFile("cottage/voiceover.wav")}
        volume={1.0}
        startFrom={1103}
      />

      {/* 2. Dark Investigative Synth Drone Bed */}
      <Audio
        src={staticFile("cottage/sfx/sfx_investigative_drone_bed.wav")}
        volume={0.16}
        startFrom={0}
      />

      {/* 3. Aleutian Wind Ambience */}
      <Audio
        src={staticFile("cottage/sfx/sfx_winter_steppe_wind_howl.mp3")}
        volume={0.08}
        startFrom={0}
      />
    </AbsoluteFill>
  );
};
