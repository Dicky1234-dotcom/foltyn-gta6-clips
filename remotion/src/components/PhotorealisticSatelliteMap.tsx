import React from 'react';
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

interface PhotorealisticSatelliteMapProps {
  title?: string;
  subtitle?: string;
  highlightName?: string;
}

export const PhotorealisticSatelliteMap: React.FC<PhotorealisticSatelliteMapProps> = ({
  title = 'THEATER OF OPERATIONS: NORTH ATLANTIC',
  subtitle = 'TERRITORIAL PROFILE // IRELAND (INDEPENDENT GAELIC KINGDOMS)',
  highlightName = 'IRELAND',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Smooth cinematic camera swoop into the highlighted territory
  const scale = interpolate(frame, [0, durationInFrames], [1.02, 1.28], {
    extrapolateRight: 'clamp',
  });
  const panX = interpolate(frame, [0, durationInFrames], [0, 80], {
    extrapolateRight: 'clamp',
  });
  const panY = interpolate(frame, [0, durationInFrames], [0, 60], {
    extrapolateRight: 'clamp',
  });
  const rotateX = interpolate(frame, [0, durationInFrames], [12, 22], {
    extrapolateRight: 'clamp',
  });
  const rotateZ = interpolate(frame, [0, durationInFrames], [-1, -4], {
    extrapolateRight: 'clamp',
  });

  // Pulse effect on the highlighted country label
  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const reticlePulse = 0.85 + Math.sin(frame * 0.15) * 0.15;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a1020',
        overflow: 'hidden',
        perspective: '1400px',
      }}
    >
      {/* 3D Tilted Map Plane */}
      <div
        style={{
          position: 'absolute',
          inset: -120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `perspective(1400px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale}) translate(${panX}px, ${panY}px)`,
          transformOrigin: '48% 32%', // Anchored towards Ireland / Western Europe
        }}
      >
        <img
          src={staticFile('satellite_map_ireland_example.jpg')}
          alt="Satellite Map"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'contrast(1.08) brightness(0.96) saturate(1.05)',
          }}
        />

        {/* Dynamic Tactical Target Crosshair on Ireland */}
        <div
          style={{
            position: 'absolute',
            left: '44.8%',
            top: '27.5%',
            transform: 'translate(-50%, -50%)',
            opacity: labelOpacity,
            pointerEvents: 'none',
          }}
        >
          {/* Target Ring */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: `2px dashed rgba(255, 255, 255, ${reticlePulse})`,
              boxShadow: '0 0 25px rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 12px #ffffff',
              }}
            />
          </div>

          {/* Tactical Target Label */}
          <div
            style={{
              position: 'absolute',
              left: 105,
              top: 28,
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '0.15em',
              color: '#FFFFFF',
              backgroundColor: 'rgba(10, 16, 28, 0.85)',
              padding: '6px 14px',
              borderLeft: '4px solid #FFFFFF',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.7)',
            }}
          >
            TARGET: {highlightName}
            <div
              style={{
                fontSize: 11,
                color: '#A0AEC0',
                letterSpacing: '0.08em',
                marginTop: 2,
              }}
            >
              53°20'N 6°15'W // GAELIC HEGEMONY
            </div>
          </div>
        </div>
      </div>

      {/* Armchair Historian Documentary HUD Overlays */}
      {/* Top Left Header */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 56,
          fontFamily: 'monospace',
          color: '#FFFFFF',
          zIndex: 10,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '0.18em',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
            }}
          />
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#A0AEC0',
            letterSpacing: '0.12em',
            marginTop: 6,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Top Right Coordinate Telemetry */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 56,
          textAlign: 'right',
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#CBD5E0',
          letterSpacing: '0.12em',
          zIndex: 10,
        }}
      >
        <div>PROJECTION: MERCATOR SATELLITE</div>
        <div style={{ color: '#718096', marginTop: 3 }}>
          ELEVATION RELIEF // 1:5,000,000
        </div>
      </div>

      {/* Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
          zIndex: 8,
        }}
      />
    </div>
  );
};
