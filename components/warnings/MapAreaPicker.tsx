"use client";

import React, { useEffect, useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";

interface MapAreaPickerProps {
  districtName: string;
  onDistrictChange: (district: string, polygonCoordinates: number[][][]) => void;
}

// Coordinate boundaries for Sri Lanka districts
const DISTRICT_BOUNDS: Record<string, { lat: number; lng: number; poly: number[][][] }> = {
  Colombo: {
    lat: 6.9271,
    lng: 79.8612,
    poly: [
      [
        [79.84, 6.90],
        [79.88, 6.90],
        [79.88, 6.96],
        [79.84, 6.96],
        [79.84, 6.90],
      ],
    ],
  },
  Gampaha: {
    lat: 7.0873,
    lng: 79.9925,
    poly: [
      [
        [79.95, 7.05],
        [80.05, 7.05],
        [80.05, 7.15],
        [79.95, 7.15],
        [79.95, 7.05],
      ],
    ],
  },
  Kalutara: {
    lat: 6.5854,
    lng: 79.9607,
    poly: [
      [
        [79.92, 6.52],
        [80.02, 6.52],
        [80.02, 6.64],
        [79.92, 6.64],
        [79.92, 6.52],
      ],
    ],
  },
  Kandy: {
    lat: 7.2906,
    lng: 80.6337,
    poly: [
      [
        [80.58, 7.24],
        [80.68, 7.24],
        [80.68, 7.34],
        [80.58, 7.34],
        [80.58, 7.24],
      ],
    ],
  },
  Galle: {
    lat: 6.0535,
    lng: 80.221,
    poly: [
      [
        [80.16, 6.00],
        [80.28, 6.00],
        [80.28, 6.10],
        [80.16, 6.10],
        [80.16, 6.00],
      ],
    ],
  },
  Ratnapura: {
    lat: 6.6828,
    lng: 80.3992,
    poly: [
      [
        [80.34, 6.62],
        [80.46, 6.62],
        [80.46, 6.74],
        [80.34, 6.74],
        [80.34, 6.62],
      ],
    ],
  },
};

export const MapAreaPicker: React.FC<MapAreaPickerProps> = ({ districtName, onDistrictChange }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(districtName || "Colombo");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSelect = (district: string) => {
    setSelectedDistrict(district);
    const info = DISTRICT_BOUNDS[district] || DISTRICT_BOUNDS["Colombo"];
    onDistrictChange(district, info.poly);
  };

  const currentInfo = DISTRICT_BOUNDS[selectedDistrict] || DISTRICT_BOUNDS["Colombo"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-200">
          Target District & Geofenced Boundary Polygon
        </label>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          Selected: <strong className="text-white">{selectedDistrict}</strong>
        </span>
      </div>

      {/* District Quick Select Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Object.keys(DISTRICT_BOUNDS).map((district) => (
          <button
            key={district}
            type="button"
            onClick={() => handleSelect(district)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
              selectedDistrict === district
                ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
            }`}
          >
            {selectedDistrict === district && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            {district}
          </button>
        ))}
      </div>

      {/* Map Interactive Polygon Canvas Box */}
      <div className="relative w-full h-64 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col items-center justify-center">
        {isClient ? (
          <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                OpenStreetMap GIS Coordinates: [{currentInfo.lat.toFixed(4)}, {currentInfo.lng.toFixed(4)}]
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-mono">
                Polygon Vertices: 5 (Closed)
              </span>
            </div>

            {/* Visual Geofenced Polygon Map Display */}
            <div className="my-auto text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 animate-pulse">
                <MapPin className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">
                Geofence Active: {selectedDistrict} District Polygon
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Target polygon coordinates calculated for broadcast alert distribution across cellular towers in {selectedDistrict}.
              </p>
            </div>

            <div className="text-center font-mono text-[10px] text-slate-500 truncate">
              Coordinates Ring: {JSON.stringify(currentInfo.poly[0])}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Loading GIS Map Component...</div>
        )}
      </div>
    </div>
  );
};

export default MapAreaPicker;
