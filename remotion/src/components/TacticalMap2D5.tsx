import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface TacticalMapProps {
  rotateX?: number;
  rotateZ?: number;
  scale?: number;
  panX?: number;
  panY?: number;
  showPincers?: boolean;
  pincerProgress?: number;
  showContours?: boolean;
  showUnits?: boolean;
  activeEncirclement?: boolean;
  radarAngle?: number;
  title?: string;
  theaterLabel?: string;
}

export const TacticalMap2D5: React.FC<TacticalMapProps> = ({
  rotateX = 20,
  rotateZ = -4,
  scale = 1.0,
  panX = 0,
  panY = 0,
  showPincers = true,
  pincerProgress = 1.0,
  showContours = true,
  showUnits = true,
  activeEncirclement = false,
  radarAngle = 0,
  title = "OPERATIONAL SECTOR ALPHA // KISKA ISLAND",
  theaterLabel = "NORTH PACIFIC THEATER 1943",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle tactical grid scanline breathing
  const gridPulse = Math.sin(frame * 0.05) * 0.05 + 0.95;
  const radarAlpha = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.15, 0.35]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0F131A",
        position: "relative",
        overflow: "hidden",
        perspective: "1200px",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* 2.5D Transformed Tactical Plane */}
      <div
        style={{
          width: "2400px",
          height: "1600px",
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: "-1200px",
          marginTop: "-800px",
          transform: `scale(${scale}) translate(${panX}px, ${panY}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
          transformOrigin: "center center",
          backgroundColor: "#141A24",
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.8)",
        }}
      >
        {/* Topographic Relief Elevation Contours (SVG) */}
        {showContours && (
          <svg
            width="2400"
            height="1600"
            style={{ position: "absolute", top: 0, left: 0, opacity: 0.9 }}
          >
            <defs>
              {/* Radial gradient for Kiska Volcano height relief */}
              <radialGradient id="volcanoElevation" cx="55%" cy="42%" r="35%">
                <stop offset="0%" stopColor="#2E3D52" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#222C3D" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#19202C" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#141A24" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="pincerNorthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="pincerSouthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#93C5FD" stopOpacity="1" />
              </linearGradient>
              <filter id="pincerGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Hillshade Elevation Blobs */}
            <circle cx="1320" cy="670" r="420" fill="url(#volcanoElevation)" />
            <circle cx="880" cy="940" r="320" fill="url(#volcanoElevation)" />

            {/* Topographic Contour Curves */}
            {/* 100m Base Contour */}
            <path
              d="M 600,1050 C 720,850 820,780 1020,720 C 1220,660 1480,500 1620,620 C 1760,740 1820,950 1680,1120 C 1540,1290 1280,1320 1020,1280 C 780,1240 680,1180 600,1050 Z"
              fill="none"
              stroke="#2B374A"
              strokeWidth="2.5"
              strokeDasharray="8 4"
            />
            {/* 300m Mid Contour */}
            <path
              d="M 740,1020 C 840,860 960,790 1140,730 C 1320,670 1480,580 1560,690 C 1640,800 1660,980 1540,1100 C 1420,1220 1180,1230 980,1190 C 820,1150 720,1100 740,1020 Z"
              fill="none"
              stroke="#3A4A63"
              strokeWidth="2.8"
            />
            {/* 600m High Ridge */}
            <path
              d="M 880,980 C 960,860 1080,810 1220,750 C 1360,690 1440,640 1500,740 C 1560,840 1540,980 1440,1050 C 1340,1120 1120,1140 980,1100 C 900,1070 860,1030 880,980 Z"
              fill="none"
              stroke="#4E6485"
              strokeWidth="3"
            />
            {/* 1000m Peak (Kiska Volcano) */}
            <path
              d="M 1220,710 C 1280,660 1360,650 1400,700 C 1440,750 1420,810 1370,840 C 1320,870 1240,850 1200,800 C 1180,760 1190,730 1220,710 Z"
              fill="#263447"
              stroke="#6884AB"
              strokeWidth="3.5"
            />

            {/* Contour Elevation Labels */}
            <text x="760" y="870" fill="#64748B" fontSize="16" letterSpacing="2">
              [CONTOUR: 300m]
            </text>
            <text x="1410" y="640" fill="#94A3B8" fontSize="18" fontWeight="bold">
              KISKA PEAK 1,220m
            </text>
            <text x="920" y="1180" fill="#64748B" fontSize="16">
              LULU HILL [440m]
            </text>

            {/* Coordinate Grid Intersections */}
            <line x1="400" y1="0" x2="400" y2="1600" stroke="#1E293B" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="800" y1="0" x2="800" y2="1600" stroke="#1E293B" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="1200" y1="0" x2="1200" y2="1600" stroke="#263449" strokeWidth="1.5" strokeDasharray="6 6" />
            <line x1="1600" y1="0" x2="1600" y2="1600" stroke="#1E293B" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="2000" y1="0" x2="2000" y2="1600" stroke="#1E293B" strokeWidth="1" strokeDasharray="6 6" />

            <line x1="0" y1="400" x2="2400" y2="400" stroke="#1E293B" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="0" y1="800" x2="2400" y2="800" stroke="#263449" strokeWidth="1.5" strokeDasharray="6 6" />
            <line x1="0" y1="1200" x2="2400" y2="1200" stroke="#1E293B" strokeWidth="1" strokeDasharray="6 6" />

            {/* Tactical Coastline (Lilly Beach & Gertrude Cove) */}
            <path
              d="M 450,1200 Q 620,1050 850,960 T 1320,650 T 1780,580 T 2100,750"
              fill="none"
              stroke="#0EA5E9"
              strokeWidth="4"
              strokeOpacity="0.45"
            />
            <text x="500" y="1120" fill="#38BDF8" fontSize="20" fontWeight="bold">
              ▲ LILLY BEACH (NORTH LANDING)
            </text>
            <text x="1600" y="1280" fill="#38BDF8" fontSize="20" fontWeight="bold">
              ▲ GERTRUDE COVE (SOUTH LANDING)
            </text>
            <text x="1250" y="980" fill="#EF4444" fontSize="22" fontWeight="bold">
              ★ KISKA HARBOR (OBJECTIVE)
            </text>

            {/* Pulsing Objective Capture Zone */}
            <circle
              cx="1350"
              cy="980"
              r={interpolate(Math.sin(frame * 0.15), [-1, 1], [45, 65])}
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray="8 6"
              opacity="0.8"
            />

            {/* ANIMATED TROOP MARCH PINCERS */}
            {showPincers && (
              <>
                {/* Northern Wing Attack Pincer */}
                <path
                  d="M 520,1080 Q 820,920 1280,960"
                  fill="none"
                  stroke="url(#pincerNorthGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#pincerGlow)"
                  strokeDasharray="900"
                  strokeDashoffset={interpolate(pincerProgress, [0, 1], [900, 0])}
                />
                {/* Northern Pincer Arrowhead */}
                {pincerProgress > 0.4 && (
                  <polygon
                    points="1280,960 1240,935 1255,960 1240,985"
                    fill="#60A5FA"
                    filter="url(#pincerGlow)"
                  />
                )}

                {/* Southern Wing Attack Pincer */}
                <path
                  d="M 1650,1240 Q 1520,1060 1340,990"
                  fill="none"
                  stroke="url(#pincerSouthGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#pincerGlow)"
                  strokeDasharray="800"
                  strokeDashoffset={interpolate(pincerProgress, [0, 1], [800, 0])}
                />
                {/* Southern Pincer Arrowhead */}
                {pincerProgress > 0.4 && (
                  <polygon
                    points="1340,990 1370,1025 1355,995 1380,975"
                    fill="#93C5FD"
                    filter="url(#pincerGlow)"
                  />
                )}

                {/* Tactical Encirclement Line */}
                {activeEncirclement && (
                  <ellipse
                    cx="1320"
                    cy="970"
                    rx="140"
                    ry="95"
                    fill="rgba(239, 68, 68, 0.18)"
                    stroke="#EF4444"
                    strokeWidth="4"
                    strokeDasharray="12 6"
                  />
                )}
              </>
            )}
          </svg>
        )}

        {/* NATO DIVISION COUNTERS (Html Elements on 2.5D Plane) */}
        {showUnits && (
          <>
            {/* 7th Infantry Division (US) */}
            <div
              style={{
                position: "absolute",
                left: interpolate(pincerProgress, [0, 1], [580, 1100]),
                top: interpolate(pincerProgress, [0, 1], [1050, 930]),
                width: "140px",
                height: "64px",
                backgroundColor: "#1E3A8A",
                border: "2px solid #60A5FA",
                boxShadow: "0 8px 24px rgba(0,0,0,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              <div style={{ fontSize: "16px", letterSpacing: "2px" }}>[ ╳ ] 7th INF</div>
              <div style={{ fontSize: "11px", color: "#93C5FD" }}>USA // 9,500 MEN</div>
            </div>

            {/* 13th Canadian Brigade */}
            <div
              style={{
                position: "absolute",
                left: interpolate(pincerProgress, [0, 1], [1600, 1380]),
                top: interpolate(pincerProgress, [0, 1], [1210, 1040]),
                width: "140px",
                height: "64px",
                backgroundColor: "#1E3A8A",
                border: "2px solid #60A5FA",
                boxShadow: "0 8px 24px rgba(0,0,0,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              <div style={{ fontSize: "16px", letterSpacing: "2px" }}>[ ╳ ] 13th BDE</div>
              <div style={{ fontSize: "11px", color: "#93C5FD" }}>CAN // 5,300 MEN</div>
            </div>

            {/* Japanese Garrison (Target) */}
            <div
              style={{
                position: "absolute",
                left: "1280px",
                top: "890px",
                width: "150px",
                height: "64px",
                backgroundColor: "#7F1D1D",
                border: "2px solid #F87171",
                boxShadow: "0 8px 24px rgba(0,0,0,0.9)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              <div style={{ fontSize: "16px", letterSpacing: "2px" }}>[ ╳ ] KISKA GARRISON</div>
              <div style={{ fontSize: "11px", color: "#FCA5A5" }}>IJN // ESTIMATED 10,000</div>
            </div>
          </>
        )}
      </div>

      {/* FOREGROUND HUD OVERLAY (Zero 3D Distortion, Stays Crisp on Screen) */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "50px",
          color: "#94A3B8",
          fontSize: "14px",
          letterSpacing: "2px",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: "24px", color: "#F8FAFC", fontWeight: "bold", marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ color: "#38BDF8", fontSize: "15px" }}>{theaterLabel}</div>
        <div style={{ color: "#64748B", fontSize: "12px", marginTop: "6px" }}>
          GRID REF: 52°00'N 177°30'E // ELEVATION CONTOURS: 200m INTERVALS
        </div>
      </div>

      {/* Tactical Scale & Coordinates */}
      <div
        style={{
          position: "absolute",
          bottom: "35px",
          right: "50px",
          color: "#94A3B8",
          fontSize: "13px",
          letterSpacing: "2px",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ width: "120px", height: "4px", backgroundColor: "#38BDF8" }} />
        <span>0 ———— 5 KM (TACTICAL SCALE)</span>
      </div>

      {/* Screen Edge Vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: "inset 0 0 160px rgba(0,0,0,0.92)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
