import React from 'react';
import {
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Helper component for single animated map cut
interface MapShotProps {
  startScale: number;
  endScale: number;
  startPan: [number, number];
  endPan: [number, number];
  startRotateX: number;
  endRotateX: number;
  startRotateZ: number;
  endRotateZ: number;
  origin: string;
  showPincers?: boolean;
  pincerProgress?: number;
  highlightLabel?: string;
  labelCoords?: [string, string]; // [left, top]
}

const MapShot: React.FC<MapShotProps> = ({
  startScale,
  endScale,
  startPan,
  endPan,
  startRotateX,
  endRotateX,
  startRotateZ,
  endRotateZ,
  origin,
  showPincers = false,
  pincerProgress = 1,
  highlightLabel,
  labelCoords = ['45%', '28%'],
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / Math.max(1, durationInFrames);

  const scale = interpolate(progress, [0, 1], [startScale, endScale]);
  const panX = interpolate(progress, [0, 1], [startPan[0], endPan[0]]);
  const panY = interpolate(progress, [0, 1], [startPan[1], endPan[1]]);
  const rotX = interpolate(progress, [0, 1], [startRotateX, endRotateX]);
  const rotZ = interpolate(progress, [0, 1], [startRotateZ, endRotateZ]);

  // Subtle 4-frame film dissolve on shot entry and exit
  const opacity = interpolate(
    frame,
    [0, 5, durationInFrames - 5, durationInFrames],
    [0.75, 1, 1, 0.75],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a1020',
        overflow: 'hidden',
        perspective: '1300px',
        opacity,
      }}
    >
      {/* 2.5D Map Plane */}
      <div
        style={{
          position: 'absolute',
          inset: -140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `perspective(1300px) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale}) translate(${panX}px, ${panY}px)`,
          transformOrigin: origin,
        }}
      >
        {/* Base Photorealistic Satellite Texture */}
        <img
          src={staticFile('satellite_map_ireland_example.jpg')}
          alt="Satellite Map"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'contrast(1.09) brightness(0.95) saturate(1.05)',
          }}
        />

        {/* Dynamic Vector Pincers & Naval Routes Overlay */}
        {showPincers && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 1000 600"
          >
            <defs>
              <filter id="glow-pincer" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker
                id="pincer-head-red"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon points="0 1, 8 4, 0 7, 2 4" fill="#E53E3E" />
              </marker>
              <marker
                id="pincer-head-white"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon points="0 1, 8 4, 0 7, 2 4" fill="#FFFFFF" />
              </marker>
            </defs>

            {/* Route 1: Norway / North Sea to Ireland */}
            <path
              d="M 580 140 Q 520 200 452 172"
              fill="none"
              stroke="#E53E3E"
              strokeWidth="4"
              strokeDasharray="600"
              strokeDashoffset={600 * (1 - pincerProgress)}
              markerEnd="url(#pincer-head-red)"
              filter="url(#glow-pincer)"
              opacity={0.9}
            />

            {/* Route 2: Scottish Coast to Northern Ireland */}
            <path
              d="M 485 150 Q 470 162 454 165"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - Math.min(1, pincerProgress * 1.3))}
              markerEnd="url(#pincer-head-white)"
              filter="url(#glow-pincer)"
              opacity={0.85}
            />

            {/* Route 3: Irish Sea Southern Encirclement */}
            <path
              d="M 490 220 Q 465 210 448 185"
              fill="none"
              stroke="#E53E3E"
              strokeWidth="3.5"
              strokeDasharray="500"
              strokeDashoffset={500 * (1 - Math.max(0, pincerProgress - 0.2) * 1.25)}
              markerEnd="url(#pincer-head-red)"
              filter="url(#glow-pincer)"
              opacity={0.88}
            />
          </svg>
        )}

        {/* Clean Historical Cartographic Label (No Cheesy Title Card) */}
        {highlightLabel && (
          <div
            style={{
              position: 'absolute',
              left: labelCoords[0],
              top: labelCoords[1],
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '0.22em',
              fontWeight: 800,
              fontSize: 14,
              color: '#FFFFFF',
              textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)',
            }}
          >
            {highlightLabel}
          </div>
        )}
      </div>

      {/* Cinematic Corner Lens Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.68) 100%)',
          pointerEvents: 'none',
          zIndex: 8,
        }}
      />
    </div>
  );
};

export const AnimatedSatelliteMap30s: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        backgroundColor: '#0a1020',
        overflow: 'hidden',
      }}
    >
      {/* 🎵 AUDIO MASTER LAYER: Deep tension drone bed + transitions */}
      <Audio
        src={staticFile('sfx/sfx_investigative_drone_bed.wav')}
        volume={0.5}
        startFrom={0}
      />
      <Audio
        src={staticFile('sfx/sfx_sub_bass_concussion_drop.wav')}
        volume={0.7}
        startFrom={0}
      />

      {/* Shot transition SFX at key cuts */}
      <Sequence from={80}>
        <Audio src={staticFile('sfx/sfx_map_parchment_slide.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={170}>
        <Audio src={staticFile('sfx/sfx_camera_whoosh_transition.mp3')} volume={0.35} />
      </Sequence>
      <Sequence from={255}>
        <Audio src={staticFile('sfx/sfx_map_parchment_slide.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={345}>
        <Audio src={staticFile('sfx/sfx_sub_bass_concussion_drop.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={430}>
        <Audio src={staticFile('sfx/sfx_camera_whoosh_transition.mp3')} volume={0.35} />
      </Sequence>
      <Sequence from={520}>
        <Audio src={staticFile('sfx/sfx_map_parchment_slide.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={610}>
        <Audio src={staticFile('sfx/sfx_radar_crt_sweep_ping.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={700}>
        <Audio src={staticFile('sfx/sfx_sub_bass_concussion_drop.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={795}>
        <Audio src={staticFile('sfx/sfx_camera_whoosh_transition.mp3')} volume={0.35} />
      </Sequence>

      {/* 🎬 10 RAPID DOCUMENTARY CUTS (Strictly adhering to the 3-Second Ceiling) */}

      {/* CUT 1: Macro Orbital Establishing View (0-80 frames | 2.67s) */}
      <Sequence from={0} durationInFrames={80}>
        <MapShot
          startScale={1.0}
          endScale={1.08}
          startPan={[0, 0]}
          endPan={[-20, -10]}
          startRotateX={8}
          endRotateX={14}
          startRotateZ={0}
          endRotateZ={-2}
          origin="50% 40%"
          highlightLabel="NORTH ATLANTIC THEATER"
          labelCoords={['45%', '24%']}
        />
      </Sequence>

      {/* CUT 2: 2.5D Camera Dive into Western Europe (80-170 frames | 3.0s) */}
      <Sequence from={80} durationInFrames={90}>
        <MapShot
          startScale={1.12}
          endScale={1.35}
          startPan={[-10, 10]}
          endPan={[40, 50]}
          startRotateX={16}
          endRotateX={24}
          startRotateZ={-2}
          endRotateZ={-4}
          origin="45% 30%"
          highlightLabel="IRELAND"
          labelCoords={['44.8%', '25%']}
        />
      </Sequence>

      {/* CUT 3: Close Tactical Crop on Irish Coast (170-255 frames | 2.83s) */}
      <Sequence from={170} durationInFrames={85}>
        <MapShot
          startScale={1.8}
          endScale={2.1}
          startPan={[120, 110]}
          endPan={[150, 130]}
          startRotateX={22}
          endRotateX={28}
          startRotateZ={-3}
          endRotateZ={-5}
          origin="44% 28%"
          highlightLabel="ATLANTIC LITTORAL"
          labelCoords={['43%', '23%']}
        />
      </Sequence>

      {/* CUT 4: North Sea Maritime Route Reveal (255-345 frames | 3.0s) */}
      <Sequence from={255} durationInFrames={90}>
        <MapShot
          startScale={1.4}
          endScale={1.6}
          startPan={[0, 40]}
          endPan={[-40, 60]}
          startRotateX={24}
          endRotateX={20}
          startRotateZ={3}
          endRotateZ={6}
          origin="52% 25%"
          showPincers={true}
          pincerProgress={0.6}
          highlightLabel="NORTH SEA EXPEDITIONS"
          labelCoords={['53%', '22%']}
        />
      </Sequence>

      {/* CUT 5: Wide Strategic Pincer Convergence (345-430 frames | 2.83s) */}
      <Sequence from={345} durationInFrames={85}>
        <MapShot
          startScale={1.25}
          endScale={1.42}
          startPan={[20, 30]}
          endPan={[50, 45]}
          startRotateX={18}
          endRotateX={25}
          startRotateZ={-2}
          endRotateZ={-4}
          origin="48% 30%"
          showPincers={true}
          pincerProgress={0.9}
        />
      </Sequence>

      {/* CUT 6: Low-Altitude 2.5D Angled Sweep (430-520 frames | 3.0s) */}
      <Sequence from={430} durationInFrames={90}>
        <MapShot
          startScale={1.55}
          endScale={1.8}
          startPan={[70, 70]}
          endPan={[100, 90]}
          startRotateX={28}
          endRotateX={34}
          startRotateZ={-4}
          endRotateZ={-7}
          origin="46% 32%"
          showPincers={true}
          pincerProgress={1.0}
        />
      </Sequence>

      {/* CUT 7: High-Angle Tactical Flank Focus (520-610 frames | 3.0s) */}
      <Sequence from={520} durationInFrames={90}>
        <MapShot
          startScale={1.7}
          endScale={1.95}
          startPan={[-20, 80]}
          endPan={[20, 100]}
          startRotateX={20}
          endRotateX={26}
          startRotateZ={4}
          endRotateZ={1}
          origin="49% 26%"
          showPincers={true}
          pincerProgress={1.0}
        />
      </Sequence>

      {/* CUT 8: Coastal River Choke Points (610-700 frames | 3.0s) */}
      <Sequence from={610} durationInFrames={90}>
        <MapShot
          startScale={2.0}
          endScale={2.3}
          startPan={[130, 120]}
          endPan={[160, 140]}
          startRotateX={26}
          endRotateX={30}
          startRotateZ={-5}
          endRotateZ={-3}
          origin="45% 28%"
          showPincers={true}
          pincerProgress={1.0}
        />
      </Sequence>

      {/* CUT 9: Continental Scope Re-alignment (700-795 frames | 3.17s) */}
      <Sequence from={700} durationInFrames={95}>
        <MapShot
          startScale={1.35}
          endScale={1.15}
          startPan={[60, 40]}
          endPan={[10, 10]}
          startRotateX={22}
          endRotateX={15}
          startRotateZ={-3}
          endRotateZ={-1}
          origin="48% 34%"
          showPincers={true}
          pincerProgress={1.0}
        />
      </Sequence>

      {/* CUT 10: Final Dramatic Slow Pull-Out & Dissolve (795-900 frames | 3.5s) */}
      <Sequence from={795} durationInFrames={105}>
        <MapShot
          startScale={1.12}
          endScale={1.0}
          startPan={[10, 10]}
          endPan={[0, 0]}
          startRotateX={15}
          endRotateX={8}
          startRotateZ={-1}
          endRotateZ={0}
          origin="50% 35%"
          showPincers={true}
          pincerProgress={1.0}
        />
      </Sequence>
    </div>
  );
};
