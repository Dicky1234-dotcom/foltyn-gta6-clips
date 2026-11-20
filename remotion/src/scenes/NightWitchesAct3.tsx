import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// =========================================================================
// LIVING STILLS PROCEDURAL SNOWFLAKES (27° ANGLE WIND STREAKS)
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

const ACT3_SNOW: SnowFlake[] = Array.from({ length: 85 }, (_, i) => {
  const seed = (i * 7919 + 65537) % 100000;
  const depthRand = i % 10;
  const depth: "fg" | "mg" | "bg" =
    depthRand < 2 ? "fg" : depthRand < 6 ? "mg" : "bg";
  return {
    id: i,
    x: (seed * 19.2) % 1920,
    speed:
      depth === "fg"
        ? 4.8 + (seed % 1.8)
        : depth === "mg"
        ? 2.8 + (seed % 1.2)
        : 1.4 + (seed % 0.6),
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

// =========================================================================
// ACT 3: THE WORLD'S WORST BOMBER (Frames 0 to 2977 @ 30 FPS | 99.2s)
// SURGICALLY SYNCHRONIZED TO MASTER VOICEOVER (Frames 5083 to 8060)
// =========================================================================
export const NightWitchesAct3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const snowCanvasRef = useRef<HTMLCanvasElement>(null);

  // -----------------------------------------------------------------------
  // SMOOTH CINEMATIC DISSOLVE FUNCTION (4-6 FRAME FILM BLEND)
  // -----------------------------------------------------------------------
  function crossfadeOpacity(f: number, start: number, end: number) {
    const fadeIn = interpolate(f, [start, start + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    const fadeOut = interpolate(f, [end - 5, end], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    return Math.min(fadeIn, fadeOut);
  }

  // -----------------------------------------------------------------------
  // CAMERA PUSHES PER CUT (ANCHORED BY ORIGIN, ZERO EDGE BLEED)
  // -----------------------------------------------------------------------
  const push01  = interpolate(frame, [0, 54], [1.0, 1.03], { extrapolateRight: "clamp" });
  const push02A = interpolate(frame, [54, 150], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push02B = interpolate(frame, [150, 250], [1.65, 1.72], { extrapolateRight: "clamp" });
  const push03A = interpolate(frame, [250, 340], [2.15, 2.25], { extrapolateRight: "clamp" });
  const push03B = interpolate(frame, [340, 430], [1.70, 1.80], { extrapolateRight: "clamp" });
  const push04A = interpolate(frame, [430, 530], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push04B = interpolate(frame, [530, 632], [1.88, 1.98], { extrapolateRight: "clamp" });
  const push05A = interpolate(frame, [632, 710], [1.90, 2.00], { extrapolateRight: "clamp" });
  const push05B = interpolate(frame, [710, 785], [2.10, 2.22], { extrapolateRight: "clamp" });
  const push06A = interpolate(frame, [785, 865], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push06B = interpolate(frame, [865, 945], [1.82, 1.92], { extrapolateRight: "clamp" });
  const push07  = interpolate(frame, [945, 1070], [1.0, 1.04], { extrapolateRight: "clamp" });
  const push08A = interpolate(frame, [1070, 1170], [1.72, 1.80], { extrapolateRight: "clamp" });
  const push08B = interpolate(frame, [1170, 1250], [1.0, 1.03], { extrapolateRight: "clamp" });
  const push08C = interpolate(frame, [1250, 1325], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push09A = interpolate(frame, [1325, 1370], [1.0, 1.05], { extrapolateRight: "clamp" });
  const push09B = interpolate(frame, [1370, 1410], [1.0, 1.06], { extrapolateRight: "clamp" });
  const push10  = interpolate(frame, [1410, 1530], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push11A = interpolate(frame, [1530, 1630], [1.65, 1.74], { extrapolateRight: "clamp" });
  const push11B = interpolate(frame, [1630, 1730], [1.90, 2.02], { extrapolateRight: "clamp" });
  const push11C = interpolate(frame, [1730, 1825], [2.15, 2.26], { extrapolateRight: "clamp" });
  const push12A = interpolate(frame, [1825, 1925], [1.0, 1.04], { extrapolateRight: "clamp" });
  const push12B = interpolate(frame, [1925, 2025], [1.85, 1.96], { extrapolateRight: "clamp" });
  const push12C = interpolate(frame, [2025, 2135], [2.25, 2.38], { extrapolateRight: "clamp" });
  const push12D = interpolate(frame, [2135, 2235], [1.70, 1.80], { extrapolateRight: "clamp" });
  const push13A = interpolate(frame, [2235, 2335], [1.0, 1.035], { extrapolateRight: "clamp" });
  const push13B = interpolate(frame, [2335, 2470], [2.05, 2.18], { extrapolateRight: "clamp" });
  const push13C = interpolate(frame, [2470, 2540], [1.62, 1.72], { extrapolateRight: "clamp" });
  const push13D = interpolate(frame, [2540, 2610], [2.15, 2.28], { extrapolateRight: "clamp" });
  const push14A = interpolate(frame, [2610, 2690], [1.04, 1.10], { extrapolateRight: "clamp" });
  const push14B = interpolate(frame, [2690, 2770], [1.08, 1.15], { extrapolateRight: "clamp" });
  const push15A = interpolate(frame, [2770, 2835], [1.18, 1.25], { extrapolateRight: "clamp" });
  const push15B = interpolate(frame, [2835, 2898], [1.82, 1.92], { extrapolateRight: "clamp" });
  const push15C = interpolate(frame, [2898, 2977], [1.95, 2.08], { extrapolateRight: "clamp" });

  // Screen shake on burning plane plunge (frames 2610 - 2770)
  const isPlunge = frame >= 2610 && frame <= 2770;
  const shakeX = isPlunge ? Math.sin(frame * 1.8) * 8 : 0;
  const shakeY = isPlunge ? Math.cos(frame * 2.1) * 6 : 0;

  // Procedural snow canvas for freezing winter cuts (frame >= 1410)
  useEffect(() => {
    const canvas = snowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1920, 1080);
    if (frame < 1410) return; // Peacetime summer scenes have zero snow

    for (const p of ACT3_SNOW) {
      const top = (frame * p.speed * 3.4 + p.id * 75) % 1160 - 50;
      const windDrift = frame * 2.8;
      const sway = Math.sin((frame + p.id * 18) * p.swayFreq) * p.swayAmp;
      const left = (p.x - windDrift + sway + 5760) % 2020 - 50;

      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(-0.48); // ~27° wind angle
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.7, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(185, 212, 238, ${p.opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }, [frame]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#06090E", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        
        {/* ============================================================= */}
        {/* CUT 01 [0 - 54]: "THEN CAME THE PLANES" (SILHOUETTE EMERGES)   */}
        {/* ============================================================= */}
        {frame <= 56 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 0, 54),
              transform: `scale(${push01})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.92)" }}
            />
            <div style={{ position: "absolute", left: "12%", bottom: "18%", backgroundColor: "rgba(10,14,22,0.92)", borderLeft: "4px solid #C49838", padding: "8px 18px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8E9EAF", letterSpacing: 1.5 }}>1941 AIR LOGISTICS</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#FAF6EE" }}>THEN CAME THE PLANES.</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 02A [54 - 150]: "THE POLYKARPOV U-2 WAS A 1928 DESIGN"    */}
        {/* ============================================================= */}
        {frame >= 52 && frame <= 152 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 54, 150),
              transform: `scale(${push02A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_01_peacetime_crop_duster.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.08) brightness(0.96)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 02B [150 - 250]: DESIGNATION PUNCH (1928 ORIGIN)          */}
        {/* ============================================================= */}
        {frame >= 148 && frame <= 252 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 150, 250),
              transform: `scale(${push02B})`,
              transformOrigin: "25% 45%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_01_peacetime_crop_duster.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.95)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #C49838", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#F2D070", fontWeight: 700 }}>POLIKARPOV U-2 (1928)</div>
              <div style={{ fontSize: 11, color: "#98A8B8" }}>REDESIGNATED PO-2 LATE IN THE WAR</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 03A [250 - 340]: "TRAINING TEENAGE BOYS HOW TO TAKE OFF"  */}
        {/* ============================================================= */}
        {frame >= 248 && frame <= 342 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 250, 340),
              transform: `scale(${push03A})`,
              transformOrigin: "58% 38%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_01_peacetime_crop_duster.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.94)" }}
            />
            <div style={{ position: "absolute", right: "12%", top: "20%", backgroundColor: "rgba(12,16,24,0.90)", border: "1px solid #8EA8C4", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#FAF6EE", fontWeight: 700 }}>PRIMARY MISSION #1</div>
              <div style={{ fontSize: 11, color: "#8E9EAF" }}>TRAINING TEENAGE BOYS HOW TO TAKE OFF</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 03B [340 - 430]: "AND DUSTING CROPS WITH PESTICIDE"       */}
        {/* ============================================================= */}
        {frame >= 338 && frame <= 432 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 340, 430),
              transform: `scale(${push03B})`,
              transformOrigin: "44% 68%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_01_peacetime_crop_duster.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.95)" }}
            />
            <div style={{ position: "absolute", left: "12%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #4CAF50", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#81C784", fontWeight: 700 }}>PRIMARY MISSION #2</div>
              <div style={{ fontSize: 11, color: "#FAF6EE" }}>DUSTING CROPS WITH PESTICIDE</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 04A [430 - 530]: "CONSTRUCTED OF SPRUCE SPARS..."         */}
        {/* ============================================================= */}
        {frame >= 428 && frame <= 532 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 430, 530),
              transform: `scale(${push04A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_02_cutaway_schematic.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.92)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 04B [530 - 632]: "...PLYWOOD RIBS AND VARNISHED LINEN"   */}
        {/* ============================================================= */}
        {frame >= 528 && frame <= 634 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 530, 632),
              transform: `scale(${push04B})`,
              transformOrigin: "34% 56%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_02_cutaway_schematic.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.14) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "18%", backgroundColor: "rgba(18,24,34,0.92)", border: "1px solid #C49838", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#F2D070", fontWeight: 700 }}>AIRFRAME MATERIALS</div>
              <div style={{ fontSize: 11, color: "#98A8B8" }}>SPRUCE SPARS // BIRCH PLYWOOD RIBS // VARNISHED LINEN</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 05A [632 - 710]: "OPEN COCKPITS, NO ARMOUR PLATING..."   */}
        {/* ============================================================= */}
        {frame >= 630 && frame <= 712 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 632, 710),
              transform: `scale(${push05A})`,
              transformOrigin: "62% 44%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_02_cutaway_schematic.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.92)" }}
            />
            <div style={{ position: "absolute", right: "12%", top: "20%", backgroundColor: "rgba(35,12,14,0.92)", border: "1px solid #D92525", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#FF4545", fontWeight: 900 }}>DEFENSIVE STATUS</div>
              <div style={{ fontSize: 11, color: "#FAF6EE" }}>OPEN COCKPITS // ZERO ARMOUR PLATING</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 05B [710 - 785]: "...NO RADIO AND NO RADAR"              */}
        {/* ============================================================= */}
        {frame >= 708 && frame <= 787 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 710, 785),
              transform: `scale(${push05B})`,
              transformOrigin: "52% 48%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_02_cutaway_schematic.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) brightness(0.88)" }}
            />
            <div style={{ position: "absolute", left: "14%", bottom: "22%", backgroundColor: "rgba(35,12,14,0.92)", border: "1px solid #D92525", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#FF4545", fontWeight: 900 }}>[X] NO RADIO   [X] NO RADAR</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 06A [785 - 865]: "TINY 5-CYLINDER RADIAL ENGINE..."       */}
        {/* ============================================================= */}
        {frame >= 783 && frame <= 867 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 785, 865),
              transform: `scale(${push06A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_03_shvetsov_engine.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.94)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 06B [865 - 945]: "...PUT OUT JUST 100 HORSEPOWER"        */}
        {/* ============================================================= */}
        {frame >= 863 && frame <= 947 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 865, 945),
              transform: `scale(${push06B})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_03_shvetsov_engine.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) brightness(0.92)" }}
            />
            <div style={{ position: "absolute", left: "14%", top: "20%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #8EA8C4", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#FAF6EE", fontWeight: 700 }}>SHVETSOV M-11 RADIAL</div>
              <div style={{ fontSize: 14, color: "#F2D070", fontWeight: 900 }}>100 HORSEPOWER (75 kW)</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 07 [945 - 1070]: "HEADWIND... FLEW AT 60 MILES PER HOUR" */}
        {/* ============================================================= */}
        {frame >= 943 && frame <= 1072 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 945, 1070),
              transform: `scale(${push07})`,
              transformOrigin: "55% 45%",
            }}
          >
            <Img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.88)" }}
            />
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgba(10,14,20,0.94)", border: "2px solid #5A7490", padding: "14px 26px", borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8EA8C4", letterSpacing: 2 }}>HEADWIND CRUISE AIRSPEED</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#FAF6EE", margin: "2px 0" }}>60 MPH</div>
              <div style={{ fontSize: 11, color: "#D92525", fontWeight: 700 }}>96 KM/H // BARELY FASTER THAN A CAR</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 08A [1070 - 1170]: "FIRST WOMEN COMBAT PILOTS IN HISTORY" */}
        {/* ============================================================= */}
        {frame >= 1068 && frame <= 1172 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1070, 1170),
              transform: `scale(${push08A})`,
              transformOrigin: "50% 32%",
            }}
          >
            <Img
              src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.92)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 08B [1170 - 1250]: "...AND SAID..." (FLIMSY WOODEN PLANE) */}
        {/* ============================================================= */}
        {frame >= 1168 && frame <= 1252 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1170, 1250),
              transform: `scale(${push08B})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_02_cutaway_schematic.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.90)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 08C [1250 - 1325]: "...HERE'S THE WORST PLANE WE HAVE"   */}
        {/* ============================================================= */}
        {frame >= 1248 && frame <= 1327 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1250, 1325),
              transform: `scale(${push08C})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.86)" }}
            />
            <div style={{ position: "absolute", left: "15%", bottom: "22%", maxWidth: 620, backgroundColor: "rgba(14,18,26,0.94)", borderLeft: "4px solid #D92525", padding: "16px 22px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8E9EAF" }}>RED ARMY AIR LOGISTICS // 1941</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FAF6EE", marginTop: 4 }}>"Here is the worst plane we have."</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 09A [1325 - 1370]: "GO SPRAY SOMETHING"                  */}
        {/* ============================================================= */}
        {frame >= 1323 && frame <= 1372 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1325, 1370),
              transform: `scale(${push09A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_01_peacetime_crop_duster.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.14) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgba(25,10,10,0.92)", border: "2px solid #D92525", padding: "12px 28px", borderRadius: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#FF5252", letterSpacing: 2 }}>GO SPRAY SOMETHING.</span>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 09B [1370 - 1410]: "SO THEY DID"                         */}
        {/* ============================================================= */}
        {frame >= 1368 && frame <= 1412 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1370, 1410),
              transform: `scale(${push09B})`,
              transformOrigin: "50% 32%",
            }}
          >
            <Img
              src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.16) brightness(0.94)" }}
            />
            <div style={{ position: "absolute", bottom: 80, right: "12%", backgroundColor: "rgba(8,12,18,0.92)", border: "1px solid rgba(255,255,255,0.25)", padding: "10px 22px", borderRadius: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#FFD54F", letterSpacing: 2 }}>SO THEY DID.</span>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 10 [1410 - 1530]: "MILITARY DIDN'T HAVE GEAR FOR THEM"    */}
        {/* ============================================================= */}
        {frame >= 1408 && frame <= 1532 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1410, 1530),
              transform: `scale(${push10})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_04_oversized_boots_newspaper.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.92)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "18%", backgroundColor: "rgba(14,18,26,0.92)", borderLeft: "4px solid #C49838", padding: "8px 16px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8E9EAF" }}>SUPPLY CORPS FORENSIC</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#FAF6EE" }}>NO GEAR FOR WOMEN VOLUNTEERS</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 11A [1530 - 1630]: "OVERSIZED MEN'S COATS..."             */}
        {/* ============================================================= */}
        {frame >= 1528 && frame <= 1632 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1530, 1630),
              transform: `scale(${push11A})`,
              transformOrigin: "65% 42%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_04_oversized_boots_newspaper.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.92)" }}
            />
            <div style={{ position: "absolute", right: "12%", top: "20%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #C49838", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#E0C888", fontWeight: 700 }}>MEN'S WOOL SHINEL (GREATCOAT)</div>
              <div style={{ fontSize: 11, color: "#98A8B8" }}>SLEEVES ROLLED THREE FOLDS</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 11B [1630 - 1730]: "...AND SIZE 42 BOOTS..."              */}
        {/* ============================================================= */}
        {frame >= 1628 && frame <= 1732 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1630, 1730),
              transform: `scale(${push11B})`,
              transformOrigin: "48% 68%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_04_oversized_boots_newspaper.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.14) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #D92525", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#FF5252", fontWeight: 700 }}>SIZE 42 MEN'S JACKBOOTS</div>
              <div style={{ fontSize: 11, color: "#FAF6EE" }}>VOLUNTEER AVERAGE FOOT SIZE: 36–37</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 11C [1730 - 1825]: "...STUFFED WITH PRAVDA NEWSPAPER"     */}
        {/* ============================================================= */}
        {frame >= 1728 && frame <= 1827 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1730, 1825),
              transform: `scale(${push11C})`,
              transformOrigin: "46% 75%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_04_oversized_boots_newspaper.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.16) brightness(0.88)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", borderLeft: "4px solid #C49838", padding: "8px 16px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#E0C888", fontWeight: 700 }}>FIELD ADAPTATION</div>
              <div style={{ fontSize: 11, color: "#FAF6EE" }}>TORN PRAVDA NEWSPRINT & BEDSHEETS PREVENT SLIPPING</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 12A [1825 - 1925]: "OPEN COCKPITS IN 30 BELOW WEATHER..."  */}
        {/* ============================================================= */}
        {frame >= 1823 && frame <= 1927 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1825, 1925),
              transform: `scale(${push12A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_05_frozen_cockpit_compass.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.92)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 12B [1925 - 2025]: "...WINDCHILL NUMBED FACES IN MINUTES" */}
        {/* ============================================================= */}
        {frame >= 1923 && frame <= 2027 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 1925, 2025),
              transform: `scale(${push12B})`,
              transformOrigin: "50% 28%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_05_frozen_cockpit_compass.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", right: "10%", top: "18%", backgroundColor: "rgba(10,20,32,0.92)", border: "1px solid #78B4E0", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#8EE8FF", fontWeight: 700 }}>TEMPERATURE: -30°C</div>
              <div style={{ fontSize: 11, color: "#D0E4F4" }}>WINDCHILL NUMBS FACES IN MINUTES</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 12C [2025 - 2135]: "BARE SKIN TO COMPASS TORE FLESH"       */}
        {/* ============================================================= */}
        {frame >= 2023 && frame <= 2137 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2025, 2135),
              transform: `scale(${push12C})`,
              transformOrigin: "50% 64%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_05_frozen_cockpit_compass.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.18) brightness(0.86)" }}
            />
            <div style={{ position: "absolute", right: "10%", bottom: "16%", backgroundColor: "rgba(35,12,14,0.94)", border: "1px solid #FF5252", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#FF5252", fontWeight: 900 }}>FROSTBITE HAZARD</div>
              <div style={{ fontSize: 11, color: "#FAF6EE" }}>BARE SKIN TOUCHING BRASS COMPASS TEARS FLESH</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 12D [2135 - 2235]: "...FLEW WITHOUT PARACHUTES"           */}
        {/* ============================================================= */}
        {frame >= 2133 && frame <= 2237 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2135, 2235),
              transform: `scale(${push12D})`,
              transformOrigin: "24% 72%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_06_trading_parachutes_bombs.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #D92525", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#FF5252", fontWeight: 700 }}>PARACHUTES: DISCARDED</div>
              <div style={{ fontSize: 11, color: "#FAF6EE" }}>ALMOST ALL FLEW WITHOUT PARACHUTES</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 13A [2235 - 2335]: "PLANE WAS SO UNDERPOWERED..."         */}
        {/* ============================================================= */}
        {frame >= 2233 && frame <= 2337 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2235, 2335),
              transform: `scale(${push13A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/scene6_po2_gliding.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.90)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 13B [2335 - 2470]: "...60 POUNDS OF DEAD WEIGHT"          */}
        {/* ============================================================= */}
        {frame >= 2333 && frame <= 2472 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2335, 2470),
              transform: `scale(${push13B})`,
              transformOrigin: "22% 76%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_06_trading_parachutes_bombs.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) brightness(0.88)" }}
            />
            <div style={{ position: "absolute", left: "12%", top: "20%", backgroundColor: "rgba(14,18,26,0.92)", border: "1px solid #D92525", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#FF5252", fontWeight: 700 }}>2x 30-LB PARACHUTES</div>
              <div style={{ fontSize: 14, color: "#FAF6EE", fontWeight: 900 }}>60 LBS (27 KG) DEAD WEIGHT</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 13C [2470 - 2540]: "60 LBS BETTER USED..." (HOISTING)     */}
        {/* ============================================================= */}
        {frame >= 2468 && frame <= 2542 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2470, 2540),
              transform: `scale(${push13C})`,
              transformOrigin: "62% 48%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_06_trading_parachutes_bombs.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.94)" }}
            />
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 13D [2540 - 2610]: "...ON AN EXTRA BOMB" (LATCH SNAP)     */}
        {/* ============================================================= */}
        {frame >= 2538 && frame <= 2612 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2540, 2610),
              transform: `scale(${push13D})`,
              transformOrigin: "68% 42%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_06_trading_parachutes_bombs.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.16) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", right: "10%", bottom: "16%", backgroundColor: "rgba(10,14,22,0.92)", border: "1px solid #C49838", padding: "8px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#F2D070", fontWeight: 700 }}>ORDNANCE TRADE-OFF</div>
              <div style={{ fontSize: 14, color: "#FAF6EE", fontWeight: 900 }}>1x EXTRA 50KG FAB-50 BOMB</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 14A [2610 - 2690]: "IF YOUR PLANE CAUGHT FIRE AT 3,000 FT" */}
        {/* ============================================================= */}
        {frame >= 2608 && frame <= 2692 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2610, 2690),
              transform: `scale(${push14A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/scene8_trench_detonation.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.22) brightness(0.88)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(25,8,8,0.92)", borderLeft: "4px solid #FFA028", padding: "10px 18px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#FFA028", fontWeight: 700 }}>ALTITUDE: 3,000 FEET // ZERO PARACHUTES</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 14B [2690 - 2770]: "...YOU RODE IT ALL THE WAY DOWN"       */}
        {/* ============================================================= */}
        {frame >= 2688 && frame <= 2772 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2690, 2770),
              transform: `scale(${push14B})`,
              transformOrigin: "45% 55%",
            }}
          >
            <Img
              src={staticFile("night_witches/scene1_don_river_steppe.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.10) brightness(0.85)" }}
            />
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgba(10,12,18,0.92)", border: "2px solid #D92525", padding: "14px 28px", borderRadius: 4, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#FF5252" }}>"YOU RODE IT ALL THE WAY DOWN."</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 15A [2770 - 2835]: "HAND ME DOWN PLANES..." (MATCH CUT)   */}
        {/* ============================================================= */}
        {frame >= 2768 && frame <= 2837 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2770, 2835),
              transform: `scale(${push15A})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_02_cutaway_schematic.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", borderLeft: "4px solid #C49838", padding: "8px 18px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#FAF6EE" }}>HAND-ME-DOWN PLANES.</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 15B [2835 - 2898]: "...HAND ME DOWN CLOTHES" (MATCH CUT)  */}
        {/* ============================================================= */}
        {frame >= 2833 && frame <= 2900 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2835, 2898),
              transform: `scale(${push15B})`,
              transformOrigin: "48% 68%",
            }}
          >
            <Img
              src={staticFile("night_witches/act3_04_oversized_boots_newspaper.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.14) brightness(0.90)" }}
            />
            <div style={{ position: "absolute", left: "10%", bottom: "16%", backgroundColor: "rgba(14,18,26,0.92)", borderLeft: "4px solid #C49838", padding: "8px 18px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#FAF6EE" }}>HAND-ME-DOWN CLOTHES.</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* CUT 15C [2898 - 2977]: "...THE ONE THING WAS NERVE" (HERO)   */}
        {/* ============================================================= */}
        {frame >= 2896 && (
          <AbsoluteFill
            style={{
              opacity: crossfadeOpacity(frame, 2898, 2977),
              transform: `scale(${push15C})`,
              transformOrigin: "50% 30%",
            }}
          >
            <Img
              src={staticFile("night_witches/soviet_night_witch_benchmark_plate.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.16) brightness(0.94)" }}
            />
            <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(10,14,20,0.92)", border: "2px solid #C49838", padding: "10px 28px", borderRadius: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#FAF6EE", letterSpacing: 2 }}>THE ONE THING THAT WASN'T SECOND-HAND WAS NERVE.</span>
            </div>
          </AbsoluteFill>
        )}

        {/* ============================================================= */}
        {/* PROCEDURAL SNOW CANVAS (WINTER CUTS: FRAME >= 1410)           */}
        {/* ============================================================= */}
        <canvas
          ref={snowCanvasRef}
          width={1920}
          height={1080}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />

        {/* ============================================================= */}
        {/* ARCHIVAL LENS VIGNETTE (FOCUSING ILLUMINATED CORE)            */}
        {/* ============================================================= */}
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(6, 9, 14, 0.75) 100%)",
          }}
        />
      </AbsoluteFill>

      {/* ============================================================= */}
      {/* SYNCHRONIZED MASTER SOUND DESIGN TRACKS                       */}
      {/* ============================================================= */}
      {/* 1. Master Cold-Case Narration (Act 3: Frames 5083 to 8060) */}
      <Audio
        src={staticFile("night_witches/voiceover.wav")}
        startFrom={5083}
        endAt={8060}
        volume={1.0}
      />

      {/* 2. Po-2 Radial Engine Humming (Pre-War & Flight: Frames 0 - 1070) */}
      <Sequence from={0} durationInFrames={1070}>
        <Audio
          src={staticFile("night_witches/sfx_po2_engine_cruise_steady.mp3")}
          volume={0.12}
        />
      </Sequence>

      {/* 3. Transition Whoosh into Barracks at Frame 1410 */}
      <Sequence from={1410} durationInFrames={45}>
        <Audio
          src={staticFile("night_witches/sfx_camera_whoosh_transition.mp3")}
          volume={0.45}
        />
      </Sequence>

      {/* 4. Winter Steppe Wind Howl (Winter Scenes: Frame >= 1410) */}
      <Sequence from={1410} durationInFrames={1567}>
        <Audio
          src={staticFile("night_witches/sfx_winter_steppe_wind_howl.mp3")}
          volume={0.06}
        />
      </Sequence>

      {/* 5. Mechanical Bomb Shackle Lock Clank at Frame 2540 */}
      <Sequence from={2540} durationInFrames={60}>
        <Audio
          src={staticFile("night_witches/sfx_iron_cross_metal_stamp.mp3")}
          volume={0.55}
        />
      </Sequence>

      {/* 6. Concussion Sub-Bass Drop on Burning Plunge at Frame 2610 */}
      <Sequence from={2610} durationInFrames={90}>
        <Audio
          src={staticFile("night_witches/sfx_sub_bass_concussion_drop.wav")}
          volume={0.35}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
