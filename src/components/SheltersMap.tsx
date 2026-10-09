"use client";
import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function SheltersMap({ shelters }: { shelters: any[] }) {
  // Center roughly in Sri Lanka or around existing shelters
  const mapCenter: [number, number] = shelters.length > 0 && shelters[0].coordinates?.lat 
    ? [shelters[0].coordinates.lat, shelters[0].coordinates.lng] 
    : [6.9271, 79.8612];

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={mapCenter} zoom={10} scrollWheelZoom={true} style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shelters.map((shelter) => {
          const lat = shelter.coordinates?.lat;
          const lng = shelter.coordinates?.lng;
          if (!lat || !lng) return null;
          
          const occupancy = shelter.occupancy || 0;
          const capacity = shelter.capacity || 1;
          const percentage = Math.min((occupancy / capacity) * 100, 100);

          let color = "#10b981"; // emerald-500
          let statusText = "AVAILABLE";
          if (percentage >= 100) { color = "#ef4444"; statusText = "FULL"; }
          else if (percentage >= 80) { color = "#f97316"; statusText = "NEAR CAPACITY"; }

          const customIcon = L.divIcon({
            className: "custom-pin",
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="#1e293b" stroke-width="1.5">
                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                     <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
                   </svg>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          return (
            <React.Fragment key={shelter._id}>
              <Circle center={[lat, lng]} radius={1500} pathOptions={{ color, fillColor: color, fillOpacity: 0.2, stroke: false }} />
              <Marker position={[lat, lng]} icon={customIcon}>
                <Popup>
                  <div className="text-sm font-bold text-slate-800">{shelter.name}</div>
                  <div className="text-xs text-slate-600">Capacity: {occupancy}/{capacity}</div>
                  <div className="text-xs text-slate-600 font-bold mt-1">Status: {statusText}</div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      <style>{`
        .custom-pin { background: transparent; border: none; }
      `}</style>
    </div>
  );
}
