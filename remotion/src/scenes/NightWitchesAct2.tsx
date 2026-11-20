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

// =========================================================================
// GLOBAL ARCHIVAL GRADE & VIGNETTE
// =========================================================================
const ArchivalGrade: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        boxShadow: "inset 0 0 140px rgba(43, 31, 20, 0.45)",
        mixBlendMode: "multiply",
      }}
    />
  );
};

// =========================================================================
// HELPER: BROWN INK TACTICAL PINCER (HAND-DRAWN GOUACHE INK WASH)
// =========================================================================
interface BrownInkPincerProps {
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
  progress: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
}

const BrownInkPincer: React.FC<BrownInkPincerProps> = ({
  startX,
  startY,
  ctrlX,
  ctrlY,
  endX,
  endY,
  progress,
  strokeWidth = 13,
  label,
  subLabel,
}) => {
  if (progress <= 0.02) return null;

  const t = Math.min(1, Math.max(0, progress));
  const oneMinusT = 1 - t;
  const currentX =
    oneMinusT * oneMinusT * startX +
    2 * oneMinusT * t * ctrlX +
    t * t * endX;
  const currentY =
    oneMinusT * oneMinusT * startY +
    2 * oneMinusT * t * ctrlY +
    t * t * endY;

  const dx = 2 * (1 - t) * (ctrlX - startX) + 2 * t * (endX - ctrlX);
  const dy = 2 * (1 - t) * (ctrlY - startY) + 2 * t * (endY - ctrlY);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  const subCtrlX = oneMinusT * startX + t * ctrlX;
  const subCtrlY = oneMinusT * startY + t * ctrlY;

  return (
    <g filter="drop-shadow(0 3px 6px rgba(43, 29, 18, 0.4))">
      {/* Outer Brown Ink Border */}
      <path
        d={`M ${startX} ${startY} Q ${subCtrlX} ${subCtrlY}, ${currentX} ${currentY}`}
        fill="none"
        stroke="#2E170F"
        strokeWidth={strokeWidth + 4}
        strokeLinecap="round"
      />
      {/* Hand-Painted Crimson-Sepia Ink Wash Body */}
      <path
        d={`M ${startX} ${startY} Q ${subCtrlX} ${subCtrlY}, ${currentX} ${currentY}`}
        fill="none"
        stroke="#8C2518"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Hand-Drawn Chevron Arrowhead */}
      <g transform={`translate(${currentX}, ${currentY}) rotate(${angleDeg})`}>
        <polygon
          points="0,0 -24,-13 -18,0 -24,13"
          fill="#8C2518"
          stroke="#2E170F"
          strokeWidth="2.5"
        />
      </g>
      {/* Calligraphic Division Label */}
      {label && progress > 0.35 && (
        <g transform={`translate(${(startX + currentX) / 2}, ${(startY + currentY) / 2 - 14})`}>
          <text
            x="0"
            y="0"
            fill="#2C1B10"
            fontSize="14"
            fontWeight="900"
            fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
            textAnchor="middle"
            letterSpacing="1"
          >
            {label}
          </text>
          {subLabel && (
            <text
              x="0"
              y="13"
              fill="#5A3E26"
              fontSize="10"
              fontWeight="700"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {subLabel}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

// =========================================================================
// SCENE 01: RICH BROWN INK ON ARCHIVAL PARCHMENT MAP (BARBAROSSA)
// 0:00 - 0:22 (Frames 0 - 660)
// =========================================================================
const BrownInkParchmentMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Whip-pan camera entrance transition (Frames 0 to 35)
  const panX = interpolate(frame, [0, 35], [1920, 0], {
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 4),
  });
  const blurVal = interpolate(frame, [0, 20, 35], [15, 6, 0], {
    extrapolateRight: "clamp",
  });

  // Slow, cinematic 2.5D map camera drift
  const camScale = interpolate(frame, [35, 660], [1.02, 1.12], {
    extrapolateRight: "clamp",
  });
  const camX = interpolate(frame, [35, 660], [0, -55], {
    extrapolateRight: "clamp",
  });
  const camY = interpolate(frame, [35, 660], [0, -25], {
    extrapolateRight: "clamp",
  });

  // Pincer Attack Progress (0.0 to 1.0)
  const pincerNorthProg = interpolate(frame, [50, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pincerCenterProg = interpolate(frame, [65, 330], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pincerSouthProg = interpolate(frame, [80, 350], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Frontline dynamic shift eastward
  const frontShift = interpolate(frame, [100, 380], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Air Loss Alert Card Entrance (Frame 360)
  const alertSpring = spring({
    frame: frame - 360,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
  });
  const alertTranslateY = interpolate(alertSpring, [0, 1], [-80, 0]);
  const alertOpacity = interpolate(alertSpring, [0, 1], [0, 1]);

  // Rolling casualty counter for aircraft losses
  const aircraftLossCount = Math.round(
    interpolate(frame, [380, 480], [0, 2000], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#EDE4D0",
        transform: `translateX(${panX}px)`,
        filter: blurVal > 0 ? `blur(${blurVal}px)` : "none",
        overflow: "hidden",
      }}
    >
      {/* 2.5D PERSPECTIVE WRAPPER (18° Tilt) */}
      <div
        style={{
          position: "absolute",
          width: 2200,
          height: 1400,
          left: -140,
          top: -160,
          perspective: 1200,
          perspectiveOrigin: "50% 45%",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: `rotateX(18deg) rotateZ(-1.2deg) scale(${camScale}) translate(${camX}px, ${camY}px)`,
            transformOrigin: "center center",
            boxShadow: "0 40px 100px rgba(43, 31, 20, 0.75)",
          }}
        >
          {/* ARCHIVAL PARCHMENT TEXTURE BASE */}
          <Img
            src={staticFile("night_witches/parchment_paper_texture.jpg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* SVG HAND-DRAWN BROWN INK CARTOGRAPHY */}
          <svg
            width="2200"
            height="1400"
            viewBox="0 0 2200 1400"
            style={{ position: "absolute", inset: 0 }}
          >
            <defs>
              {/* Antique Latitude/Longitude Grid Pattern */}
              <pattern
                id="parchmentGrid"
                width="160"
                height="160"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="160"
                  y2="0"
                  stroke="#8C7355"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                  opacity="0.30"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="160"
                  stroke="#8C7355"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                  opacity="0.30"
                />
              </pattern>
            </defs>

            {/* Faint Cartographic Grid */}
            <rect width="2200" height="1400" fill="url(#parchmentGrid)" />

            {/* Antique Double-Rule Outer Frame with Corner Rosettes */}
            <rect
              x="50"
              y="50"
              width="2100"
              height="1300"
              fill="none"
              stroke="#3D2817"
              strokeWidth="4"
            />
            <rect
              x="62"
              y="62"
              width="2076"
              height="1276"
              fill="none"
              stroke="#5A3D24"
              strokeWidth="1.5"
            />

            {/* Corner Decorative Brackets */}
            <path d="M 50 80 L 80 80 L 80 50 M 2150 80 L 2120 80 L 2120 50 M 50 1320 L 80 1320 L 80 1350 M 2150 1320 L 2120 1320 L 2120 1350" fill="none" stroke="#3D2817" strokeWidth="2.5" />

            {/* ---------------------------------------------------- */}
            {/* GEOGRAPHIC FEATURE 1: PRIPET MARSHES (WETLAND ZONE)  */}
            {/* ---------------------------------------------------- */}
            <g id="pripet-marshes" opacity="0.85">
              <path
                d="M 680 470 C 740 440, 840 450, 920 480 C 960 520, 940 560, 880 580 C 800 590, 720 570, 680 540 Z"
                fill="#D4C8A9"
                stroke="#6B593E"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              {/* Wetland Reeds Symbols */}
              {[
                { x: 720, y: 490 },
                { x: 770, y: 530 },
                { x: 820, y: 480 },
                { x: 860, y: 520 },
                { x: 890, y: 550 },
                { x: 740, y: 540 },
              ].map((pt, i) => (
                <path
                  key={i}
                  d={`M ${pt.x} ${pt.y} L ${pt.x} ${pt.y - 10} M ${pt.x - 3} ${pt.y} L ${pt.x - 5} ${pt.y - 8} M ${pt.x + 3} ${pt.y} L ${pt.x + 5} ${pt.y - 8}`}
                  stroke="#5A472E"
                  strokeWidth="1.2"
                />
              ))}
              <text
                x="800"
                y="525"
                fill="#4D3B26"
                fontSize="13"
                fontStyle="italic"
                fontWeight="700"
                fontFamily="'Palatino Linotype', serif"
                letterSpacing="1.5"
                textAnchor="middle"
              >
                PRIPET MARSHES (ПОЛЕСЬЕ)
              </text>
            </g>

            {/* ---------------------------------------------------- */}
            {/* GEOGRAPHIC FEATURE 2: CARPATHIAN MOUNTAINS RIDGE     */}
            {/* ---------------------------------------------------- */}
            <g id="carpathian-mountains" opacity="0.75">
              {[
                { x: 280, y: 680 },
                { x: 310, y: 720 },
                { x: 340, y: 770 },
                { x: 360, y: 830 },
                { x: 390, y: 890 },
              ].map((m, i) => (
                <g key={i} transform={`translate(${m.x}, ${m.y})`}>
                  <polygon points="0,0 14,-22 28,0" fill="#D9CCB4" stroke="#4A3423" strokeWidth="1.5" />
                  <line x1="14" y1="-22" x2="14" y2="0" stroke="#4A3423" strokeWidth="1" />
                </g>
              ))}
              <text
                x="320"
                y="850"
                fill="#4A3423"
                fontSize="11"
                fontStyle="italic"
                fontFamily="'Palatino Linotype', serif"
                transform="rotate(-55, 320, 850)"
              >
                Carpathian Mountains
              </text>
            </g>

            {/* WATER BODIES (Hand-Drawn Sepia Tint with Coastal Waves) */}
            {/* Baltic Sea (Top-Left) */}
            <path
              d="M 62 62 L 520 62 C 480 120, 420 180, 380 250 C 350 310, 310 340, 220 370 L 62 390 Z"
              fill="#D6C8AF"
              stroke="#3A2514"
              strokeWidth="3"
            />
            {/* Baltic Coastal Waves */}
            <path
              d="M 80 120 Q 220 140, 340 220 M 120 200 Q 240 220, 310 300"
              fill="none"
              stroke="#8C755D"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <text x="180" y="240" fill="#4A3423" fontSize="16" fontStyle="italic" fontFamily="'Palatino Linotype', serif" letterSpacing="2">
              BALTIC SEA (БАЛТИКА)
            </text>

            {/* Black Sea & Sea of Azov (Bottom) */}
            <path
              d="M 280 1338 C 360 1180, 520 1100, 680 1080 C 840 1060, 960 1120, 1100 1080 C 1220 1050, 1340 1140, 1440 1338 Z"
              fill="#D6C8AF"
              stroke="#3A2514"
              strokeWidth="3"
            />
            <path
              d="M 520 1140 Q 660 1110, 800 1130 M 880 1120 Q 1020 1100, 1160 1120"
              fill="none"
              stroke="#8C755D"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <text x="820" y="1220" fill="#4A3423" fontSize="16" fontStyle="italic" fontFamily="'Palatino Linotype', serif" letterSpacing="2">
              BLACK SEA (ЧЁРНОЕ МОРЕ)
            </text>

            {/* MAJOR STRATEGIC RIVERS (Deep Brown Calligraphic Ink) */}
            {/* Dnieper River Main Stem & Rapids */}
            <path
              d="M 1080 340 Q 980 480, 880 560 Q 820 680, 960 840 Q 1020 960, 980 1080"
              fill="none"
              stroke="#2C1C11"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Pripyat River Branch (Feeding into Dnieper from West) */}
            <path
              d="M 620 520 Q 750 510, 880 560"
              fill="none"
              stroke="#2C1C11"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Desna River Branch (Feeding into Dnieper from East) */}
            <path
              d="M 1120 480 Q 980 520, 880 560"
              fill="none"
              stroke="#2C1C11"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Don River */}
            <path
              d="M 1480 440 Q 1420 620, 1340 720 Q 1280 820, 1220 980"
              fill="none"
              stroke="#2C1C11"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Volga River (Deep East) */}
            <path
              d="M 1780 240 Q 1720 500, 1680 780 Q 1660 980, 1720 1200"
              fill="none"
              stroke="#4A3423"
              strokeWidth="3"
              strokeDasharray="8 4"
            />

            {/* Coordinate Meridian Labels */}
            <text x="380" y="95" fill="#5A432F" fontSize="13" fontFamily="'Palatino Linotype', serif" fontWeight="700">
              26°E • WESTERN BORDER SECTOR
            </text>
            <text x="960" y="95" fill="#5A432F" fontSize="13" fontFamily="'Palatino Linotype', serif" fontWeight="700">
              36°E • DNIEPER LINE
            </text>
            <text x="1560" y="95" fill="#5A432F" fontSize="13" fontFamily="'Palatino Linotype', serif" fontWeight="700">
              46°E • MOSCOW MERIDIAN
            </text>

            {/* INITIAL BORDER (June 22, 1941) — Brown Ink Dashed Line */}
            <path
              d="M 440 180 L 400 360 L 360 520 L 390 740 L 340 980"
              fill="none"
              stroke="#543A26"
              strokeWidth="3.5"
              strokeDasharray="9 6"
            />

            {/* DYNAMIC COLLAPSING FRONTLINE (Sepia-Crimson Hand-Drawn Stroke) */}
            <path
              d={`M ${440 + frontShift * 0.9} 180 Q ${420 + frontShift * 1.1} 360, ${480 + frontShift * 1.3} 540 Q ${450 + frontShift * 1.0} 760, ${380 + frontShift * 0.8} 980`}
              fill="none"
              stroke="#7E1C12"
              strokeWidth="4.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 5px rgba(126, 28, 18, 0.45))"
            />

            {/* ---------------------------------------------------- */}
            {/* WEHRMACHT BROWN/CRIMSON INK-FILLED PINCERS           */}
            {/* ---------------------------------------------------- */}
            <BrownInkPincer
              startX={380}
              startY={220}
              ctrlX={640}
              ctrlY={180}
              endX={940}
              endY={170}
              progress={pincerNorthProg}
              strokeWidth={11}
              label="H.GR. NORD"
              subLabel="Gen.Feldm. von Leeb"
            />

            <BrownInkPincer
              startX={380}
              startY={420}
              ctrlX={880}
              ctrlY={390}
              endX={1460}
              endY={370}
              progress={pincerCenterProg}
              strokeWidth={14}
              label="H.GR. MITTE"
              subLabel="Guderian & Hoth Panzers"
            />

            <BrownInkPincer
              startX={360}
              startY={680}
              ctrlX={800}
              ctrlY={650}
              endX={1260}
              endY={740}
              progress={pincerSouthProg}
              strokeWidth={12}
              label="H.GR. SÜD"
              subLabel="von Rundstedt"
            />

            {/* Encirclement Pockets (Minsk & Kiev) */}
            {frame > 220 && (
              <g>
                <ellipse
                  cx="740"
                  cy="410"
                  rx="68"
                  ry="48"
                  fill="rgba(140, 37, 24, 0.15)"
                  stroke="#7E1C12"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <text
                  x="740"
                  y="415"
                  fill="#5C140C"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="'Palatino Linotype', serif"
                  letterSpacing="1"
                >
                  MINSK POCKET
                </text>
              </g>
            )}

            {/* ---------------------------------------------------- */}
            {/* HISTORICAL CITY NODES                                */}
            {/* ---------------------------------------------------- */}
            {/* Moscow (Capital & Red Star) */}
            <g transform="translate(1540, 360)">
              <circle r="22" fill="#E8DEC9" stroke="#3D2817" strokeWidth="3" />
              <polygon
                points="0,-14 4,-4 14,-4 6,3 9,13 0,7 -9,13 -6,3 -14,-4 -4,-4"
                fill="#8C2518"
              />
              <text
                x="32"
                y="6"
                fill="#24150A"
                fontSize="22"
                fontWeight="900"
                letterSpacing="1.5"
                fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
              >
                MOSCOW (МОСКВА)
              </text>
            </g>

            {/* Leningrad */}
            <g transform="translate(980, 160)">
              <circle r="10" fill="#E8DEC9" stroke="#3D2817" strokeWidth="2.5" />
              <circle r="4" fill="#8C2518" />
              <text
                x="18"
                y="5"
                fill="#24150A"
                fontSize="17"
                fontWeight="800"
                fontFamily="'Palatino Linotype', Georgia, serif"
              >
                LENINGRAD
              </text>
            </g>

            {/* Kiev */}
            <g transform="translate(880, 570)">
              <circle r="10" fill="#E8DEC9" stroke="#3D2817" strokeWidth="2.5" />
              <circle r="4" fill="#8C2518" />
              <text
                x="18"
                y="5"
                fill="#24150A"
                fontSize="17"
                fontWeight="800"
                fontFamily="'Palatino Linotype', Georgia, serif"
              >
                KIEV (КИЕВ)
              </text>
            </g>

            {/* Smolensk */}
            <g transform="translate(1140, 390)">
              <circle r="8" fill="#E8DEC9" stroke="#3D2817" strokeWidth="2" />
              <circle r="3" fill="#3D2817" />
              <text
                x="14"
                y="4"
                fill="#3A2616"
                fontSize="15"
                fontWeight="700"
                fontFamily="'Palatino Linotype', Georgia, serif"
              >
                SMOLENSK
              </text>
            </g>

            {/* Brest Fortress (Western Border) */}
            <g transform="translate(420, 480)">
              <polygon points="0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2" fill="#8C2518" />
              <text x="12" y="4" fill="#3A2616" fontSize="12" fontWeight="700" fontFamily="'Palatino Linotype', serif">
                Brest (Брест)
              </text>
            </g>

            {/* Sevastopol */}
            <g transform="translate(880, 1020)">
              <circle r="8" fill="#E8DEC9" stroke="#3D2817" strokeWidth="2" />
              <circle r="3" fill="#3D2817" />
              <text
                x="14"
                y="4"
                fill="#3A2616"
                fontSize="15"
                fontWeight="700"
                fontFamily="'Palatino Linotype', Georgia, serif"
              >
                SEVASTOPOL
              </text>
            </g>

            {/* Burning Forward Airfields (Triggered at Frame 370) */}
            {frame >= 370 && (
              <g>
                {[
                  { x: 520, y: 320, name: "Bialystok" },
                  { x: 620, y: 440, name: "Minsk Airbase" },
                  { x: 580, y: 580, name: "Lvov Airbase" },
                  { x: 780, y: 520, name: "Kiev Airfield" },
                ].map((af, i) => (
                  <g key={i} transform={`translate(${af.x}, ${af.y})`}>
                    <circle
                      r={7 + Math.sin((frame + i * 10) * 0.3) * 2}
                      fill="none"
                      stroke="#8C2518"
                      strokeWidth="2"
                    />
                    <circle r="3" fill="#8C2518" />
                    <text
                      x="12"
                      y="4"
                      fill="#8C2518"
                      fontSize="11"
                      fontFamily="'Palatino Linotype', serif"
                      fontWeight="700"
                    >
                      🔥 {af.name}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* VINTAGE ORNATE COMPASS ROSE (Bottom-Left) */}
            <g transform="translate(180, 1160)" opacity="0.65">
              <circle r="45" fill="none" stroke="#5A3E26" strokeWidth="1.5" />
              <circle r="42" fill="none" stroke="#5A3E26" strokeWidth="0.8" strokeDasharray="3 3" />
              <polygon points="0,-48 8,-8 0,0 -8,-8" fill="#3D2817" />
              <polygon points="0,48 8,8 0,0 -8,8" fill="#8C7355" />
              <polygon points="48,0 8,8 0,0 8,-8" fill="#8C7355" />
              <polygon points="-48,0 -8,8 0,0 -8,-8" fill="#8C7355" />
              <text x="-4" y="-54" fill="#3D2817" fontSize="13" fontWeight="900" fontFamily="serif">N</text>
            </g>

            {/* SCALE BAR */}
            <g transform="translate(180, 1260)" opacity="0.75">
              <rect x="0" y="0" width="160" height="4" fill="#3D2817" />
              <rect x="0" y="0" width="40" height="4" fill="#8C7355" />
              <rect x="80" y="0" width="40" height="4" fill="#8C7355" />
              <text x="0" y="15" fill="#3D2817" fontSize="10" fontFamily="monospace">0</text>
              <text x="75" y="15" fill="#3D2817" fontSize="10" fontFamily="monospace">250</text>
              <text x="145" y="15" fill="#3D2817" fontSize="10" fontFamily="monospace">500 km</text>
            </g>
          </svg>
        </div>
      </div>

      {/* VINTAGE CARTOUCHE TITLE BANNER */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 48,
          display: "flex",
          alignItems: "center",
          gap: 16,
          backgroundColor: "#F2EADB",
          padding: "10px 22px",
          borderRadius: 4,
          border: "2px solid #4A321E",
          boxShadow: "0 6px 20px rgba(43, 31, 20, 0.35)",
        }}
      >
        <div
          style={{
            backgroundColor: "#7E1C12",
            color: "#FFF",
            fontSize: 11,
            fontWeight: 900,
            padding: "4px 10px",
            borderRadius: 2,
            letterSpacing: "0.18em",
            fontFamily: "monospace",
          }}
        >
          ВОСТОЧНЫЙ ФРОНТ
        </div>
        <div
          style={{
            color: "#2C1B10",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.12em",
            fontFamily: "'Palatino Linotype', Georgia, serif",
            textTransform: "uppercase",
          }}
        >
          Operation Barbarossa • June 22, 1941
        </div>
      </div>

      {/* ARCHIVAL TELEGRAM: VVS AIR CASUALTY TELETYPE (Frame 360 to 660) */}
      {frame >= 360 && (
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 48,
            width: 480,
            backgroundColor: "#FAF4EA",
            border: "2px solid #7E1C12",
            borderRadius: 4,
            padding: "20px 24px",
            boxShadow: "0 15px 40px rgba(43, 31, 20, 0.45)",
            transform: `translateY(${alertTranslateY}px)`,
            opacity: alertOpacity,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid rgba(126, 28, 18, 0.3)",
              paddingBottom: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#7E1C12",
              }}
            />
            <div
              style={{
                color: "#7E1C12",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.18em",
                fontFamily: "monospace",
              }}
            >
              URGENT TELETYPE • HQ VVS AIR FORCES
            </div>
          </div>

          <div
            style={{
              fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
              fontSize: 34,
              fontWeight: 900,
              color: "#1E120A",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            {aircraftLossCount >= 2000 ? "2,000+" : aircraftLossCount.toLocaleString()}{" "}
            <span style={{ fontSize: 18, color: "#7E1C12" }}>PLANES LOST</span>
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#4A3525",
              lineHeight: 1.5,
              fontFamily: "'Palatino Linotype', Georgia, serif",
            }}
          >
            66 forward airfields bombed in the first 72 hours. Millions dead,
            wounded or captured. The country was desperate for anyone who knew how to
            fly.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 02: SOVIET WOMEN IN AVIATION & MARINA RASKOVA DOSSIER
// 0:22 - 0:42 (Frames 660 - 1260)
// =========================================================================
const MarinaRaskovaDossier: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideX = interpolate(frame, [0, 25], [1920, 0], {
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const camZoom = interpolate(frame, [25, 600], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  const breathing = Math.sin((frame * Math.PI) / 15) * 0.012;
  const bobY = Math.sin((frame * Math.PI) / 15) * 3;

  const flightProgress = interpolate(frame, [280, 480], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const heroCardSpring = spring({
    frame: frame - 300,
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.9 },
  });
  const heroCardTranslateY = interpolate(heroCardSpring, [0, 1], [100, 0]);
  const heroCardOpacity = interpolate(heroCardSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#EDE4D0",
        transform: `translateX(${slideX}px)`,
        overflow: "hidden",
      }}
    >
      {/* ARCHIVAL PARCHMENT TEXTURE BASE */}
      <Img
        src={staticFile("night_witches/parchment_paper_texture.jpg")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${camZoom})`,
          transformOrigin: "center center",
        }}
      />

      {/* TOP ARCHIVAL DOSSIER BANNER */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 56,
          display: "flex",
          alignItems: "center",
          gap: 18,
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: "#2B231B",
            color: "#EDE4D0",
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.2em",
            fontFamily: "monospace",
            borderRadius: 3,
          }}
        >
          ARCHIVAL RECORD • 1930s
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.15em",
            color: "#2B231B",
            textTransform: "uppercase",
            fontFamily: "'Palatino Linotype', Georgia, serif",
          }}
        >
          OSOAVIAKHIM Civilian Aviation Network
        </div>
      </div>

      {/* LEFT COLUMN: OSOAVIAKHIM STATS & FACTOIDS */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 130,
          width: 520,
          zIndex: 5,
        }}
      >
        <div
          style={{
            borderLeft: "4px solid #7E1C12",
            paddingLeft: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#7E1C12",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Pre-War Aviation Culture
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#1E1813",
              lineHeight: 1.15,
              marginTop: 6,
              fontFamily: "'Palatino Linotype', Georgia, serif",
            }}
          >
            Women in Soviet Wings
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.82)",
            border: "1.5px solid #8C7B65",
            borderRadius: 6,
            padding: "20px 24px",
            boxShadow: "0 10px 30px rgba(43, 35, 27, 0.12)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "#3D342A",
              lineHeight: 1.6,
              fontFamily: "'Palatino Linotype', Georgia, serif",
            }}
          >
            Throughout the 1930s, thousands of Soviet girls trained in state
            civilian aeroclubs under <strong>ОСОАВИАХИМ</strong>, mastering aerobatics,
            parachuting, and high-altitude navigation long before the outbreak of war.
          </div>
        </div>

        {/* TRANS-SIBERIAN RECORD FLIGHT CARD */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            border: "1.5px solid #8C7B65",
            borderRadius: 6,
            padding: "20px 24px",
            boxShadow: "0 12px 35px rgba(43, 35, 27, 0.14)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "#7E1C12",
              letterSpacing: "0.2em",
              fontFamily: "monospace",
              marginBottom: 8,
            }}
          >
            ★ HISTORIC SIBERIAN FLIGHT (1938)
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#1E1813",
              fontFamily: "'Palatino Linotype', Georgia, serif",
              marginBottom: 6,
            }}
          >
            ANT-37 &ldquo;Rodina&rdquo; Record Flight
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#5C4F3E",
              fontFamily: "'Palatino Linotype', Georgia, serif",
              lineHeight: 1.5,
            }}
          >
            Moscow ➔ Far East Siberia (Kerbi) • <strong>5,908 km non-stop</strong> across
            taiga in 26 hours, 29 minutes.
          </div>

          <div style={{ marginTop: 14, width: "100%", height: 48 }}>
            <svg width="100%" height="48" viewBox="0 0 460 48">
              <path
                d="M 10 38 Q 230 6, 440 24"
                fill="none"
                stroke="#7E1C12"
                strokeWidth="3.5"
                strokeDasharray="480"
                strokeDashoffset={flightProgress * 480}
              />
              <circle cx="10" cy="38" r="5" fill="#2B231B" />
              <text x="18" y="42" fontSize="11" fontWeight="700" fill="#2B231B">
                MOSCOW
              </text>
              <circle cx="440" cy="24" r="5" fill="#7E1C12" />
              <text x="360" y="20" fontSize="11" fontWeight="700" fill="#7E1C12">
                SIBERIA (5,908 KM)
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* CENTER-RIGHT: MARINA RASKOVA CUTOUT */}
      <div
        style={{
          position: "absolute",
          right: 140,
          bottom: -15,
          width: 680,
          height: 980,
          zIndex: 6,
          transform: `scale(${1 + breathing}) translateY(${bobY}px)`,
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 20px 40px rgba(43, 35, 27, 0.45))",
        }}
      >
        <Img
          src={staticFile("night_witches/marina_raskova_cutout.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
          }}
        />
      </div>

      {/* HERO CHARACTER CARD: MARINA RASKOVA */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 60,
          backgroundColor: "#1D222C",
          border: "2px solid #D8A987",
          borderRadius: 6,
          padding: "18px 28px",
          width: 580,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          zIndex: 20,
          transform: `translateY(${heroCardTranslateY}px)`,
          opacity: heroCardOpacity,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              backgroundColor: "#7E1C12",
              color: "#FFF",
              fontSize: 11,
              fontWeight: 900,
              padding: "3px 8px",
              borderRadius: 3,
              letterSpacing: "0.2em",
              fontFamily: "monospace",
            }}
          >
            ★ HERO OF THE SOVIET UNION #104
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#D8A987",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            CELEBRITY NAVIGATOR
          </div>
        </div>

        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "#FAF6EE",
            letterSpacing: "0.08em",
            fontFamily: "'Palatino Linotype', Georgia, serif",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Marina Raskova (Марина Раскова)
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#CBD5E0",
            lineHeight: 1.45,
            fontFamily: "'Palatino Linotype', Georgia, serif",
          }}
        >
          Celebrity aviator who took an audacious proposal directly to Joseph
          Stalin to build all-female combat regiments.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 03: THE KREMLIN PETITIONS & STALIN'S ORDER NUMBER 0099
// 0:42 - 1:07 (Frames 1260 - 2010)
// =========================================================================
const KremlinOrder0099: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideX = interpolate(frame, [0, 25], [1920, 0], {
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const stampSpring = spring({
    frame: frame - 420,
    fps,
    config: { damping: 10, stiffness: 220, mass: 1.2 },
  });
  const stampScale = interpolate(stampSpring, [0, 1], [3.5, 1]);
  const stampOpacity = interpolate(stampSpring, [0, 1], [0, 1]);

  const shakeOffset =
    frame >= 420 && frame <= 445
      ? Math.sin((frame - 420) * 1.8) *
        interpolate(frame, [420, 445], [12, 0], { extrapolateRight: "clamp" })
      : 0;

  const bershanskayaSpring = spring({
    frame: frame - 470,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.9 },
  });
  const bershanskayaTranslateX = interpolate(
    bershanskayaSpring,
    [0, 1],
    [500, 0]
  );
  const bershanskayaOpacity = interpolate(bershanskayaSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0F131A",
        transform: `translateX(${slideX + shakeOffset}px)`,
        overflow: "hidden",
      }}
    >
      {/* MONUMENTAL KREMLIN SILHOUETTE */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #0A0D14 0%, #151B24 60%, #1E2532 100%)",
        }}
      />

      {/* CASCADING VOLUNTEER PETITION LETTERS (Frames 30 to 240) */}
      {frame >= 30 && (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 140,
            width: 580,
            zIndex: 4,
          }}
        >
          {/* Letter 1 */}
          <div
            style={{
              backgroundColor: "#F7F3E9",
              border: "1px solid #C4B9A3",
              borderRadius: 6,
              padding: "16px 20px",
              boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
              transform: "rotate(-3.5deg)",
              marginBottom: 20,
              opacity: interpolate(frame, [30, 60], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#7E1C12",
                fontWeight: 800,
                marginBottom: 4,
              }}
            >
              VOLUNTEER PETITION • LENINGRAD AERO CLUB
            </div>
            <div
              style={{
                fontFamily: "'Palatino Linotype', Georgia, serif",
                fontSize: 16,
                color: "#1E1813",
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              &ldquo;I have completed 450 flight hours. My place is not in the rear;
              send me to the front lines immediately.&rdquo;
            </div>
          </div>

          {/* Letter 2 */}
          <div
            style={{
              backgroundColor: "#FAF6EE",
              border: "1px solid #C4B9A3",
              borderRadius: 6,
              padding: "16px 20px",
              boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
              transform: "rotate(2.2deg)",
              marginLeft: 40,
              opacity: interpolate(frame, [70, 100], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#7E1C12",
                fontWeight: 800,
                marginBottom: 4,
              }}
            >
              TELEGRAM TO MARINA RASKOVA • MOSCOW
            </div>
            <div
              style={{
                fontFamily: "'Palatino Linotype', Georgia, serif",
                fontSize: 16,
                color: "#1E1813",
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              &ldquo;Dozens of certified female navigators are waiting for orders. We
              demand the right to defend the Motherland in combat.&rdquo;
            </div>
          </div>
        </div>
      )}

      {/* CENTER: OFFICIAL ORDER NUMBER 0099 DECREE PARCHMENT */}
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 90,
          width: 660,
          height: 880,
          backgroundColor: "#EDE4D0",
          border: "4px solid #2B231B",
          borderRadius: 6,
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.85)",
          padding: "36px 42px",
          zIndex: 5,
          color: "#1E1813",
        }}
      >
        <div
          style={{
            textAlign: "center",
            borderBottom: "2px solid #2B231B",
            paddingBottom: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 900,
              color: "#7E1C12",
              letterSpacing: "0.2em",
            }}
          >
            НАРОДНЫЙ КОМИССАРИАТ ОБОРОНЫ СССР
          </div>
          <div
            style={{
              fontFamily: "'Palatino Linotype', Georgia, serif",
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#1E1813",
              marginTop: 4,
            }}
          >
            ПРИКАЗ № 0099
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "#5C4F3E",
              marginTop: 4,
            }}
          >
            8 ОКТЯБРЯ 1941 ГОДА • ГОРОД МОСКВА
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Palatino Linotype', Georgia, serif",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#2B231B",
            marginBottom: 24,
          }}
        >
          Authorize the formation of three dedicated women combat aviation regiments
          under the Red Army Air Force:
        </div>

        {/* Three Regiments Unlocked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              border: "1px solid #C4B9A3",
              borderRadius: 6,
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Palatino Linotype', serif" }}>
              586th Fighter Aviation Regiment
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#5C4F3E", fontWeight: 700 }}>
              Yakovlev Yak-1
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              border: "1px solid #C4B9A3",
              borderRadius: 6,
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Palatino Linotype', serif" }}>
              587th Day Bomber Aviation Regiment
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#5C4F3E", fontWeight: 700 }}>
              Petlyakov Pe-2
            </div>
          </div>

          {/* Highlighted 588th Regiment */}
          <div
            style={{
              backgroundColor: "#2B231B",
              border: "2px solid #7E1C12",
              borderRadius: 6,
              padding: "12px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 6px 18px rgba(126, 28, 18, 0.35)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16, color: "#FAF6EE", fontFamily: "'Palatino Linotype', serif" }}>
              ★ 588th Night Bomber Regiment
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#D8A987", fontWeight: 800 }}>
              Polikarpov Po-2
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 32,
            borderTop: "1px dashed #8C7B65",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "#5C4F3E" }}>
            PEOPLE&apos;S COMMISSAR OF DEFENSE:
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 22,
              fontWeight: 900,
              fontStyle: "italic",
              color: "#1E1813",
            }}
          >
            И. СТАЛИН (J. Stalin)
          </div>
        </div>

        {/* OFFICIAL CRIMSON SEAL STAMP SLAM (Frame 420) */}
        {frame >= 420 && (
          <div
            style={{
              position: "absolute",
              right: 60,
              bottom: 80,
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: "5px double #7E1C12",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#7E1C12",
              transform: `scale(${stampScale}) rotate(-12deg)`,
              opacity: stampOpacity,
              boxShadow: "0 0 15px rgba(126, 28, 18, 0.4)",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 900, letterSpacing: "0.15em" }}>
              НАРОДНЫЙ КОМИССАРИАТ
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, margin: "4px 0" }}>
              ★ УТВЕРЖДЕНО ★
            </div>
            <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 800 }}>
              ПРИКАЗ № 0099
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: MAJOR YEVDOKIYA BERSHANSKAYA */}
      {frame >= 470 && (
        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: -30,
            width: 540,
            height: 980,
            zIndex: 6,
            transform: `translateX(${bershanskayaTranslateX}px)`,
            opacity: bershanskayaOpacity,
            filter: "drop-shadow(0 20px 45px rgba(0, 0, 0, 0.85))",
          }}
        >
          <Img
            src={staticFile("night_witches/major_bershanskaya_cutout.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom right",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 80,
              right: 20,
              backgroundColor: "rgba(22, 27, 36, 0.95)",
              border: "1.5px solid #D8A987",
              borderRadius: 6,
              padding: "12px 18px",
              boxShadow: "0 15px 35px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: "#7E1C12", letterSpacing: "0.2em", fontFamily: "monospace" }}>
              ★ REGIMENTAL COMMANDER
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#FAF6EE", fontFamily: "'Palatino Linotype', serif", textTransform: "uppercase", marginTop: 2 }}>
              Major Yevdokiya Bershanskaya
            </div>
            <div style={{ fontSize: 12, color: "#CBD5E0", fontFamily: "'Palatino Linotype', serif", marginTop: 2 }}>
              Age 28 • 10 Years Flight Experience
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// =========================================================================
// MAIN ACT 2 COMPOSITION: 0:58 - 2:05 (2,010 Frames @ 30 FPS)
// =========================================================================
export const NightWitchesAct2: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#EDE4D0",
        overflow: "hidden",
      }}
    >
      {/* SCENE 01: Rich Brown Ink on Archival Parchment Map (0:00 - 0:22 | Frames 0 - 660) */}
      <Sequence from={0} durationInFrames={660}>
        <BrownInkParchmentMap />
      </Sequence>

      {/* SCENE 02: Soviet Women in Aviation & Marina Raskova (0:22 - 0:42 | Frames 660 - 1260) */}
      <Sequence from={660} durationInFrames={600}>
        <MarinaRaskovaDossier />
      </Sequence>

      {/* SCENE 03: Kremlin Petitions & Stalin's Order 0099 (0:42 - 1:07 | Frames 1260 - 2010) */}
      <Sequence from={1260} durationInFrames={750}>
        <KremlinOrder0099 />
      </Sequence>

      {/* GLOBAL ARCHIVAL GRADE */}
      <ArchivalGrade />

      {/* ---------------------------------------------------- */}
      {/* AUDIO TRACKS: BALANCED SOUND DESIGN                 */}
      {/* ---------------------------------------------------- */}
      {/* Master BOP Narration */}
      <Audio
        src={staticFile("night_witches/voiceover.wav")}
        startFrom={1740}
        endAt={3750}
        volume={1.0}
      />

      {/* Camera Whip-Pan Transition Whoosh at Frame 0 */}
      <Sequence from={0} durationInFrames={45}>
        <Audio
          src={staticFile("night_witches/sfx_camera_whoosh_transition.mp3")}
          volume={0.5}
        />
      </Sequence>

      {/* Tactical Map Parchment Slide SFX at Frame 8 */}
      <Sequence from={8} durationInFrames={120}>
        <Audio
          src={staticFile("night_witches/sfx_map_parchment_slide.mp3")}
          volume={0.3}
        />
      </Sequence>

      {/* Radar CRT Sweep Ping at Frame 370 */}
      <Sequence from={370} durationInFrames={110}>
        <Audio
          src={staticFile("night_witches/sfx_radar_crt_sweep_ping.mp3")}
          volume={0.45}
        />
      </Sequence>

      {/* Transition into Raskova Dossier at Frame 660 */}
      <Sequence from={660} durationInFrames={45}>
        <Audio
          src={staticFile("night_witches/sfx_camera_whoosh_transition.mp3")}
          volume={0.5}
        />
      </Sequence>

      {/* Parchment Slide into Dossier at Frame 668 */}
      <Sequence from={668} durationInFrames={90}>
        <Audio
          src={staticFile("night_witches/sfx_map_parchment_slide.mp3")}
          volume={0.25}
        />
      </Sequence>

      {/* Transition into Kremlin Scene at Frame 1260 */}
      <Sequence from={1260} durationInFrames={45}>
        <Audio
          src={staticFile("night_witches/sfx_camera_whoosh_transition.mp3")}
          volume={0.5}
        />
      </Sequence>

      {/* Heavy Official Metal Stamp Slam of Order 0099 at Frame 1680 */}
      <Sequence from={1680} durationInFrames={60}>
        <Audio
          src={staticFile("night_witches/sfx_iron_cross_metal_stamp.mp3")}
          volume={0.75}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
