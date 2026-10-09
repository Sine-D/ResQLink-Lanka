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
          
          let color = "#10b981"; // emerald-500
          if (shelter.status === "FULL") color = "#ef4444"; // red-500
          else if (shelter.status === "NEAR CAPACITY") color = "#f97316"; // orange-500

          return (
            <React.Fragment key={shelter._id}>
              <Circle center={[lat, lng]} radius={1500} pathOptions={{ color, fillColor: color, fillOpacity: 0.2, stroke: false }} />
              <Marker position={[lat, lng]}>
                <Popup>
                  <div className="text-sm font-bold text-slate-800">{shelter.name}</div>
                  <div className="text-xs text-slate-600">Capacity: {shelter.occupancy || 0}/{shelter.capacity}</div>
                  <div className="text-xs text-slate-600 font-bold mt-1">Status: {shelter.status}</div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
