import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const addSpikes = (coords, strength = 0.0015, spikeChance = 0.9) => {
  return coords.map(([lon, lat], i) => {
    if (Math.random() < spikeChance) {
      const angle = Math.random() * 2 * Math.PI;
      const offset = strength * (0.5 + Math.random() * 2); 
      return [
        lon + Math.cos(angle) * offset,
        lat + Math.sin(angle) * offset
      ];
    }
    return [lon, lat];
  });
};


const WKTtoRings = (wkt) => {
  const coords = wkt.slice(9, -2).split(',').map(pair => {
    const [lon, lat] = pair.trim().split(' ').map(Number);
    return [lon, lat];
  });
  coords.push(coords[0]); 
  const spikyCoords = addSpikes(coords);
  return [spikyCoords];
};


const FireMap = ({ timeSeries, step }) => {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);

  const features = timeSeries
    .filter(r => r.step <= step)
    .flatMap(r =>
      r.polygons_wkt.map(wkt => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: WKTtoRings(wkt)
        },
        properties: {
          step: r.step,
          time: r.time,
          intensity: Math.max(0, 20 - (step - r.step)) 
        }
      }))
    );

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-116, 33.9],
      zoom: 11,
      pitch: 45,
      bearing: -20,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('fire', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      map.addLayer({
        id: 'fire-heatmap',
        type: 'heatmap',
        source: 'fire',
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            20, 1
          ],
          'heatmap-intensity': 2,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.2, 'rgba(255, 217, 0, 0.4)',
            0.4, 'rgba(146, 0, 0, 0.97)',
            0.8, 'rgba(221, 54, 4, 0.98)',
            1.2, 'rgba(0, 0, 0, 0.9)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 10,
            13, 20,
            16, 40
          ],
          'heatmap-opacity': 0.8
        }
      });

    });
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const source = map.getSource('fire');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [features]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />;
};

export default FireMap;
