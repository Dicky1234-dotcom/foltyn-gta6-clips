import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Deterministic snow particles (stable across renders)
const FLAKES = Array.from({ length: 35 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  return {
    id: i,
    xSeed: seed % 1920,
    speed: 1.2 + ((seed % 100) / 100) * 1.8,
    size: 2.0 + ((seed % 50) / 50) * 3.0,
    opacity: 0.25 + ((seed % 40) / 40) * 0.35,
  };
});

export const Shot1TheCommute: React.FC = () => {
  const frame = useCurrentFrame();

  // 1. Slow cinematic background push-in (1.0x -> 1.045x over 390 frames)
  const bgScale = interpolate(frame, [0, 390], [1.0, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. Subtle idle breathing: 15 BPM sinusoidal vertical breath (~0.8% amplitude)
  const idleBreath = Math.sin(frame * 0.1) * 0.008;

  // 3. Slot-swap eye blink: every ~110 frames (~3.6s), swap to closed eyelid for 3 frames
  const isBlinking = frame % 110 < 3 && frame > 20;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1117", overflow: "hidden" }}>
      {/* NARRATION AUDIO (Exact 13s / 390 frames) */}
      <Audio src={staticFile("tolkachev/tolkachev_hook_voice.wav")} endAt={390} />

      {/* 1. BACKGROUND PLATE: NIIR Phazotron Exterior (Slow Push-In) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${bgScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Img
          src={staticFile("tolkachev/bg_01_niir_exterior_gate.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* 2. MIDGROUND: Tolkachev Waist-Up Cutout (Left Third, Breathing + Blink) */}
      <div
        style={{
          position: "absolute",
          left: 140,
          bottom: 0,
          height: 860,
          transformOrigin: "bottom center",
          transform: `scaleY(${1 + idleBreath}) scaleX(${1 - idleBreath * 0.3})`,
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.85))",
        }}
      >
        <Img
          src={
            isBlinking
              ? staticFile("tolkachev/tolkachev_waist_up_blink.png")
              : staticFile("tolkachev/tolkachev_waist_up.png")
          }
          style={{ height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* 3. FOREGROUND: Gentle Drifting Snow Overlay */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {FLAKES.map((f) => {
          const top = (frame * f.speed * 1.8) % 1150 - 50;
          const left = (f.xSeed + frame * 0.4) % 1920;
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
                backgroundColor: "#EDE4D0",
                opacity: f.opacity,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* 4. VIGNETTE: Soft Edge Darkening for Focus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 45% 45%, transparent 60%, rgba(13, 17, 23, 0.7) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
