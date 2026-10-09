"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon path issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletDistrictMapProps {
  districtName: string;
  center: [number, number];
  polygonGeoJsonRing: number[][]; // [ [lng, lat], ... ]
}

// Controller component to smoothly fly/pan the map when the selected district changes
function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 10, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function LeafletDistrictMap({
  districtName,
  center,
  polygonGeoJsonRing,
}: LeafletDistrictMapProps) {
  // Convert GeoJSON [lng, lat] coordinates to Leaflet [lat, lng] format
  const leafletPolygonPositions: [number, number][] = polygonGeoJsonRing.map(([lng, lat]) => [
    lat,
    lng,
  ]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ width: "100%", height: "100%", background: "#0f172a" }}
      >
        <MapViewController center={center} />

        {/* Real OpenStreetMap TileLayer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* Real Geofenced Boundary Polygon in vibrant warning red */}
        <Polygon
          positions={leafletPolygonPositions}
          pathOptions={{
            color: "#dc2626", // Red-600
            fillColor: "#ef4444", // Red-500
            fillOpacity: 0.28,
            weight: 3,
            dashArray: "6, 6",
          }}
        >
          <Popup>
            <div className="p-1 text-slate-900">
              <strong className="block text-xs font-bold text-red-600">
                GEOFENCE ACTIVE
              </strong>
              <span className="text-xs font-semibold">
                {districtName} District Target Boundary
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Cellular tower and emergency push broadcasts geofenced to this polygon.
              </p>
            </div>
          </Popup>
        </Polygon>

        {/* Center Target Marker */}
        <Marker position={center}>
          <Popup>
            <div className="p-1 text-slate-900">
              <strong className="block text-xs font-bold text-slate-900">
                {districtName} Command Focus
              </strong>
              <span className="text-[11px] text-slate-600">
                Lat: {center[0].toFixed(4)}, Lng: {center[1].toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating GIS Info Badges */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-none flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-white text-[11px] font-bold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Sri Lanka Real-Time GIS Geofence: {districtName}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 text-[10px] font-mono shadow">
          Center: [{center[0].toFixed(4)}, {center[1].toFixed(4)}]
        </span>
      </div>

      <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold shadow-lg">
          Polygon Vertices: {leafletPolygonPositions.length} (Closed)
        </span>
      </div>
    </div>
  );
}
