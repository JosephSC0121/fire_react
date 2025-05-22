import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2VzYXJtbG5keiIsImEiOiJjbTk3N3puMjYwNHQyMmpwbG1zYWt5OWU3In0.msaBQJxEyKXA0_uCo1rz3w';

const WKTtoRings = (wkt) => {
  return wkt
    .slice(9).slice(0, -2)
    .split(',')
    .map(coordinates =>
      coordinates.split(' ').filter(el => el !== '').map(parseFloat)
    );
};

const FireSimulationMap = ({ timeSeries }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-116, 33.9],
      zoom: 10,
      attributionControl: false
    });
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const sourceId = 'Source-fire-simulation';
    const fillLayer = 'Layer-fire-simulation-fill';
    const outlineLayer = 'Layer-fire-simulation-outline';

    const records = timeSeries
      .filter(r => r.step <= currentStep)
      .sort((a, b) => b.step - a.step);

    const allFeatures = records.flatMap(record =>
      record.polygons_wkt.map(wkt => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [WKTtoRings(wkt)]
        },
        properties: {
          step: record.step,
          time: record.time
        }
      }))
    );

    const jitterify = (features, distance = 0.0003) =>
      features.map(feat => {
        const coords = feat.geometry.coordinates[0].map(([lon, lat]) => [
          lon + (Math.random() * 2 - 1) * distance,
          lat + (Math.random() * 2 - 1) * distance
        ]);
        coords.push(coords[0]);
        return {
          ...feat,
          geometry: { ...feat.geometry, coordinates: [coords] }
        };
      });

    const jagged = jitterify(allFeatures);

    const maxStep = timeSeries.length - 1;
    const q1 = maxStep / 4;
    const q2 = maxStep / 2;
    const q3 = 3 * maxStep / 4;
    const colorRamp = [
      'interpolate', ['linear'], ['get', 'step'],
      0, 'rgb(0,0,0)',
      q1, 'rgb(0,0,0)',
      q2, 'rgb(255, 94, 36)',
      q3, 'rgb(255, 94, 36)',
      maxStep, 'rgb(255,234,71)'
    ];

    if (!map.current.getSource(sourceId)) {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: jagged }
      });

      map.current.addLayer({
        id: fillLayer,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': colorRamp,
          'fill-opacity': 0.8
        }
      });

      map.current.addLayer({
        id: outlineLayer,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': 'rgba(255, 255, 255, 0.7)',
          'line-width': 1
        }
      });
    } else {
      map.current.getSource(sourceId).setData({
        type: 'FeatureCollection',
        features: jagged
      });
    }
  }, [currentStep, timeSeries]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev =>
        prev + 1 < timeSeries.length ? prev + 1 : 0
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timeSeries.length]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
  );
};

export default FireSimulationMap;