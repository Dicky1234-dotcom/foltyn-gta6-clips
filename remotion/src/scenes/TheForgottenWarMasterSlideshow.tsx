import React from "react";
import {
  Audio,
  Composition,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// 21 Scene Boundaries precisely synchronized to audio_timestamps.json
export const SCENE_DEFINITIONS = [
  { id: "01", name: "Honnō-ji Temple Grounds at Midnight", startFrame: 0, endFrame: 212, img: "plate_01.jpg", type: "night_lantern" },
  { id: "02", name: "Oda Nobunaga in Nanban Armor", startFrame: 212, endFrame: 413, img: "plate_02.jpg", type: "firelight_breath" },
  { id: "03", name: "The Tenshō Embassy Teenagers on the Ship Deck", startFrame: 413, endFrame: 1110, img: "plate_03.jpg", type: "ocean_mist" },
  { id: "04", name: "The First Encounter on the Muddy Riverbank", startFrame: 1110, endFrame: 2132, img: "plate_04.jpg", type: "river_mist" },
  { id: "05", name: "Manila Harbor & The Pacific Silver Galleon", startFrame: 2132, endFrame: 3170, img: "plate_05.jpg", type: "harbor_pan" },
  { id: "06", name: "Sengoku Jidai Civil War Armies", startFrame: 3170, endFrame: 3410, img: "plate_06.jpg", type: "battlefield_dust" },
  { id: "07", name: "1543 Portuguese Arquebus Arrival at Tanegashima", startFrame: 3410, endFrame: 3560, img: "plate_07.jpg", type: "coastal_breeze" },
  { id: "08", name: "Japanese Blacksmiths Mass-Forging Matchlocks", startFrame: 3560, endFrame: 4018, img: "plate_08.jpg", type: "forge_pulse" },
  { id: "09", name: "Wokou Pirate Flotilla at Sea", startFrame: 4018, endFrame: 5057, img: "plate_09.jpg", type: "sea_swell" },
  { id: "10", name: "Corsair Lord Tay Fusa (Taifū-sama)", startFrame: 5057, endFrame: 5499, img: "plate_10.jpg", type: "armor_gleam" },
  { id: "11", name: "The Japanese Fort on the Cagayan River", startFrame: 5499, endFrame: 6428, img: "plate_11.jpg", type: "jungle_haze" },
  { id: "12", name: "70-Year-Old Spanish Captain Juan Pablo de Carrión", startFrame: 6428, endFrame: 7240, img: "plate_12.jpg", type: "candle_veteran" },
  { id: "13", name: "Spanish Conquistadors Readying Weapons", startFrame: 7240, endFrame: 8974, img: "plate_13.jpg", type: "deck_mist" },
  { id: "14", name: "The River Clash — Deck Boarding Action", startFrame: 8974, endFrame: 9358, img: "plate_14.jpg", type: "gunsmoke_combat" },
  { id: "15", name: "The Fall of Pedro Lucas", startFrame: 9358, endFrame: 9760, img: "plate_15.jpg", type: "deck_droplets" },
  { id: "16", name: "The Abandoned Fort Puerto de Japón", startFrame: 9760, endFrame: 11657, img: "plate_16.jpg", type: "hearth_smoke" },
  { id: "17", name: "Toyotomi Hideyoshi Rising to Power", startFrame: 11657, endFrame: 13410, img: "plate_17.jpg", type: "mountain_wind" },
  { id: "18", name: "Hideyoshi's Ultimatum Letter to Governor Dasmariñas", startFrame: 13410, endFrame: 14357, img: "plate_18.jpg", type: "window_rain" },
  { id: "19", name: "Friar Juan Cobo at Nagoya Castle", startFrame: 14357, endFrame: 17083, img: "plate_19.jpg", type: "brazier_palace" },
  { id: "20", name: "The San Felipe Incident & The 26 Martyrs of Nagasaki", startFrame: 17083, endFrame: 18678, img: "plate_20.jpg", type: "winter_snow" },
  { id: "21", name: "The Deserted Cagayan River Mouth at Twilight", startFrame: 18678, endFrame: 19427, img: "plate_21.jpg", type: "twilight_surf" },
];

export const TOTAL_PROJECT_FRAMES = 19427;

interface LivingStillPlateProps {
  imgFile: string;
  type: string;
  durationInFrames: number;
  isFirst: boolean;
}

const LivingStillPlate: React.FC<LivingStillPlateProps> = ({
  imgFile,
  type,
  durationInFrames,
  isFirst,
}) => {
  const frame = useCurrentFrame();

  // 1. SILKY FILM DISSOLVE (6 Frames = ~0.20s transition)
  const fadeInOpacity = isFirst
    ? 1.0
    : interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  // 2. SUBTLE CINEMATIC CAMERA MOTION (1.00 -> 1.03 scale drift, zero border bleed)
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.032], {
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, durationInFrames], [0, -12], {
    extrapolateRight: "clamp",
  });

  // 3. LIVING STILLS ELEMENT ANIMATIONS (60% Animated / 40% Ambient)
  // Dynamic light breathing oscillators
  const lightBreath = Math.sin(frame * 0.18) * 0.08 + Math.cos(frame * 0.32) * 0.04;
  const amberGlowIntensity = Math.max(0.15, 0.45 + lightBreath);

  // Procedural particle / weather positions
  const mistOffset1 = (frame * 0.7) % 1920;
  const mistOffset2 = (frame * 1.1 + 600) % 1920;
  const snowOffset = (frame * 3.5) % 1080;
  const rainOffset = (frame * 16.0) % 1080;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0B0E14",
        opacity: fadeInOpacity,
      }}
    >
      {/* MASTER BASE PLATE WITH CAMERA TRANSFORM */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translateX(${panX}px)`,
          transformOrigin: "center center",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <img
          src={staticFile(`cagayan_stills/${imgFile}`)}
          alt="Documentary Plate"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* --- DYNAMIC LIVING OVERLAYS BASED ON SCENE TYPE --- */}

        {/* TYPE 1: Night Lantern Glow Breathing (Plate 01) */}
        {type === "night_lantern" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 62% 68%, rgba(255, 170, 70, ${amberGlowIntensity * 0.22}) 0%, transparent 45%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 2: Firelight Chiaroscuro Breathing (Plate 02: Nobunaga) */}
        {type === "firelight_breath" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 75% 45%, rgba(255, 150, 40, ${amberGlowIntensity * 0.20}) 0%, transparent 55%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 3: Forge Pulse (Plate 08: Sakai Gunsmiths) */}
        {type === "forge_pulse" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 48% 62%, rgba(255, 140, 20, ${amberGlowIntensity * 0.28}) 0%, transparent 50%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 4: Candle Light Breathing (Plate 12: Carrión & Plate 18: Dasmariñas) */}
        {(type === "candle_veteran" || type === "window_rain") && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 42% 58%, rgba(255, 180, 70, ${amberGlowIntensity * 0.18}) 0%, transparent 45%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 5: Window Rain Streaks (Plate 18) */}
        {type === "window_rain" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `repeating-linear-gradient(117deg, transparent, transparent 18px, rgba(200, 225, 245, 0.18) 19px, transparent 20px)`,
              backgroundPosition: `0px ${rainOffset}px`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 6: Winter Snow / Sleet Flurries (Plate 20: 26 Martyrs of Nagasaki) */}
        {type === "winter_snow" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `radial-gradient(circle, rgba(220, 238, 255, 0.45) 1.5px, transparent 2.5px)`,
              backgroundSize: "60px 60px",
              backgroundPosition: `${frame * 1.5}px ${snowOffset}px`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 7: Atmospheric Mist / Smoke Drift (Plates 03, 04, 05, 11, 14, 16) */}
        {(type === "ocean_mist" ||
          type === "river_mist" ||
          type === "harbor_pan" ||
          type === "jungle_haze" ||
          type === "gunsmoke_combat" ||
          type === "hearth_smoke") && (
          <>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "200%",
                height: "40%",
                background:
                  "linear-gradient(to top, rgba(18, 26, 38, 0.28) 0%, transparent 100%)",
                transform: `translateX(-${mistOffset1}px)`,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "5%",
                left: 0,
                width: "200%",
                height: "25%",
                background:
                  "radial-gradient(ellipse at center, rgba(160, 185, 210, 0.12) 0%, transparent 70%)",
                transform: `translateX(-${mistOffset2}px)`,
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* TYPE 8: Brazier Warmth Shift (Plate 19: Nagoya Castle) */}
        {type === "brazier_palace" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 80% 70%, rgba(255, 140, 30, ${amberGlowIntensity * 0.35}) 0%, transparent 50%)`,
              mixBlendMode: "color-dodge",
              pointerEvents: "none",
            }}
          />
        )}

        {/* TYPE 9: Twilight Surf Ripples (Plate 21: Closing River Mouth) */}
        {type === "twilight_surf" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(ellipse at 50% 90%, rgba(196, 142, 68, ${amberGlowIntensity * 0.25}) 0%, transparent 60%)`,
              mixBlendMode: "soft-light",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* SUBTLE NATURAL 1900s CORNER FALLOFF */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at center, transparent 65%, rgba(10, 15, 24, 0.18) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export const TheForgottenWarMasterSlideshow: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0B0E14",
        position: "relative",
      }}
    >
      {/* 🎙️ MASTER BROADCAST AUDIO TRACK (Cold-Case BOP Voice) */}
      <Audio
        src={staticFile("audio/the_forgotten_war_master_voiceover.wav")}
        volume={1.0}
      />

      {/* 🎬 21 SYNCHRONIZED DOCUMENTARY SCENES */}
      {SCENE_DEFINITIONS.map((scene, idx) => {
        const duration = scene.endFrame - scene.startFrame;
        return (
          <Sequence
            key={scene.id}
            from={scene.startFrame}
            durationInFrames={duration}
            name={`Plate ${scene.id}: ${scene.name}`}
          >
            <LivingStillPlate
              imgFile={scene.img}
              type={scene.type}
              durationInFrames={duration}
              isFirst={idx === 0}
            />
          </Sequence>
        );
      })}
    </div>
  );
};
