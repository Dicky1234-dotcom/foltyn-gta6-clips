import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Studio Color Palette: "Bad on Paper" Woodcut / Linen Engraving
const COLORS = {
  espresso: "#2A180A",
  darkWalnut: "#32150D",
  parchmentIvory: "#E2CEAD",
  parchmentBase: "#E0CCA9",
  burlapBorder: "#3A2A1E",
  inkStroke: "#191919",
  crimsonShoe: "#A81D1D",
  goldHolyOil: "#D4AF37",
};

// 4-frame jitter pose swap helper
const usePoseJitter = (frame: number, interval = 4) => {
  const step = Math.floor(frame / interval);
  const jitterX = ((step * 17) % 5) - 2;
  const jitterY = ((step * 23) % 5) - 2;
  const rot = (((step * 13) % 5) - 2) * 0.7;
  return { jitterX, jitterY, rot, step };
};

// Sub-component: Master Burlap & Parchment Backdrop with geometric tapestry border
export const MasterPaperStage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#18100A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "'Cinzel Decorative', 'Georgia', serif",
      }}
    >
      {/* Outer Burlap Border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(30,18,10,0.6) 0%, rgba(15,9,5,0.98) 100%), repeating-linear-gradient(45deg, #26160A 0px, #26160A 2px, #1D1007 2px, #1D1007 6px)",
          border: "28px solid #2A170B",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.85)",
        }}
      />

      {/* Decorative Tapestry Trim Line */}
      <div
        style={{
          position: "absolute",
          inset: 32,
          border: "2px dashed #E2CEAD",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      {/* Inner Aged Parchment Center Ground */}
      <div
        style={{
          position: "absolute",
          inset: 48,
          background:
            "radial-gradient(ellipse at center, #E5D2B3 20%, #D8BE95 70%, #BA9C72 100%)",
          boxShadow: "inset 0 0 100px rgba(45,25,12,0.65)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {/* Parchment Fine Crinkle Texture Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              "radial-gradient(#2A180A 0.75px, transparent 0.75px), radial-gradient(#2A180A 0.75px, #E5D2B3 0.75px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
            mixBlendMode: "multiply",
          }}
        />

        {children}
      </div>
    </AbsoluteFill>
  );
};

// Scene 1: Beat 01 - The Strasbourg Heat & Skyline (0–120 frames)
export const SceneStrasbourgHeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sunScale = interpolate(frame, [0, 120], [0.95, 1.15], {
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [0, 20, 100, 120], [0, 1, 1, 0]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Blazing Red Summer Sun */}
      <div
        style={{
          position: "absolute",
          top: "14%",
          width: 220,
          height: 220,
          borderRadius: "50%",
          backgroundColor: "#8C2210",
          transform: `scale(${sunScale})`,
          boxShadow: "0 0 60px rgba(140,34,16,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "4px dashed #E2CEAD",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Medieval Strasbourg Skyline Silhouette */}
      <svg
        viewBox="0 0 1200 400"
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "auto",
          fill: COLORS.darkWalnut,
        }}
      >
        {/* Gothic Spire and City Roofs */}
        <path d="M 0 400 L 0 320 L 80 290 L 130 330 L 220 270 L 320 330 L 450 180 L 480 30 L 510 180 L 620 310 L 750 250 L 850 330 L 980 280 L 1100 340 L 1200 300 L 1200 400 Z" />
        {/* Cathedral detail lines */}
        <line x1="480" y1="30" x2="480" y2="400" stroke="#E2CEAD" strokeWidth="3" opacity="0.4" />
        <line x1="465" y1="120" x2="495" y2="120" stroke="#E2CEAD" strokeWidth="2" opacity="0.4" />
      </svg>

      {/* Stitched Title Header */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          textAlign: "center",
          opacity: textOpacity,
        }}
      >
        <span
          style={{
            fontSize: 22,
            letterSpacing: 6,
            color: "#6B3A1A",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          July, 1518 • Holy Roman Empire
        </span>
        <h1
          style={{
            fontSize: 68,
            color: COLORS.espresso,
            margin: "8px 0",
            letterSpacing: 2,
            textShadow: "2px 2px 0px rgba(226,206,173,0.8)",
          }}
        >
          STRASBOURG
        </h1>
        <p
          style={{
            fontSize: 24,
            fontStyle: "italic",
            color: "#4A2711",
            maxWidth: 800,
          }}
        >
          "The summer heat hangs over the city like a held breath..."
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Beat 02–04 - Frau Troffea Solo Dance (120–270 frames)
export const SceneFrauTroffeaSolo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { jitterX, jitterY, step } = usePoseJitter(frame, 5);

  const zoom = interpolate(frame, [0, 80], [1.0, 1.45], {
    extrapolateRight: "clamp",
  });

  const poseIndex = step % 4; // 0, 1, 2, 3 toggle

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${zoom})`,
      }}
    >
      {/* Floor Cobblestones line */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          width: "90%",
          height: 4,
          backgroundColor: COLORS.espresso,
          opacity: 0.6,
        }}
      />

      {/* Frau Troffea Silhouette Puppet */}
      <div
        style={{
          position: "relative",
          width: 320,
          height: 480,
          transform: `translate(${jitterX}px, ${jitterY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg
          viewBox="0 0 200 320"
          style={{
            width: "100%",
            height: "100%",
            filter: "drop-shadow(0 8px 12px rgba(42,24,10,0.35))",
          }}
        >
          {/* Head & Wimple Hood */}
          <path
            d="M 80 45 C 70 20, 130 20, 120 45 C 135 60, 130 90, 115 95 L 85 95 C 70 90, 65 60, 80 45 Z"
            fill={COLORS.darkWalnut}
          />
          {/* Face profile cut */}
          <path
            d="M 98 48 Q 112 55 106 68 Q 116 72 104 80 L 98 84 Z"
            fill={COLORS.parchmentIvory}
          />

          {/* Torso & Bodice */}
          <path
            d="M 82 95 L 118 95 L 135 180 L 65 180 Z"
            fill={COLORS.darkWalnut}
          />
          {/* Engraved Apron & Lace Lines */}
          <path
            d="M 88 100 L 112 100 L 122 178 L 78 178 Z"
            fill="#221208"
            stroke={COLORS.parchmentIvory}
            strokeWidth="1.5"
          />

          {/* Pleated Skirt (Swirling in Dance) */}
          <path
            d={
              poseIndex % 2 === 0
                ? "M 65 180 Q 30 250 50 280 L 150 280 Q 170 250 135 180 Z"
                : "M 65 180 Q 40 250 65 280 L 165 280 Q 185 240 135 180 Z"
            }
            fill={COLORS.darkWalnut}
          />
          {/* Engraved fold lines on gown */}
          <line x1="85" y1="185" x2="80" y2="278" stroke={COLORS.parchmentIvory} strokeWidth="1.2" opacity="0.6" />
          <line x1="100" y1="185" x2="102" y2="278" stroke={COLORS.parchmentIvory} strokeWidth="1.2" opacity="0.6" />
          <line x1="115" y1="185" x2="125" y2="278" stroke={COLORS.parchmentIvory} strokeWidth="1.2" opacity="0.6" />

          {/* Arms (Pose A/B toggle) */}
          {poseIndex === 0 && (
            <path d="M 80 110 L 45 130 L 35 105 M 120 110 L 155 125 L 165 95" stroke={COLORS.darkWalnut} strokeWidth="14" strokeLinecap="round" fill="none" />
          )}
          {poseIndex === 1 && (
            <path d="M 80 110 L 40 90 L 50 60 M 120 110 L 160 140 L 140 170" stroke={COLORS.darkWalnut} strokeWidth="14" strokeLinecap="round" fill="none" />
          )}
          {poseIndex === 2 && (
            <path d="M 80 110 L 55 140 L 30 160 M 120 110 L 150 85 L 175 60" stroke={COLORS.darkWalnut} strokeWidth="14" strokeLinecap="round" fill="none" />
          )}
          {poseIndex === 3 && (
            <path d="M 80 110 L 45 80 L 65 50 M 120 110 L 150 95 L 170 70" stroke={COLORS.darkWalnut} strokeWidth="14" strokeLinecap="round" fill="none" />
          )}

          {/* Bleeding Feet on Cobblestones */}
          <circle cx="80" cy="290" r="5" fill="#8C1818" />
          <circle cx="120" cy="292" r="6" fill="#8C1818" />
        </svg>
      </div>

      {/* Caption Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          background: "rgba(35, 18, 9, 0.92)",
          padding: "10px 24px",
          border: `1px solid ${COLORS.parchmentIvory}`,
          borderRadius: 4,
          color: COLORS.parchmentIvory,
          fontSize: 20,
          fontStyle: "italic",
        }}
      >
        "No music. No celebration. Not one flicker of joy on her face."
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Beat 05–06 - The Wooden Stage & Council Madness (270–420 frames)
export const SceneTheStageAndBand: React.FC = () => {
  const frame = useCurrentFrame();
  const { jitterX, jitterY } = usePoseJitter(frame, 4);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Wooden Platform Stage */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: 820,
          height: 70,
          backgroundColor: "#3A1F10",
          borderTop: `6px solid ${COLORS.parchmentIvory}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {/* Banner hanging */}
        <span
          style={{
            color: COLORS.parchmentIvory,
            fontSize: 16,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          • STRASBOURG COUNCIL STAGE: RX MORE DANCING •
        </span>
      </div>

      {/* Characters on Stage: Piper + Councilman + Exhausted Dancers */}
      <div
        style={{
          position: "absolute",
          bottom: 190,
          display: "flex",
          gap: 60,
          alignItems: "flex-end",
          transform: `translate(${jitterX}px, ${jitterY}px)`,
        }}
      >
        {/* Piper */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 90,
              height: 220,
              background: COLORS.darkWalnut,
              borderRadius: "45px 45px 0 0",
              position: "relative",
            }}
          >
            {/* Pipe Instrument */}
            <div
              style={{
                position: "absolute",
                top: 45,
                right: -25,
                width: 50,
                height: 8,
                backgroundColor: COLORS.parchmentIvory,
                transform: "rotate(-15deg)",
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: COLORS.espresso, fontWeight: "bold" }}>
            Hired Piper
          </span>
        </div>

        {/* Dancers in Trance */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 110,
              height: 250,
              background: "#1E0E06",
              borderRadius: "55px 55px 0 0",
              border: `2px dashed ${COLORS.parchmentIvory}`,
            }}
          />
          <span style={{ fontSize: 13, color: "#8C1818", fontWeight: "bold" }}>
            +400 Dancers
          </span>
        </div>

        {/* Panicked Alderman */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 100,
              height: 230,
              background: COLORS.darkWalnut,
              borderRadius: "50px 50px 0 0",
            }}
          />
          <span style={{ fontSize: 13, color: COLORS.espresso, fontWeight: "bold" }}>
            City Alderman
          </span>
        </div>
      </div>

      {/* Red Ban Stamp overlay */}
      {frame > 60 && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            transform: "rotate(-12deg) scale(1.1)",
            border: "8px solid #991B1B",
            padding: "16px 40px",
            color: "#991B1B",
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: 6,
            textTransform: "uppercase",
            borderRadius: 8,
            backgroundColor: "rgba(229, 210, 179, 0.85)",
          }}
        >
          STAGES TORN DOWN!
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 4: Beat 12–15 - The Consecrated Red Shoes & Shrine of Saint Vitus (420–570 frames)
export const SceneSaintVitusShoes: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          position: "absolute",
          top: "14%",
          fontSize: 36,
          color: COLORS.espresso,
          letterSpacing: 3,
        }}
      >
        SHRINE OF SAINT VITUS • SAVERNE
      </h2>

      {/* Shrine Grotto Arch */}
      <div
        style={{
          width: 380,
          height: 380,
          border: `6px solid ${COLORS.darkWalnut}`,
          borderRadius: "190px 190px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(42, 24, 10, 0.08)",
          boxShadow: "inset 0 0 50px rgba(42,24,10,0.2)",
        }}
      >
        {/* The Consecrated Red Leather Shoes with Gold Crosses */}
        <div style={{ display: "flex", gap: 30, marginBottom: 20 }}>
          {/* Left Shoe */}
          <div
            style={{
              width: 90,
              height: 48,
              backgroundColor: COLORS.crimsonShoe,
              borderRadius: "15px 40px 15px 15px",
              position: "relative",
              border: `2px solid ${COLORS.goldHolyOil}`,
              boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Golden Oil Cross */}
            <div style={{ color: COLORS.goldHolyOil, fontSize: 24, fontWeight: "bold" }}>
              ✝
            </div>
          </div>

          {/* Right Shoe */}
          <div
            style={{
              width: 90,
              height: 48,
              backgroundColor: COLORS.crimsonShoe,
              borderRadius: "40px 15px 15px 15px",
              position: "relative",
              border: `2px solid ${COLORS.goldHolyOil}`,
              boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Golden Oil Cross */}
            <div style={{ color: COLORS.goldHolyOil, fontSize: 24, fontWeight: "bold" }}>
              ✝
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: 18,
            color: COLORS.espresso,
            fontStyle: "italic",
            maxWidth: 280,
            textAlign: "center",
          }}
        >
          Red shoes anointed with holy oil. Small wooden crosses in their hands.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Beat 18+ - Scientific Mystery & The Autopsy (570–720 frames)
export const SceneAutopsyOfMystery: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          position: "absolute",
          top: "12%",
          fontSize: 38,
          color: COLORS.espresso,
          letterSpacing: 3,
        }}
      >
        WHAT REALLY CAUSED IT?
      </h2>

      {/* 3 Hypotheses Cards */}
      <div
        style={{
          display: "flex",
          gap: 24,
          maxWidth: 1000,
        }}
      >
        {/* Card 1: Ergotism */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(42, 24, 10, 0.08)",
            border: `2px solid ${COLORS.darkWalnut}`,
            padding: 24,
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌾 ❌</div>
          <h3 style={{ fontSize: 20, color: COLORS.darkWalnut }}>1. Ergotism</h3>
          <p style={{ fontSize: 14, color: "#4A2711", marginTop: 8 }}>
            Rye mold causes hallucinations, but restricts blood flow to limbs.
            Dancing for days is medically impossible.
          </p>
        </div>

        {/* Card 2: Sydenham's Chorea */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(42, 24, 10, 0.08)",
            border: `2px solid ${COLORS.darkWalnut}`,
            padding: 24,
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡ ❌</div>
          <h3 style={{ fontSize: 20, color: COLORS.darkWalnut }}>2. Chorea</h3>
          <p style={{ fontSize: 14, color: "#4A2711", marginTop: 8 }}>
            Causes brief jerky twitches and tremors, not sustained rhythmic
            choreography over weeks.
          </p>
        </div>

        {/* Card 3: Mass Psychogenic Illness */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(42, 24, 10, 0.16)",
            border: "3px solid #8C2210",
            padding: 24,
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧠 ✅</div>
          <h3 style={{ fontSize: 20, color: "#8C2210" }}>3. Mass Hysteria</h3>
          <p style={{ fontSize: 14, color: "#32150D", marginTop: 8, fontWeight: "bold" }}>
            Extreme famine, terror of Saint Vitus' wrath, and dissociative
            trance state spreading across the populace.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Master Composition Combining All Sequences
export const DancingPlagueMasterComposition: React.FC = () => {
  return (
    <MasterPaperStage>
      {/* 0–120: Strasbourg Skyline & Heat */}
      <Sequence from={0} durationInFrames={150}>
        <SceneStrasbourgHeat />
      </Sequence>

      {/* 150–330: Frau Troffea Solo Dance */}
      <Sequence from={150} durationInFrames={180}>
        <SceneFrauTroffeaSolo />
      </Sequence>

      {/* 330–510: Council Platform Stage & Musicians */}
      <Sequence from={330} durationInFrames={180}>
        <SceneTheStageAndBand />
      </Sequence>

      {/* 510–660: Saint Vitus Shrine & Consecrated Red Shoes */}
      <Sequence from={510} durationInFrames={150}>
        <SceneSaintVitusShoes />
      </Sequence>

      {/* 660–810: Scientific Theories / Mass Psychogenic Illness */}
      <Sequence from={660} durationInFrames={150}>
        <SceneAutopsyOfMystery />
      </Sequence>
    </MasterPaperStage>
  );
};
