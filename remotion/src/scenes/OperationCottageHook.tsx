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
// ALEUTIAN VOLUMETRIC FOG & MIST PARTICLES (60 FPS DETERMINISTIC CANVAS)
// =========================================================================
interface MistParticle {
  id: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
}

const SEED_MIST: MistParticle[] = Array.from({ length: 45 }, (_, i) => {
  const seed = (i * 9137 + 45211) % 100000;
  return {
    id: i,
    x: (seed * 19.2) % 2200 - 140,
    y: ((seed * 7.3) % 1180) - 50,
    radiusX: 180 + (seed % 240),
    radiusY: 60 + (seed % 100),
    speedX: 0.8 + ((seed % 15) / 10),
    speedY: (seed % 5 - 2) * 0.15,
    opacity: 0.05 + ((seed % 12) / 100),
    rotation: ((seed % 20) - 10) * (Math.PI / 180),
  };
});

export const OperationCottageHook: React.FC = () => {
  const frame = useCurrentFrame();
  const mistCanvasRef = useRef<HTMLCanvasElement>(null);

  // -----------------------------------------------------------------------
  // DETERMINISTIC FILM GATE JITTER & SUBTLE GRAIN
  // -----------------------------------------------------------------------
  const filmJitterY = Math.sin(frame * 4.3) * 0.35;
  const filmJitterX = Math.cos(frame * 3.7) * 0.35;

  // -----------------------------------------------------------------------
  // DISSOLVE & TRANSITION FUNCTIONS
  // -----------------------------------------------------------------------
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
  // CAMERA DRIFTS & PUSHES PER SHOT (STRICT 3S CEILING & SCALE ACCURACY)
  // -----------------------------------------------------------------------
  // Shot 1 (0–80): Crane-down pull-out
  const scale01 = interpolate(frame, [0, 80], [1.06, 1.0], { extrapolateRight: "clamp" });
  const transY01 = interpolate(frame, [0, 80], [-10, 0], { extrapolateRight: "clamp" });

  // Shot 2 (80–147): Drift left to right + slight tilt up
  const scale02 = interpolate(frame, [80, 147], [1.02, 1.05], { extrapolateRight: "clamp" });
  const transX02 = interpolate(frame, [80, 147], [-15, 12], { extrapolateRight: "clamp" });
  const transY02 = interpolate(frame, [80, 147], [6, -8], { extrapolateRight: "clamp" });

  // Shot 3 (147–194): Aggressive 8% push into bombing cone
  const scale03 = interpolate(frame, [147, 194], [1.0, 1.08], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // Shot 4 (194–312): Pull-out showing tiny island against vast fleet
  const scale04 = interpolate(frame, [194, 304], [1.07, 1.0], { extrapolateRight: "clamp" });

  // Shot 5 (312–384): Quick push out through ramp
  const scale05 = interpolate(frame, [312, 384], [1.0, 1.05], { extrapolateRight: "clamp" });

  // Shot 6 (384–450): Slow drift along empty beach
  const transX06 = interpolate(frame, [384, 450], [-12, 12], { extrapolateRight: "clamp" });
  const scale06 = interpolate(frame, [384, 450], [1.02, 1.035], { extrapolateRight: "clamp" });

  // Shot 7 (450–579): Slow push on swinging lantern
  const scale07 = interpolate(frame, [450, 579], [1.0, 1.045], { extrapolateRight: "clamp" });

  // Shot 8 (579–645): Pull-out from plane wing to empty harbor
  const scale08 = interpolate(frame, [579, 645], [1.06, 1.0], { extrapolateRight: "clamp" });

  // Shot 9 (645–816): Slow somber push to nearest rifle/helmet
  const scale09 = interpolate(frame, [645, 816], [1.0, 1.05], { extrapolateRight: "clamp" });

  // Shot 10 (816–867): Quick push in to horned mine
  const scale10 = interpolate(frame, [816, 867], [1.0, 1.05], { extrapolateRight: "clamp" });

  // Shot 11 (867–901): Macro push to tripwire
  const scale11 = interpolate(frame, [867, 901], [1.0, 1.045], { extrapolateRight: "clamp" });

  // Shot 12 (901–934): Tilt down to truck wreck
  const transY12 = interpolate(frame, [901, 934], [-16, 6], { extrapolateRight: "clamp" });
  const scale12 = interpolate(frame, [901, 934], [1.02, 1.04], { extrapolateRight: "clamp" });

  // Shot 13 (934–990): Push into foggy shootout
  const scale13 = interpolate(frame, [934, 980], [1.0, 1.04], { extrapolateRight: "clamp" });

  // Shot 14 (990–1110): Slow 3% push on Title Card
  const scale14 = interpolate(frame, [990, 1110], [1.0, 1.03], { extrapolateRight: "clamp" });

  // -----------------------------------------------------------------------
  // LIVING LIGHTING & ENVIRONMENTAL ATMOSPHERE
  // -----------------------------------------------------------------------
  // Flash Cut on Shot 3 Bombardment exit (Frames 191–194: 3-4 white frames)
  const flashCutOpacity =
    frame >= 191 && frame <= 194
      ? interpolate(frame, [191, 192, 194], [0.85, 1.0, 0.0])
      : 0;

  // Bombardment explosion warm flicker (Frames 147–191)
  const bombFlicker =
    frame >= 147 && frame < 191
      ? 0.35 + Math.sin(frame * 1.8) * 0.2 + (frame % 3 === 0 ? 0.35 : 0)
      : 0;

  // Barracks lantern breathing & swing (Frames 450–579)
  const lanternSwingAngle =
    frame >= 450 && frame <= 579
      ? Math.sin((frame - 450) * 0.08) * Math.exp(-(frame - 450) * 0.012) * 5
      : 0;
  const lanternGlow =
    frame >= 450 && frame <= 579
      ? 0.45 + Math.sin(frame * 0.25) * 0.12
      : 0;

  // Booby trap wire glint (Frames 882–892)
  const wireGlintOpacity =
    frame >= 882 && frame <= 892
      ? interpolate(frame, [882, 887, 892], [0, 0.85, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Black Beat intervals (silence & black frame holds)
  const isBlackBeat1 = frame >= 304 && frame < 312; // Out of Shot 4 (8 frames)
  const isBlackBeat2 = frame >= 980 && frame < 990; // Out of Shot 13 (10 frames)

  // Title Card Fog Wipe (Frames 990–1040)
  const fogWipeSpread =
    frame >= 990 ? interpolate(frame, [990, 1050], [0, 48], { extrapolateRight: "clamp" }) : 0;

  // -----------------------------------------------------------------------
  // PROCEDURAL CANVAS VOLUMETRIC MIST ENGINE
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = mistCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1920, 1080);

    for (const p of SEED_MIST) {
      const currentX = (p.x + frame * p.speedX * 1.6) % 2160 - 120;
      const currentY = p.y + Math.sin(frame * 0.04 + p.id) * 15;

      ctx.save();
      ctx.translate(currentX, currentY);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radiusX);
      grad.addColorStop(0, `rgba(205, 222, 235, ${p.opacity})`);
      grad.addColorStop(0.6, `rgba(185, 205, 220, ${p.opacity * 0.5})`);
      grad.addColorStop(1, "rgba(180, 200, 215, 0)");

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }, [frame]);

  // Audio mix volumes
  const droneVolume =
    isBlackBeat1 || isBlackBeat2
      ? 0.0
      : frame >= 147 && frame <= 194
      ? 0.28 // Peak during bombardment
      : frame >= 384 && frame <= 450
      ? 0.06 // Near silent on empty beach
      : 0.18;

  const windVolume =
    isBlackBeat1 || isBlackBeat2
      ? 0.0
      : frame >= 384 && frame <= 450
      ? 0.12 // Wind howls over empty beach
      : 0.07;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05080C",
        overflow: "hidden",
      }}
    >
      {/* SHAKE CONTAINER FOR OPTICAL FILM GATE JITTER */}
      <AbsoluteFill
        style={{
          transform: `translate(${filmJitterX}px, ${filmJitterY}px)`,
        }}
      >
        {/* ============================================================= */}
        {/* SHOT 01 (0–80): 34,000 SOLDIERS (PLATE 1)                     */}
        {/* ============================================================= */}
        {frame < 80 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale01}) translateY(${transY01}px)`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P01.jpg")}
              alt="Troopship Deck Packed With Soldiers"
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
        {/* SHOT 02 (80–147): NEARLY 100 WARSHIPS (PLATE 2)              */}
        {/* ============================================================= */}
        {frame >= 80 && frame < 147 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale02}) translate(${transX02}px, ${transY02}px)`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P02.jpg")}
              alt="Fleet of 100 Warships in Bering Mist"
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
        {/* SHOT 03 (147–194): WEEKS OF BOMBING (PLATE 3)                 */}
        {/* ============================================================= */}
        {frame >= 147 && frame < 194 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale03})`,
              transformOrigin: "50% 45%",
            }}
          >
            <img
              src={staticFile("cottage/P03.jpg")}
              alt="Volcanic Peak Bombardment"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.12) brightness(0.96) saturate(1.05)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 04 (194–312): KISKA INVASION FROM ALTITUDE (PLATE 4)     */}
        {/* ============================================================= */}
        {frame >= 194 && frame < 304 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale04})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P04.jpg")}
              alt="High-Altitude View of Kiska Island Invasion"
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
        {/* SHOT 05 (312–384): LANDING CRAFT RAMP DROPS (PLATE 5)         */}
        {/* ============================================================= */}
        {frame >= 312 && frame < 384 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale05})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P05.jpg")}
              alt="Landing Craft Ramp Drops into Surf"
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
        {/* SHOT 06 (384–450): THE EMPTY BEACH (PLATE 6)                  */}
        {/* ============================================================= */}
        {frame >= 384 && frame < 450 && (
          <AbsoluteFill
            style={{
              opacity: frame >= 444 ? softDissolve(frame, 384, 450) : 1,
              transform: `scale(${scale06}) translateX(${transX06}px)`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P06.jpg")}
              alt="Kiska Empty Volcanic Beach"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.06) brightness(0.90) saturate(0.85)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 07 (450–579): ABANDONED BARRACKS & LANTERN (PLATE 7)     */}
        {/* ============================================================= */}
        {frame >= 446 && frame < 579 && (
          <AbsoluteFill
            style={{
              opacity: softDissolve(frame, 450, 579),
              transform: `scale(${scale07})`,
              transformOrigin: "52% 40%",
            }}
          >
            <img
              src={staticFile("cottage/P07.jpg")}
              alt="Abandoned Barracks Table and Swinging Lantern"
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
        {/* SHOT 08 (579–645): PATROL PLANE OVER EMPTY HARBOR (PLATE 8)   */}
        {/* ============================================================= */}
        {frame >= 575 && frame < 645 && (
          <AbsoluteFill
            style={{
              opacity: softDissolve(frame, 579, 645),
              transform: `scale(${scale08})`,
              transformOrigin: "48% 46%",
            }}
          >
            <img
              src={staticFile("cottage/P08.jpg")}
              alt="Reconnaissance Patrol Plane Over Empty Harbor"
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
        {/* SHOT 09 (645–816): BATTLEFIELD GRAVES / RIFLES IN FOG (PL 9)  */}
        {/* ============================================================= */}
        {frame >= 641 && frame < 816 && (
          <AbsoluteFill
            style={{
              opacity: softDissolve(frame, 645, 816),
              transform: `scale(${scale09})`,
              transformOrigin: "35% 55%",
            }}
          >
            <img
              src={staticFile("cottage/P09.jpg")}
              alt="Row of Helmets on Upright Rifles in Volcanic Soil"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.06) brightness(0.88) saturate(0.75)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 10 (816–867): HORNED NAVAL SEA MINE (PLATE 10)           */}
        {/* ============================================================= */}
        {frame >= 816 && frame < 867 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale10})`,
              transformOrigin: "50% 60%",
            }}
          >
            <img
              src={staticFile("cottage/P10.jpg")}
              alt="Horned Sea Mine in Black Swell"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.10) brightness(0.92) saturate(0.95)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 11 (867–901): BOOBY TRAP TRIPWIRE MACRO (PLATE 11)       */}
        {/* ============================================================= */}
        {frame >= 867 && frame < 901 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale11})`,
              transformOrigin: "55% 52%",
            }}
          >
            <img
              src={staticFile("cottage/P11.jpg")}
              alt="Taut Booby Trap Tripwire Macro"
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
        {/* SHOT 12 (901–934): WRECKED MILITARY TRUCK IN RAIN (PLATE 12)  */}
        {/* ============================================================= */}
        {frame >= 901 && frame < 934 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale12}) translateY(${transY12}px)`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P12.jpg")}
              alt="Tipped Military Truck on Muddy Slope"
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
        {/* SHOT 13 (934–990): FRIENDLY FIRE IN THE FOG (PLATE 13)        */}
        {/* ============================================================= */}
        {frame >= 934 && frame < 980 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale13})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P13.jpg")}
              alt="Friendly Fire Shootout in Thick Fog"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.12) brightness(0.92) saturate(0.90)",
              }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* SHOT 14 (990–1110): EMPTY BEACH COLD OPEN FINALE (P06 REUSE)  */}
        {/* ============================================================= */}
        {frame >= 990 && (
          <AbsoluteFill
            style={{
              transform: `scale(${scale14})`,
              transformOrigin: "50% 50%",
            }}
          >
            <img
              src={staticFile("cottage/P06.jpg")}
              alt="Operation Cottage Hook Finale"
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
        {/* LIGHTING & ENVIRONMENTAL OVERLAYS                             */}
        {/* ============================================================= */}
        {/* 1. Bombardment Warm Muzzle & Blast Glow */}
        {bombFlicker > 0 && (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 60%, rgba(255, 120, 25, ${
                bombFlicker * 0.7
              }) 0%, rgba(220, 60, 15, ${bombFlicker * 0.3}) 35%, rgba(0,0,0,0) 65%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}

        {/* 2. Flash Cut Whiteout (Frame 191–194) */}
        {flashCutOpacity > 0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#FFF8F0",
              opacity: flashCutOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
        )}

        {/* 3. Black Beat Hold (304–312 and 980–990) */}
        {(isBlackBeat1 || isBlackBeat2) && (
          <AbsoluteFill
            style={{
              backgroundColor: "#000000",
              zIndex: 40,
            }}
          />
        )}

        {/* 4. Barracks Hanging Lantern Warm Glow */}
        {lanternGlow > 0 && (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 48% 38%, rgba(255, 165, 55, ${
                lanternGlow * 0.8
              }) 0%, rgba(220, 110, 30, ${lanternGlow * 0.3}) 28%, rgba(0,0,0,0) 58%)`,
              transform: `rotate(${lanternSwingAngle}deg)`,
              transformOrigin: "48% 10%",
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}

        {/* 5. Tripwire Glint Highlight */}
        {wireGlintOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              top: "48%",
              left: "52%",
              width: 140,
              height: 2,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)",
              opacity: wireGlintOpacity,
              boxShadow: "0 0 12px 3px rgba(255, 255, 255, 0.8)",
              transform: "rotate(-18deg)",
              pointerEvents: "none",
              zIndex: 12,
            }}
          />
        )}

        {/* 6. Title Card Side Fog Wipes */}
        {fogWipeSpread > 0 && (
          <>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${fogWipeSpread}%`,
                background:
                  "linear-gradient(to right, rgba(12, 18, 26, 0.95) 0%, rgba(12, 18, 26, 0.6) 70%, rgba(12, 18, 26, 0) 100%)",
                pointerEvents: "none",
                zIndex: 18,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: `${fogWipeSpread}%`,
                background:
                  "linear-gradient(to left, rgba(12, 18, 26, 0.95) 0%, rgba(12, 18, 26, 0.6) 70%, rgba(12, 18, 26, 0) 100%)",
                pointerEvents: "none",
                zIndex: 18,
              }}
            />
          </>
        )}

        {/* 7. Procedural Volumetric Fog Canvas */}
        <canvas
          ref={mistCanvasRef}
          width={1920}
          height={1080}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: 0.78,
            filter: "blur(0.6px)",
            zIndex: 15,
          }}
        />

        {/* 8. Cold Aleutian Ground Tint & Ambient Wash */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(145deg, rgba(15, 25, 38, 0.32) 0%, rgba(10, 16, 26, 0.15) 50%, rgba(18, 30, 45, 0.30) 100%)",
            mixBlendMode: "soft-light",
            pointerEvents: "none",
            zIndex: 16,
          }}
        />

        {/* 9. High-Class Lens Falloff & Archival Corner Vignette */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0) 34%, rgba(3, 5, 8, 0.72) 74%, rgba(1, 2, 4, 0.96) 100%)",
            pointerEvents: "none",
            zIndex: 17,
          }}
        />

        {/* 10. Frame Letterbox Outer Border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "inset 0 0 70px rgba(0, 0, 0, 0.8)",
            pointerEvents: "none",
            zIndex: 19,
          }}
        />

      </AbsoluteFill>

      {/* ============================================================= */}
      {/* SYNCHRONIZED MASTER AUDIO SUITE                               */}
      {/* ============================================================= */}
      {/* 1. Master Cold-Case Voiceover (Charon Broadcast Reference) */}
      <Audio
        src={staticFile("cottage/voiceover.wav")}
        volume={1.0}
        startFrom={0}
      />

      {/* 2. Dark Investigative Synth Drone Bed */}
      {droneVolume > 0 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_investigative_drone_bed.wav")}
          volume={droneVolume}
          startFrom={0}
        />
      )}

      {/* 3. Aleutian Wind Ambience */}
      {windVolume > 0 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_winter_steppe_wind_howl.mp3")}
          volume={windVolume}
          startFrom={0}
        />
      )}

      {/* 4. Sub-Bass Concussion Thuds on Stamped Text Hits */}
      {/* Shot 1 hit */}
      {frame >= 25 && frame <= 28 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_sub_bass_concussion_drop.wav")}
          volume={0.7}
        />
      )}

      {/* Shot 2 hit */}
      {frame >= 101 && frame <= 104 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_sub_bass_concussion_drop.wav")}
          volume={0.8}
        />
      )}

      {/* Shot 10 hit: MINES */}
      {frame >= 825 && frame <= 828 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_sub_bass_concussion_drop.wav")}
          volume={0.9}
        />
      )}

      {/* Shot 11 hit: BOOBY TRAPS */}
      {frame >= 871 && frame <= 874 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_iron_cross_metal_stamp.mp3")}
          volume={0.8}
        />
      )}

      {/* Shot 12 hit: ACCIDENTS */}
      {frame >= 905 && frame <= 908 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_sub_bass_concussion_drop.wav")}
          volume={0.8}
        />
      )}

      {/* Shot 13 hit: THEIR OWN SIDE */}
      {frame >= 939 && frame <= 942 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_sub_bass_concussion_drop.wav")}
          volume={0.95}
        />
      )}

      {/* Title Card Slam */}
      {frame >= 999 && frame <= 1002 && (
        <Audio
          src={staticFile("cottage/sfx/sfx_sub_bass_concussion_drop.wav")}
          volume={1.0}
        />
      )}
    </AbsoluteFill>
  );
};
