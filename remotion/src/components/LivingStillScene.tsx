import React from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";

interface LivingStillProps {
  scale?: number;
  originX?: string;
  originY?: string;
  flickerIntensity?: number;
  showEmbers?: boolean;
  showMist?: boolean;
  caption?: string;
}

export const LivingStillScene: React.FC<LivingStillProps> = ({
  scale = 1.0,
  originX = "50%",
  originY = "50%",
  flickerIntensity = 1.0,
  showEmbers = true,
  showMist = true,
  caption = "COMMANDING OFFICER // NIGHT WATCH PATROL",
}) => {
  const frame = useCurrentFrame();

  // 1. DYNAMIC TORCHLIGHT FLUTTER MATH
  // High-frequency jitter + low-frequency organic breathing
  const breathing = Math.sin(frame * 0.25) * 0.08;
  const microJitter = (Math.sin(frame * 1.8) * 0.5 + Math.cos(frame * 2.3) * 0.5) * 0.06;
  const torchIntensity = Math.max(
    0.2,
    0.38 + (breathing + microJitter) * flickerIntensity
  );

  // Light center jitter (subtle +/- 3px wobble around the torch flame)
  const torchX = 50.5 + Math.sin(frame * 0.6) * 0.4;
  const torchY = 24.0 + Math.cos(frame * 0.8) * 0.5;

  // Counter-phase shadow shift across body
  const shadowShift = -Math.sin(frame * 0.25) * 4;

  // 2. PROCEDURAL RISING EMBERS (16 floating sparks)
  const embers = Array.from({ length: 16 }).map((_, i) => {
    const seed = i * 137.5;
    const speed = 1.8 + (i % 4) * 0.4;
    const startFrame = (seed % 90);
    const lifeCycle = (frame + startFrame) % 75; // 75-frame lifespan
    const yProgress = lifeCycle / 75;

    const xDrift = Math.sin((frame + seed) * 0.1) * 25 + (i * 8 - 60);
    const yPos = 380 - yProgress * 320; // rises upward from torch
    const opacity = yProgress < 0.2 ? yProgress * 5 : 1 - (yProgress - 0.2) * 1.25;
    const size = 3 + (i % 3) * 1.5;

    return {
      x: 970 + xDrift,
      y: yPos,
      opacity: Math.max(0, opacity),
      size,
    };
  });

  // 3. CANAL MIST LATERAL DRIFT
  const mistShift1 = (frame * 0.8) % 1920;
  const mistShift2 = (frame * 1.2 + 800) % 1920;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0B0E14",
      }}
    >
      {/* MASTER BASE PLATE WITH CAMERA TRANSFORM */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: `${originX} ${originY}`,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Background Graphic Novel Master Plate */}
        <img
          src={staticFile("dutch_militia_captain_armchair_value_pop.jpg")}
          alt="Dutch Militia Captain"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* DYNAMIC TORCHLIGHT GLOW LAYER (Color-Dodge Blend) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at ${torchX}% ${torchY}%, rgba(255, 148, 41, ${torchIntensity}) 0%, rgba(255, 100, 20, ${torchIntensity * 0.5}) 25%, rgba(18, 23, 32, 0) 58%)`,
            mixBlendMode: "color-dodge",
            pointerEvents: "none",
          }}
        />

        {/* AMBIENT WARM HIGHLIGHT SHEEN (Overlay Blend) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at ${torchX}% ${torchY}%, rgba(255, 200, 100, ${torchIntensity * 0.3}) 0%, rgba(0,0,0,0) 45%)`,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        {/* COUNTER-PHASE BODY SHADOW FLUTTER (Multiply Blend) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${shadowShift}px`,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 70% 65%, rgba(10, 15, 24, 0.22) 0%, rgba(0,0,0,0) 60%)`,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />

        {/* PROCEDURAL RISING TORCH EMBERS */}
        {showEmbers && (
          <svg
            width="1920"
            height="1080"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              zIndex: 30,
            }}
          >
            {embers.map((e, idx) => (
              <circle
                key={idx}
                cx={e.x}
                cy={e.y}
                r={e.size}
                fill="#FF9429"
                opacity={e.opacity}
                style={{
                  filter: "drop-shadow(0 0 4px #FFA000)",
                }}
              />
            ))}
          </svg>
        )}

        {/* ATMOSPHERIC CANAL MIST (Layered Drift) */}
        {showMist && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "3840px",
              height: "280px",
              transform: `translateX(-${mistShift1}px)`,
              background:
                "linear-gradient(to top, rgba(184, 202, 218, 0.22) 0%, rgba(184, 202, 218, 0.08) 50%, rgba(0,0,0,0) 100%)",
              filter: "blur(8px)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* DOCUMENTARY LOWER-THIRD HUD ACCENT */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50px",
          color: "#F8FAFC",
          fontSize: "14px",
          letterSpacing: "2.5px",
          fontFamily: "'Courier New', Courier, monospace",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "#38BDF8", fontSize: "12px", marginBottom: "4px" }}>
          [LIVING STILL // HISTORICAL DOCUMENTARY PLATE]
        </div>
        <div style={{ fontSize: "20px", fontWeight: "bold" }}>{caption}</div>
      </div>

      {/* ARCHIVAL PAPER TEXTURE OVERLAY (3% Opacity Film Grain) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(237, 232, 222, 0.04)",
          boxShadow: "inset 0 0 140px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
