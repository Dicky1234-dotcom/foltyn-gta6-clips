import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

// --- LIVING STILL SHOT INTERFACE ---
export interface LivingStillShot {
  id: string;
  durationInFrames: number; // Exactly 120 frames (4.0s @ 30fps)
  bgImage: string;
  bgScale: [number, number]; // [startScale, endScale]
  bgTranslateY?: [number, number]; // [startTranslateY, endTranslateY] in %
  bgTranslateX?: [number, number]; // [startTranslateX, endTranslateX] in %
  transformOrigin?: string; // Precise visual focal point
  character?: {
    image: string;
    width: number | string;
    bottom: number | string;
    left?: number | string;
    right?: number | string;
    scale?: number;
    anchor?: string;
  };
  marginalia?: string;
  weather?: "dust" | "snow" | "heat" | "fog" | "none";
  flickerIntensity?: number;
  sfx?: string;
  sfxVolume?: number;
}

// --- ATMOSPHERIC PARTICLES COMPONENT (CODE-DRIVEN FX) ---
const ProceduralAtmosphere: React.FC<{ type: "dust" | "snow" | "heat" | "fog" | "none"; frame: number }> = ({
  type,
  frame,
}) => {
  if (type === "none") return null;

  if (type === "dust") {
    const particles = Array.from({ length: 24 }).map((_, i) => {
      const seed = i * 47.13;
      const x = ((seed * 19.3 + frame * 0.45) % 1920);
      const y = ((seed * 29.7 + Math.sin(frame * 0.02 + seed) * 40) % 1080);
      const opacity = (Math.sin(frame * 0.05 + seed) * 0.35 + 0.45) * 0.6;
      const size = 2 + (i % 3) * 1.5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: "#EDE0C8",
            opacity,
            filter: "blur(0.5px)",
            pointerEvents: "none",
          }}
        />
      );
    });
    return <AbsoluteFill style={{ pointerEvents: "none" }}>{particles}</AbsoluteFill>;
  }

  if (type === "snow") {
    const flakes = Array.from({ length: 35 }).map((_, i) => {
      const seed = i * 73.19;
      const x = ((seed * 23.4 + frame * 2.8) % 2100) - 100;
      const y = ((seed * 17.8 + frame * 4.2) % 1200) - 50;
      const size = 2 + (i % 4) * 1.5;
      const opacity = 0.4 + (i % 5) * 0.12;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size * 2.2,
            transform: "rotate(27deg)",
            backgroundColor: "#E2F0F7",
            opacity,
            borderRadius: "1px",
            filter: "blur(0.4px)",
            pointerEvents: "none",
          }}
        />
      );
    });
    return <AbsoluteFill style={{ pointerEvents: "none" }}>{flakes}</AbsoluteFill>;
  }

  return null;
};

// --- SINGLE LIVING STILL CUT COMPONENT ---
export const LivingStillCut: React.FC<{ shot: LivingStillShot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const d = shot.durationInFrames;

  // 1. DISSOLVE TRANSITIONS (4 frames in, 4 frames out)
  const fadeIn = interpolate(frame, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [d - 4, d], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cutOpacity = Math.min(fadeIn, fadeOut);

  // 2. CAMERA PUSH / DOLLY ON BACKGROUND (0.35x Multiplane Parallax)
  const bgScale = interpolate(frame, [0, d], [shot.bgScale[0], shot.bgScale[1]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgTransY = shot.bgTranslateY
    ? interpolate(frame, [0, d], [shot.bgTranslateY[0], shot.bgTranslateY[1]])
    : 0;

  const bgTransX = shot.bgTranslateX
    ? interpolate(frame, [0, d], [shot.bgTranslateX[0], shot.bgTranslateX[1]])
    : 0;

  // 3. CODE-DRIVEN LIGHTING / FLICKER
  const flicker = shot.flickerIntensity
    ? Math.sin(frame * 0.45) * 0.04 * shot.flickerIntensity +
      Math.sin(frame * 1.2) * 0.02 * shot.flickerIntensity
    : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0F1115",
        opacity: cutOpacity,
        overflow: "hidden",
      }}
    >
      {/* SHOT SPECIFIC SFX DROP */}
      {shot.sfx && (
        <Audio
          src={staticFile(shot.sfx)}
          volume={shot.sfxVolume ?? 0.5}
        />
      )}

      {/* --- LAYER 1: CLEAN BACKGROUND SCENIC PLATE (0.35x Parallax Depth) --- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: `scale(${bgScale}) translate(${bgTransX}%, ${bgTransY}%)`,
          transformOrigin: shot.transformOrigin || "center center",
          willChange: "transform",
        }}
      >
        <img
          src={staticFile(shot.bgImage)}
          alt="Living Still Background"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: `brightness(${1.0 + flicker})`,
          }}
        />
      </div>

      {/* --- LAYER 2: STATIC CUTOUT CHARACTER (1.0x Depth - 100% STATIC, NO BREATHING) --- */}
      {shot.character && (
        <div
          style={{
            position: "absolute",
            bottom: shot.character.bottom,
            left: shot.character.left ?? "auto",
            right: shot.character.right ?? "auto",
            width: shot.character.width,
            transformOrigin: shot.character.anchor || "bottom center",
            transform: `scale(${shot.character.scale ?? 1.0})`,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <img
            src={staticFile(shot.character.image)}
            alt="Character Cutout"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              filter: `drop-shadow(0 15px 25px rgba(0, 0, 0, 0.45)) brightness(${1.0 + flicker * 0.6})`,
            }}
          />
        </div>
      )}

      {/* --- LAYER 3: PROCEDURAL ATMOSPHERE (Dust / Snow in Code) --- */}
      <ProceduralAtmosphere type={shot.weather || "none"} frame={frame} />

      {/* --- LAYER 4: OPTICAL VIGNETTE (Preserves Gouache Detail with 65% Falloff) --- */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0) 40%, rgba(12, 10, 8, 0.45) 82%, rgba(6, 5, 4, 0.65) 100%)",
          mixBlendMode: "multiply",
          pointerEvents: "none",
          zIndex: 20,
        }}
      />

      {/* --- LAYER 5: ARCHIVAL FILM GRAIN & VELLUM TEXTURE BINDING --- */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle, rgba(237, 232, 222, 0.04) 0%, rgba(20, 18, 15, 0.08) 100%)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
          zIndex: 25,
        }}
      />

      {/* --- LAYER 6: AUTHORITATIVE MARGINALIA CALLOUT (Top-Left Parchment) --- */}
      {shot.marginalia && (
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 56,
            zIndex: 30,
            padding: "8px 16px",
            backgroundColor: "rgba(237, 232, 222, 0.88)",
            border: "2px solid #1A1A1A",
            boxShadow: "3px 4px 0px #1A1A1A",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: "bold",
            fontSize: "14px",
            letterSpacing: "1.8px",
            color: "#1A1A1A",
            textTransform: "uppercase",
          }}
        >
          {shot.marginalia}
        </div>
      )}
    </AbsoluteFill>
  );
};

// --- MASTER 4.0-SECOND LIVING STILLS SEQUENCE ---
// 26 Cuts across 13 Scenes with precise narrative visual focal points
export const MASTER_LIVING_STILLS_SHOTS: LivingStillShot[] = [
  // --- SCENE 1: THE SUN-BLEACHED ROAD (Cuts S1A, S1B, S1C) ---
  {
    id: "S1A_Road_Wide",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-01 Sun-Bleached Road of France.jpg",
    bgScale: [1.0, 1.05],
    transformOrigin: "50% 55%", // Focus on the vanishing dirt road horizon
    weather: "dust",
    marginalia: "SUMMER 1212 // KINGDOM OF FRANCE",
    sfx: "childrens_crusade/audio/sfx/sfx_boots_frozen_mud_crunch.mp3",
    sfxVolume: 0.3,
  },
  {
    id: "S1B_Road_Macro_Dust",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-01 Sun-Bleached Road of France.jpg",
    bgScale: [1.45, 1.52],
    transformOrigin: "50% 88%", // Tight focus on baked road gravel and calloused footstep trail
    weather: "dust",
    marginalia: "FOOTSTEPS SOUTH",
    sfx: "childrens_crusade/audio/sfx/sfx_boots_frozen_mud_crunch.mp3",
    sfxVolume: 0.5,
  },
  {
    id: "S1C_Road_Horizon_Tilt",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-01 Sun-Bleached Road of France.jpg",
    bgScale: [1.12, 1.05],
    bgTranslateY: [-3, 0],
    transformOrigin: "50% 28%", // Crane tilt up to the distant sky and marching column
    weather: "dust",
    marginalia: "THE ENDLESS COLUMN",
  },

  // --- SCENE 2: DESERTED FIELD & PLOW (Cuts S2A, S2B, S2C) ---
  {
    id: "S2A_Field_Plow_Wide",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-02 Deserted French Peasant Field & Village.jpg",
    bgScale: [1.0, 1.03],
    transformOrigin: "22% 55%", // Focus on the wooden plow and farmer in furrow
    character: {
      image: "childrens_crusade/cutouts/CH-03_French_Peasant_Commoners_&_Household/pose_1.png",
      width: 350,
      bottom: "16%",
      left: "14%",
      scale: 0.95,
    },
    weather: "dust",
    marginalia: "ABANDONED FIELDS",
    sfx: "childrens_crusade/audio/sfx/sfx_winter_steppe_wind_howl.mp3",
    sfxVolume: 0.25,
  },
  {
    id: "S2B_Peasant_Portrait_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-02 Deserted French Peasant Field & Village.jpg",
    bgScale: [1.42, 1.48],
    transformOrigin: "28% 38%", // Punch directly into the peasant's hollow trance-like eyes
    character: {
      image: "childrens_crusade/cutouts/CH-03_French_Peasant_Commoners_&_Household/pose_1.png",
      width: 680,
      bottom: "-6%",
      left: "8%",
      scale: 1.35,
    },
    weather: "dust",
    marginalia: "THE TRANCE",
  },
  {
    id: "S2C_Peasant_Household_WalkOff",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-02 Deserted French Peasant Field & Village.jpg",
    bgScale: [1.1, 1.05],
    transformOrigin: "72% 55%", // Focus on the handles of the plow dropping to the earth
    character: {
      image: "childrens_crusade/cutouts/CH-03_French_Peasant_Commoners_&_Household/pose_2.png",
      width: 500,
      bottom: "14%",
      right: "18%",
      scale: 1.0,
    },
    weather: "dust",
    marginalia: "DROPPING THE PLOW",
    sfx: "childrens_crusade/audio/sfx/sfx_sub_bass_concussion_drop.wav",
    sfxVolume: 0.4,
  },

  // --- SCENE 3: WOODEN CROSSES & CONVICTION (Cuts S3A, S3B) ---
  {
    id: "S3A_Pilgrims_Crosses_Wide",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-01 Sun-Bleached Road of France.jpg",
    bgScale: [1.02, 1.06],
    transformOrigin: "42% 45%", // Focus on the rough-hewn wooden crosses held aloft
    character: {
      image: "childrens_crusade/cutouts/CH-04_The_True_Social_Demographic_Lineup/pose_2.png",
      width: 440,
      bottom: "8%",
      left: "30%",
      scale: 1.0,
    },
    weather: "dust",
    marginalia: "UNSHAKABLE CONVICTION",
  },
  {
    id: "S3B_Pilgrims_Youth_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-01 Sun-Bleached Road of France.jpg",
    bgScale: [1.4, 1.46],
    transformOrigin: "45% 55%", // Punch into white-knuckled fingers and hemp-bound cross
    character: {
      image: "childrens_crusade/cutouts/CH-04_The_True_Social_Demographic_Lineup/pose_3.png",
      width: 620,
      bottom: "-10%",
      left: "26%",
      scale: 1.35,
    },
    weather: "dust",
    marginalia: "BOUND WITH HEMP CORD",
  },

  // --- SCENE 9: 1187 BATTLE OF HATTIN (Cuts S9A, S9B) ---
  {
    id: "S9A_Hattin_Desert_Carnage",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-03 Horns of Hattin Desert Plain.jpg",
    bgScale: [1.0, 1.05],
    transformOrigin: "65% 50%", // Focus on the jagged volcanic horns and broken spearlines
    weather: "dust",
    marginalia: "1187 // BATTLE OF HATTIN",
  },
  {
    id: "S9B_Hattin_Lost_Relic_Macro",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-03 Horns of Hattin Desert Plain.jpg",
    bgScale: [1.45, 1.52],
    transformOrigin: "58% 75%", // Downward drop into sand where the True Cross fell
    weather: "dust",
    marginalia: "THE TRUE CROSS LOST",
    sfx: "childrens_crusade/audio/sfx/sfx_sub_bass_concussion_drop.wav",
    sfxVolume: 0.6,
  },

  // --- SCENE 11: 1204 SACK OF CONSTANTINOPLE (Cuts S11A, S11B) ---
  {
    id: "S11A_Constantinople_Harbor",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-04 Constantinople Harbor & City.jpg",
    bgScale: [1.0, 1.04],
    transformOrigin: "50% 40%", // Establish the golden Byzantine dome skyline
    weather: "dust",
    marginalia: "1204 // FOURTH CRUSADE",
  },
  {
    id: "S11B_Constantinople_Domes_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-04 Constantinople Harbor & City.jpg",
    bgScale: [1.4, 1.46],
    transformOrigin: "48% 35%", // Macro zoom on burning rooftops and falling crosses
    weather: "dust",
    marginalia: "MORAL CATASTROPHE",
  },

  // --- SCENE 12: RELIGIOUS PANIC IN THE STREETS (Cuts S12A, S12B) ---
  {
    id: "S12A_Medieval_Street_Panic",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-05 Claustrophobic Medieval Stone Street.jpg",
    bgScale: [1.0, 1.05],
    transformOrigin: "50% 50%", // Vanishing corridor of the claustrophobic alley
    weather: "dust",
    marginalia: "SPRING 1212 // MASS HYSTERIA",
  },
  {
    id: "S12B_Street_Shadows_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-05 Claustrophobic Medieval Stone Street.jpg",
    bgScale: [1.42, 1.48],
    transformOrigin: "52% 42%", // Punch into dark second-story overhangs
    weather: "dust",
    marginalia: "THE FEVER DREAM",
  },

  // --- SCENE 16-17: STEPHEN OF CLOYES (Cuts S16A, S16B, S17A) ---
  {
    id: "S16A_Cloyes_Pastoral_Valley",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-06 French Pastoral Valley at Cloyes.jpg",
    bgScale: [1.0, 1.03],
    transformOrigin: "28% 45%", // Focus on the boy shepherd standing with wooden crook
    character: {
      image: "childrens_crusade/cutouts/CH-01_Stephen_of_Cloyes/pose_1.png",
      width: 390,
      bottom: "10%",
      left: "24%",
      scale: 0.95,
    },
    weather: "dust",
    marginalia: "CLOYES-SUR-LE-LOIR // JUNE 1212",
  },
  {
    id: "S16B_Stephen_Portrait_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-06 French Pastoral Valley at Cloyes.jpg",
    bgScale: [1.42, 1.48],
    transformOrigin: "32% 34%", // Direct punch on Stephen's 12-year-old face and wide eyes
    character: {
      image: "childrens_crusade/cutouts/CH-01_Stephen_of_Cloyes/pose_1.png",
      width: 740,
      bottom: "-14%",
      left: "14%",
      scale: 1.35,
    },
    weather: "dust",
    marginalia: "THE 12-YEAR-OLD SHEPHERD",
  },
  {
    id: "S17A_Stephen_Vision_Letter",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-06 French Pastoral Valley at Cloyes.jpg",
    bgScale: [1.12, 1.06],
    transformOrigin: "72% 52%", // Focus on Stephen's dirt-streaked hand holding the sealed letter
    character: {
      image: "childrens_crusade/cutouts/CH-01_Stephen_of_Cloyes/pose_2.png",
      width: 480,
      bottom: "10%",
      right: "22%",
      scale: 1.0,
    },
    weather: "dust",
    marginalia: "THE SEALED LETTER",
  },

  // --- SCENE 23: KING PHILIP II AT SAINT-DENIS (Cuts S23A, S23B) ---
  {
    id: "S23A_Saint_Denis_Gothic_Hall",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-07 Royal Audience Hall of Saint-Denis.jpg",
    bgScale: [1.0, 1.03],
    transformOrigin: "36% 45%", // Majestic perspective on the Gothic stone throne
    character: {
      image: "childrens_crusade/cutouts/CH-05_King_Philip_II_of_France_&_Paris_Theologians/pose_1.png",
      width: 540,
      bottom: "6%",
      left: "30%",
      scale: 1.0,
    },
    marginalia: "SAINT-DENIS // JULY 1212",
  },
  {
    id: "S23B_King_Philip_Eyes_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-07 Royal Audience Hall of Saint-Denis.jpg",
    bgScale: [1.45, 1.5],
    transformOrigin: "40% 38%", // Punch directly into Philip's cynical unblinking eyes
    character: {
      image: "childrens_crusade/cutouts/CH-05_King_Philip_II_of_France_&_Paris_Theologians/pose_1.png",
      width: 950,
      bottom: "-32%",
      left: "18%",
      scale: 1.5,
    },
    marginalia: "THE ROYAL DISMISSAL",
  },

  // --- SCENE 25-28: NICHOLAS OF COLOGNE (Cuts S25A, S25B) ---
  {
    id: "S25A_Cologne_Cathedral_Square",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-08 Cologne Cathedral Public Square.jpg",
    bgScale: [1.0, 1.04],
    transformOrigin: "32% 48%", // Spires of Cologne cathedral and Nicholas preaching
    character: {
      image: "childrens_crusade/cutouts/CH-02_Nicholas_of_Cologne/pose_1.png",
      width: 620,
      bottom: "4%",
      left: "26%",
      scale: 1.0,
    },
    weather: "dust",
    marginalia: "COLOGNE // JULY 1212",
  },
  {
    id: "S25B_Nicholas_Tau_Cross_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-08 Cologne Cathedral Public Square.jpg",
    bgScale: [1.4, 1.46],
    transformOrigin: "36% 40%", // Tight focus on the Tau-cross symbol held in Nicholas's hand
    character: {
      image: "childrens_crusade/cutouts/CH-02_Nicholas_of_Cologne/pose_1.png",
      width: 1020,
      bottom: "-30%",
      left: "14%",
      scale: 1.45,
    },
    weather: "dust",
    marginalia: "THE TAU CROSS",
  },

  // --- SCENE 29-30: THE SWISS ALPS ASCENT & PASS (Cuts S29A, S30A) ---
  {
    id: "S29A_Swiss_Alps_Wall",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-09 The Towering Wall of the Swiss Alps.jpg",
    bgScale: [1.0, 1.05],
    transformOrigin: "50% 30%", // Glacial summit ridge line
    weather: "snow",
    marginalia: "THE ALPS // AUGUST 1212",
    sfx: "childrens_crusade/audio/sfx/sfx_winter_steppe_wind_howl.mp3",
    sfxVolume: 0.5,
  },
  {
    id: "S30A_Alpine_Pass_Trail",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-10 High Alpine Mountain Pass Trail.jpg",
    bgScale: [1.02, 1.06],
    transformOrigin: "50% 60%", // Precarious ledge trail descending into Italy
    weather: "snow",
    marginalia: "TREACHEROUS PASS",
    sfx: "childrens_crusade/audio/sfx/sfx_winter_steppe_wind_howl.mp3",
    sfxVolume: 0.6,
  },

  // --- SCENE 32-34: ARRIVAL AT GENOA (Cuts S32A, S32B) ---
  {
    id: "S32A_Genoa_Harbor_Wide",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-11 Stone Harbor of Genoa.jpg",
    bgScale: [1.0, 1.04],
    transformOrigin: "50% 55%", // Stone quay looking across the harbor
    marginalia: "GENOA // AUGUST 25, 1212",
  },
  {
    id: "S32B_Genoa_Water_Macro",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-11 Stone Harbor of Genoa.jpg",
    bgScale: [1.38, 1.44],
    transformOrigin: "50% 72%", // Macro hold on the placid, unparted waterline
    marginalia: "THE SEA WOULD NOT PART",
    sfx: "childrens_crusade/audio/sfx/sfx_sub_bass_concussion_drop.wav",
    sfxVolume: 0.45,
  },

  // --- SCENE 38: POPE INNOCENT III IN ROME (Cuts S38A, S38B) ---
  {
    id: "S38A_Pope_Innocent_Enthroned",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-07 Royal Audience Hall of Saint-Denis.jpg",
    bgScale: [1.0, 1.04],
    transformOrigin: "35% 45%", // Pope enthroned in the Lateran
    character: {
      image: "childrens_crusade/cutouts/CH-06_Pope_Innocent_III_(Rome)/pose_2.png",
      width: 620,
      bottom: "6%",
      left: "26%",
      scale: 1.0,
    },
    marginalia: "ROME // THE LATERAN // 1212",
  },
  {
    id: "S38B_Pope_Innocent_Portrait_PunchIn",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-07 Royal Audience Hall of Saint-Denis.jpg",
    bgScale: [1.42, 1.48],
    transformOrigin: "38% 36%", // Macro punch-in on Pope Innocent's papal tiara and piercing gaze
    character: {
      image: "childrens_crusade/cutouts/CH-06_Pope_Innocent_III_(Rome)/pose_1.png",
      width: 860,
      bottom: "-22%",
      left: "18%",
      scale: 1.35,
    },
    marginalia: "THEY PUT US TO SHAME",
  },

  // --- SCENE 45: MONK ALBERIC'S SCRIPTORIUM (Cut S45A) ---
  {
    id: "S45A_Scriptorium_Desk",
    durationInFrames: 120, // 4.0s
    bgImage: "childrens_crusade/backgrounds/BG-12 Monk Alberic's Scriptorium Desk.jpg",
    bgScale: [1.0, 1.05],
    transformOrigin: "52% 58%", // Tight anchor on the ink pot and vellum chronicle page
    marginalia: "TROIS-FONTAINES // C. 1250",
    sfx: "childrens_crusade/audio/sfx/sfx_film_shutter_transition.wav",
    sfxVolume: 0.35,
  },
];

export const ChildrensCrusadeLivingStills: React.FC = () => {
  let accumulatedFrames = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0E14" }}>
      {/* 🎵 CINEMATIC INVESTIGATIVE THEME & DRONE BED (CONTINUOUS) */}
      <Audio
        src={staticFile("childrens_crusade/audio/sfx/cold_case_investigative_theme.wav")}
        volume={0.35}
        loop
      />
      <Audio
        src={staticFile("childrens_crusade/audio/sfx/sfx_investigative_drone_bed.wav")}
        volume={0.25}
        loop
      />

      {/* 🎙️ MASTER COLD-CASE VOICEOVER (CHARON 24kHz STUDIO PCM) */}
      <Audio
        src={staticFile("childrens_crusade/audio/master_voiceover.wav")}
        volume={1.0}
      />

      {/* 🎬 26 LIVING STILL CUTS */}
      {MASTER_LIVING_STILLS_SHOTS.map((shot) => {
        const fromFrame = accumulatedFrames;
        accumulatedFrames += shot.durationInFrames;
        return (
          <Sequence
            key={shot.id}
            from={fromFrame}
            durationInFrames={shot.durationInFrames}
            name={shot.id}
          >
            <LivingStillCut shot={shot} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
