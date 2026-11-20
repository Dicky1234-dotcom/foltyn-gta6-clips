import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

// Generate 45 deterministic snow flakes
const SNOW_FLAKES = Array.from({ length: 45 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  return {
    id: i,
    xSeed: (seed % 1920),
    speed: 1.5 + ((seed % 100) / 100) * 2.2,
    size: 2 + ((seed % 60) / 60) * 3.5,
    opacity: 0.35 + ((seed % 50) / 50) * 0.45,
    sway: 0.8 + ((seed % 80) / 80) * 1.5,
  };
});

// Deterministic Snow Overlay Component
const SnowOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {SNOW_FLAKES.map((f) => {
        const top = (frame * f.speed * 2) % 1150 - 50;
        const left = (f.xSeed + Math.sin((frame + f.id * 10) * 0.05) * 25 * f.sway) % 1920;
        return (
          <div
            key={f.id}
            style={{
              position: "absolute",
              top,
              left,
              width: f.size,
              height: f.size,
              borderRadius: "50%",
              backgroundColor: THEME.colors.snowParchment,
              opacity: f.opacity,
              filter: f.size > 4 ? "blur(1px)" : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Global Cinematic Vignette & Color Grade
const CinematicGradeOverlay: React.FC<{ flashRed?: number }> = ({ flashRed = 0 }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* 2-Tone Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, transparent 55%, ${THEME.colors.vignetteBorder} 100%)`,
        }}
      />
      {/* Optional Blood Red Flash on execution shock */}
      {flashRed > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: THEME.colors.sovietCrimson,
            opacity: flashRed * 0.45,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 01: The Commute to NIIR (0:00 – 0:13 | Frames 0 – 390)
// ==========================================
const Scene01Commute: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera Dolly & Ken Burns
  const bgPanX = interpolate(frame, [0, 390], [0, -45], {
    easing: THEME.easings.smoothDolly,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgScale = interpolate(frame, [0, 390], [1.02, 1.10], {
    easing: THEME.easings.smoothDolly,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tolkachev Midground Walking Motion & Micro-breathing
  const puppetX = interpolate(frame, [0, 390], [-60, 110], {
    easing: THEME.easings.smoothDolly,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idleBreathe = Math.sin(frame * 0.12) * 0.012; // 15 BPM breathing

  // Foreground Fence Post Parallax (Fast: 1.6x)
  const fenceX = interpolate(frame, [0, 390], [80, -220], {
    easing: THEME.easings.smoothDolly,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Entrance Card
  const cardEntrance = spring({
    frame: frame - 15,
    fps,
    config: THEME.springPresets.snappy,
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: THEME.colors.slateBg }}>
      {/* 1. BACKGROUND PLATE: NIIR Exterior Gate (0.25x Parallax) */}
      <div
        style={{
          position: "absolute",
          width: "115%",
          height: "115%",
          left: "-7.5%",
          top: "-7.5%",
          transform: `translateX(${bgPanX}px) scale(${bgScale})`,
        }}
      >
        <Img
          src={staticFile("tolkachev/bg_01_niir_exterior_gate.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* 2. MIDGROUND SENTRY (Static at Gate) */}
      <div
        style={{
          position: "absolute",
          right: 260,
          bottom: 120,
          height: 520,
          transform: `translateX(${bgPanX * 0.7}px)`,
          filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.85))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_2_373x985.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* 3. MIDGROUND TOLKACHEV PUPPET (Walking 1.0x Parallax + 15 BPM Breathe) */}
      <div
        style={{
          position: "absolute",
          left: 420 + puppetX,
          bottom: 40,
          height: 680,
          transformOrigin: "bottom center",
          transform: `scaleY(${1 + idleBreathe}) scaleX(${1 - idleBreathe * 0.35})`,
          filter: "drop-shadow(0 20px 35px rgba(0,0,0,0.9))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_1_616x1440.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* 4. FOREGROUND WROUGHT IRON FENCE POSTS (Fast 1.6x Parallax) */}
      <div
        style={{
          position: "absolute",
          left: 140 + fenceX,
          bottom: -40,
          height: 820,
          filter: "drop-shadow(10px 0 25px rgba(0,0,0,0.95))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_3_143x844.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: -80 - fenceX * 0.6,
          bottom: -60,
          height: 860,
          transform: "scaleX(-1)",
          filter: "drop-shadow(-10px 0 25px rgba(0,0,0,0.95))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_3_143x844.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* SNOW OVERLAY */}
      <SnowOverlay />

      {/* CINEMATIC LOWER THIRD */}
      {frame > 20 && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            opacity: cardEntrance,
            transform: `translateY(${interpolate(cardEntrance, [0, 1], [30, 0])}px)`,
            backgroundColor: "rgba(13, 17, 23, 0.88)",
            borderLeft: `4px solid ${THEME.colors.lampAmber}`,
            padding: "14px 24px",
            borderRadius: "0 8px 8px 0",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: 22,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
              letterSpacing: "1.5px",
            }}
          >
            NIIR PHAZOTRON — MOSCOW
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.mono,
              fontSize: 14,
              color: THEME.colors.lampAmber,
              marginTop: 4,
              letterSpacing: "0.8px",
            }}
          >
            SOVIET FIGHTER RADAR RESEARCH INSTITUTE · 1977
          </div>
        </div>
      )}

      {/* GRADE & VIGNETTE */}
      <CinematicGradeOverlay />
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 02: Document Smuggle & "You'll Be Shot" (0:13 – 0:25 | Frames 390 – 750)
// ==========================================
const Scene02SmuggleAndShock: React.FC = () => {
  const frame = useCurrentFrame();

  // Rel frame 0-360
  // On "You'll be shot" (~frame 331 of this scene, audio 24.02s): CRASH ZOOM
  const isShotMoment = frame >= 325;
  const crashZoomProgress = interpolate(frame, [325, 335], [0, 1], {
    easing: THEME.easings.crashZoom,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const zoomScale = interpolate(crashZoomProgress, [0, 1], [1.0, 2.35]);
  const bloodFlash = interpolate(frame, [328, 332, 355], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cameraShake = isShotMoment && frame < 345 ? Math.sin(frame * 40) * 8 * (1 - (frame - 325) / 20) : 0;

  const idleBreathe = Math.sin(frame * 0.14) * 0.015;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: THEME.colors.slateBg,
        transform: `translate(${cameraShake}px, ${cameraShake * 0.5}px) scale(${zoomScale})`,
        transformOrigin: "52% 42%",
      }}
    >
      {/* BACKGROUND: Dim Apartment & Window */}
      <div style={{ position: "absolute", width: "110%", height: "110%", left: "-5%", top: "-5%" }}>
        <Img
          src={staticFile("tolkachev/bg_02_dim_apartment_window.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* MIDGROUND: Tolkachev Smuggling Blueprint */}
      <div
        style={{
          position: "absolute",
          left: 580,
          bottom: 20,
          height: 720,
          transformOrigin: "bottom center",
          transform: `scaleY(${1 + idleBreathe}) scaleX(${1 - idleBreathe * 0.3})`,
          filter: "drop-shadow(0 25px 45px rgba(0,0,0,0.9))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_5_309x768.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* PROP: Soviet Classified Security Pass */}
      <div
        style={{
          position: "absolute",
          left: 180,
          bottom: 120,
          height: 260,
          transform: `rotate(-8deg) scale(${1 + Math.sin(frame * 0.08) * 0.02})`,
          filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.85))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_7_481x377.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* TEXT PUNCHLINE: "YOU'LL BE SHOT" */}
      {frame >= 330 && (
        <div
          style={{
            position: "absolute",
            top: 140,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(185, 28, 28, 0.92)",
            border: `2px solid ${THEME.colors.textHighlight}`,
            padding: "16px 36px",
            borderRadius: 8,
            boxShadow: "0 0 50px rgba(185, 28, 28, 0.9)",
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: 38,
              fontWeight: 900,
              color: THEME.colors.textPrimary,
              letterSpacing: "4px",
              textAlign: "center",
            }}
          >
            YOU WILL BE SHOT
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.mono,
              fontSize: 14,
              color: THEME.colors.textHighlight,
              textAlign: "center",
              marginTop: 4,
              letterSpacing: "1px",
            }}
          >
            ARTICLE 64 · HIGH TREASON UNDER SOVIET LAW
          </div>
        </div>
      )}

      {/* GRADE & RED FLASH */}
      <CinematicGradeOverlay flashRed={bloodFlash} />
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 03: The Pentax Rig & $2 Billion Savings (0:25 – 0:53 | Frames 750 – 1620)
// ==========================================
const Scene03PentaxAndTwoBillion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow horizontal camera pan
  const cameraX = interpolate(frame, [0, 870], [-30, 40], {
    easing: THEME.easings.smoothDolly,
  });

  // White Camera Shutter Flash (occurs periodically to mimic photographing documents)
  const flashCycle = frame % 180;
  const isShutterFlash = flashCycle >= 0 && flashCycle <= 4;
  const shutterOpacity = isShutterFlash ? interpolate(flashCycle, [0, 1, 4], [0.85, 0.6, 0]) : 0;

  // Staggered $2 Billion Stats Card entrance around frame 300 (audio 43s - 50s)
  const statsEntrance = spring({
    frame: frame - 310,
    fps,
    config: THEME.springPresets.heavyImpact,
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: THEME.colors.slateBg }}>
      {/* BACKGROUND: Dim Apartment Window */}
      <div
        style={{
          position: "absolute",
          width: "115%",
          height: "115%",
          left: "-7.5%",
          top: "-7.5%",
          transform: `translateX(${cameraX * -0.3}px)`,
        }}
      >
        <Img
          src={staticFile("tolkachev/bg_02_dim_apartment_window.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* MIDGROUND: The Pentax Camera Chair Rig */}
      <div
        style={{
          position: "absolute",
          left: 360 + cameraX,
          bottom: 60,
          height: 640,
          transform: `scale(${1 + Math.sin(frame * 0.08) * 0.01})`,
          filter: "drop-shadow(0 25px 45px rgba(0,0,0,0.95))",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_4_736x738.png")}
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* SHUTTER FLASH OVERLAY */}
      {shutterOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#FFFFFF",
            opacity: shutterOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}

      {/* $2 BILLION STATS BADGE */}
      {frame >= 300 && (
        <div
          style={{
            position: "absolute",
            top: 160,
            right: 140,
            width: 460,
            opacity: statsEntrance,
            transform: `translateY(${interpolate(statsEntrance, [0, 1], [40, 0])}px) scale(${interpolate(statsEntrance, [0, 1], [0.92, 1])})`,
            backgroundColor: "rgba(13, 17, 23, 0.94)",
            border: `2px solid ${THEME.colors.radarEmerald}`,
            boxShadow: "0 20px 45px rgba(0,0,0,0.85), 0 0 30px rgba(16, 185, 129, 0.25)",
            padding: "24px 30px",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.mono,
              fontSize: 13,
              color: THEME.colors.radarEmerald,
              letterSpacing: "1.2px",
              fontWeight: 700,
            }}
          >
            CIA & PENTAGON CLASSIFIED ASSESSMENT
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: 54,
              fontWeight: 900,
              color: THEME.colors.textHighlight,
              letterSpacing: "2px",
              marginTop: 4,
            }}
          >
            $2 BILLION
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: 15,
              color: THEME.colors.textPrimary,
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            Estimated research & counter-avionics savings for U.S. military aviation.
          </div>
        </div>
      )}

      {/* GRADE & VIGNETTE */}
      <CinematicGradeOverlay />
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 04: CIA Memorial Hall, Framed Portrait & Title (0:54 – 1:12 | Frames 1620 – 2178)
// ==========================================
const Scene04CiaMemorialAndTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow continuous zoom-out from the portrait
  const cameraScale = interpolate(frame, [0, 558], [1.25, 1.0], {
    easing: THEME.easings.smoothDolly,
  });

  // Grand Title Stamp at frame 200 (~60s mark: "His name was Adolf Tolkachev")
  const titleEntrance = spring({
    frame: frame - 180,
    fps,
    config: THEME.springPresets.heavyImpact,
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: THEME.colors.ciaMarble }}>
      {/* 1. BACKGROUND: CIA Memorial Hall with Gilded Frame */}
      <div
        style={{
          position: "absolute",
          width: "115%",
          height: "115%",
          left: "-7.5%",
          top: "-7.5%",
          transform: `scale(${cameraScale})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Img
          src={staticFile("tolkachev/bg_03_cia_memorial_hall.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* 2. FRAMED PORTRAIT INSIDE THE GILDED WALL FRAME */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: `translate(-50%, -50%) scale(${cameraScale * 0.95})`,
          width: 320,
          height: 440,
          overflow: "hidden",
          border: `6px solid ${THEME.colors.gildedGold}`,
          boxShadow: "0 25px 60px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.6)",
        }}
      >
        <Img
          src={staticFile("tolkachev/sprite_1_616x1440.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            filter: "sepia(0.2) contrast(1.1)",
          }}
        />
        {/* Subtle oil painting canvas overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.15), transparent 70%)",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {/* 3. GRAND DOCUMENTARY TITLE CARD */}
      {frame >= 180 && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: "50%",
            transform: `translateX(-50%) translateY(${interpolate(titleEntrance, [0, 1], [40, 0])}px)`,
            opacity: titleEntrance,
            textAlign: "center",
            width: 1200,
            backgroundColor: "rgba(13, 17, 23, 0.92)",
            borderTop: `3px solid ${THEME.colors.gildedGold}`,
            borderBottom: `3px solid ${THEME.colors.gildedGold}`,
            padding: "20px 40px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.mono,
              fontSize: 14,
              color: THEME.colors.gildedGold,
              letterSpacing: "3px",
              fontWeight: 700,
            }}
          >
            CIA HISTORICAL DOCUMENTARY
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: 44,
              fontWeight: 900,
              color: THEME.colors.textPrimary,
              letterSpacing: "2.5px",
              marginTop: 6,
            }}
          >
            THE MAN WHO BLINDED THE SOVIET AIR FORCE
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: 16,
              color: THEME.colors.textMuted,
              marginTop: 6,
              letterSpacing: "0.5px",
            }}
          >
            How Adolf Tolkachev went to war with a superpower using a camera, a chair, and his lunch break.
          </div>
        </div>
      )}

      {/* GRADE & VIGNETTE */}
      <CinematicGradeOverlay />
    </AbsoluteFill>
  );
};

// ==========================================
// MASTER ARC 0 COMPOSITION (0:00 – 1:12.58 | 2,178 Frames @ 30 FPS)
// ==========================================
export const Arc0TheHookComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.slateBg }}>
      {/* MASTER NARRATION AUDIO: tolkachev_hook_voice.wav (Exact 2,178 Frames) */}
      <Audio src={staticFile("tolkachev/tolkachev_hook_voice.wav")} />

      {/* SCENE 01: The Commute to NIIR Phazotron (0:00 – 0:13 | Frames 0 – 390) */}
      <Sequence from={0} durationInFrames={390} name="Scene 01: The Commute">
        <Scene01Commute />
      </Sequence>

      {/* SCENE 02: Document Smuggle & "You'll Be Shot" (0:13 – 0:25 | Frames 390 – 360) */}
      <Sequence from={390} durationInFrames={360} name="Scene 02: Document Smuggle & Shock">
        <Scene02SmuggleAndShock />
      </Sequence>

      {/* SCENE 03: The Pentax Rig & $2 Billion Savings (0:25 – 0:54 | Frames 750 – 870) */}
      <Sequence from={750} durationInFrames={870} name="Scene 03: Pentax Rig & $2 Billion">
        <Scene03PentaxAndTwoBillion />
      </Sequence>

      {/* SCENE 04: CIA Memorial Hall, Portrait & Title (0:54 – 1:12.58 | Frames 1620 – 558) */}
      <Sequence from={1620} durationInFrames={558} name="Scene 04: CIA Memorial & Title">
        <Scene04CiaMemorialAndTitle />
      </Sequence>
    </AbsoluteFill>
  );
};
