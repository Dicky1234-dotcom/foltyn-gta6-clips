import React, { useEffect, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SatelliteMapProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  highlightCountryCode?: string;
}

export const SatelliteMapLibre: React.FC<SatelliteMapProps> = ({
  center = [-10, 52],
  zoom = 3.2,
  pitch = 20,
  bearing = 0,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender('Loading MapLibre satellite tiles', { timeoutInMilliseconds: 15000 }));

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'esri-satellite': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'esri-satellite',
            },
          ],
        },
        center: center,
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        interactive: false,
        attributionControl: false,
      });

      map.on('error', (e) => {
        console.error('MAPLIBRE_INTERNAL_ERROR:', e);
        continueRender(handle);
      });

      map.on('load', () => {
        console.log('MAPLIBRE_LOADED_SUCCESSFULLY');
        setTimeout(() => {
          continueRender(handle);
        }, 1500);
      });
    } catch (err) {
      console.error('MAPLIBRE_INIT_EXCEPTION:', err);
      continueRender(handle);
    }
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a1020',
      }}
    >
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
