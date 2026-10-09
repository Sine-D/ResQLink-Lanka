"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, CheckCircle2, Globe2 } from "lucide-react";

// Dynamically import Leaflet map client component without SSR
const LeafletDistrictMap = dynamic(() => import("./LeafletDistrictMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-xs gap-3">
      <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      <span className="font-semibold text-slate-300">Loading Sri Lanka Real-Time GIS Map...</span>
      <span className="text-[11px] text-slate-500">Connecting to OpenStreetMap tile servers</span>
    </div>
  ),
});

interface MapAreaPickerProps {
  districtName: string;
  onDistrictChange: (district: string, polygonCoordinates: number[][][]) => void;
}

// 25 Districts of Sri Lanka with accurate geographic center points and closed 5-vertex polygons
export const DISTRICT_BOUNDS: Record<
  string,
  { lat: number; lng: number; poly: number[][][] }
> = {
  Colombo: {
    lat: 6.9271,
    lng: 79.8612,
    poly: [
      [
        [79.84, 6.9],
        [79.92, 6.9],
        [79.92, 6.97],
        [79.84, 6.97],
        [79.84, 6.9],
      ],
    ],
  },
  Gampaha: {
    lat: 7.0873,
    lng: 79.9925,
    poly: [
      [
        [79.94, 7.04],
        [80.06, 7.04],
        [80.06, 7.16],
        [79.94, 7.16],
        [79.94, 7.04],
      ],
    ],
  },
  Kalutara: {
    lat: 6.5854,
    lng: 79.9607,
    poly: [
      [
        [79.91, 6.51],
        [80.03, 6.51],
        [80.03, 6.65],
        [79.91, 6.65],
        [79.91, 6.51],
      ],
    ],
  },
  Kandy: {
    lat: 7.2906,
    lng: 80.6337,
    poly: [
      [
        [80.57, 7.23],
        [80.69, 7.23],
        [80.69, 7.35],
        [80.57, 7.35],
        [80.57, 7.23],
      ],
    ],
  },
  Matale: {
    lat: 7.4675,
    lng: 80.6234,
    poly: [
      [
        [80.55, 7.41],
        [80.68, 7.41],
        [80.68, 7.53],
        [80.55, 7.53],
        [80.55, 7.41],
      ],
    ],
  },
  "Nuwara Eliya": {
    lat: 6.9497,
    lng: 80.7891,
    poly: [
      [
        [80.73, 6.89],
        [80.85, 6.89],
        [80.85, 7.01],
        [80.73, 7.01],
        [80.73, 6.89],
      ],
    ],
  },
  Galle: {
    lat: 6.0535,
    lng: 80.221,
    poly: [
      [
        [80.15, 5.99],
        [80.29, 5.99],
        [80.29, 6.11],
        [80.15, 6.11],
        [80.15, 5.99],
      ],
    ],
  },
  Matara: {
    lat: 5.9496,
    lng: 80.5353,
    poly: [
      [
        [80.48, 5.89],
        [80.60, 5.89],
        [80.60, 6.01],
        [80.48, 6.01],
        [80.48, 5.89],
      ],
    ],
  },
  Hambantota: {
    lat: 6.1248,
    lng: 81.1185,
    poly: [
      [
        [81.04, 6.06],
        [81.18, 6.06],
        [81.18, 6.19],
        [81.04, 6.19],
        [81.04, 6.06],
      ],
    ],
  },
  Jaffna: {
    lat: 9.6615,
    lng: 80.0255,
    poly: [
      [
        [79.96, 9.6],
        [80.1, 9.6],
        [80.1, 9.73],
        [79.96, 9.73],
        [79.96, 9.6],
      ],
    ],
  },
  Kilinochchi: {
    lat: 9.3803,
    lng: 80.377,
    poly: [
      [
        [80.31, 9.32],
        [80.45, 9.32],
        [80.45, 9.44],
        [80.31, 9.44],
        [80.31, 9.32],
      ],
    ],
  },
  Mannar: {
    lat: 8.981,
    lng: 79.9044,
    poly: [
      [
        [79.84, 8.92],
        [79.97, 8.92],
        [79.97, 9.04],
        [79.84, 9.04],
        [79.84, 8.92],
      ],
    ],
  },
  Vavuniya: {
    lat: 8.7514,
    lng: 80.4971,
    poly: [
      [
        [80.43, 8.69],
        [80.56, 8.69],
        [80.56, 8.81],
        [80.43, 8.81],
        [80.43, 8.69],
      ],
    ],
  },
  Mullaitivu: {
    lat: 9.2671,
    lng: 80.8142,
    poly: [
      [
        [80.74, 9.2],
        [80.88, 9.2],
        [80.88, 9.33],
        [80.74, 9.33],
        [80.74, 9.2],
      ],
    ],
  },
  Batticaloa: {
    lat: 7.717,
    lng: 81.6998,
    poly: [
      [
        [81.63, 7.65],
        [81.77, 7.65],
        [81.77, 7.78],
        [81.63, 7.78],
        [81.63, 7.65],
      ],
    ],
  },
  Ampara: {
    lat: 7.2912,
    lng: 81.6747,
    poly: [
      [
        [81.6, 7.23],
        [81.74, 7.23],
        [81.74, 7.36],
        [81.6, 7.36],
        [81.6, 7.23],
      ],
    ],
  },
  Trincomalee: {
    lat: 8.5874,
    lng: 81.2152,
    poly: [
      [
        [81.14, 8.52],
        [81.28, 8.52],
        [81.28, 8.65],
        [81.14, 8.65],
        [81.14, 8.52],
      ],
    ],
  },
  Kurunegala: {
    lat: 7.4863,
    lng: 80.3623,
    poly: [
      [
        [80.29, 7.42],
        [80.43, 7.42],
        [80.43, 7.55],
        [80.29, 7.55],
        [80.29, 7.42],
      ],
    ],
  },
  Puttalam: {
    lat: 8.0362,
    lng: 79.8283,
    poly: [
      [
        [79.76, 7.97],
        [79.9, 7.97],
        [79.9, 8.1],
        [79.76, 8.1],
        [79.76, 7.97],
      ],
    ],
  },
  Anuradhapura: {
    lat: 8.3114,
    lng: 80.4037,
    poly: [
      [
        [80.34, 8.24],
        [80.48, 8.24],
        [80.48, 8.37],
        [80.34, 8.37],
        [80.34, 8.24],
      ],
    ],
  },
  Polonnaruwa: {
    lat: 7.9403,
    lng: 81.0188,
    poly: [
      [
        [80.95, 7.87],
        [81.09, 7.87],
        [81.09, 8.01],
        [80.95, 8.01],
        [80.95, 7.87],
      ],
    ],
  },
  Badulla: {
    lat: 6.9934,
    lng: 81.055,
    poly: [
      [
        [80.99, 6.93],
        [81.12, 6.93],
        [81.12, 7.06],
        [80.99, 7.06],
        [80.99, 6.93],
      ],
    ],
  },
  Monaragala: {
    lat: 6.8728,
    lng: 81.3507,
    poly: [
      [
        [81.28, 6.8],
        [81.42, 6.8],
        [81.42, 6.94],
        [81.28, 6.94],
        [81.28, 6.8],
      ],
    ],
  },
  Ratnapura: {
    lat: 6.6828,
    lng: 80.3992,
    poly: [
      [
        [80.33, 6.61],
        [80.47, 6.61],
        [80.47, 6.75],
        [80.33, 6.75],
        [80.33, 6.61],
      ],
    ],
  },
  Kegalle: {
    lat: 7.2513,
    lng: 80.3464,
    poly: [
      [
        [80.28, 7.19],
        [80.41, 7.19],
        [80.41, 7.31],
        [80.28, 7.31],
        [80.28, 7.19],
      ],
    ],
  },
};

const POPULAR_DISTRICTS = ["Colombo", "Gampaha", "Kalutara", "Kandy", "Galle", "Ratnapura"];

export const MapAreaPicker: React.FC<MapAreaPickerProps> = ({
  districtName,
  onDistrictChange,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState(districtName || "Colombo");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (districtName && districtName !== selectedDistrict) {
      setSelectedDistrict(districtName);
    }
  }, [districtName]);

  const handleSelect = (district: string) => {
    setSelectedDistrict(district);
    const info = DISTRICT_BOUNDS[district] || DISTRICT_BOUNDS["Colombo"];
    onDistrictChange(district, info.poly);
  };

  const currentInfo = DISTRICT_BOUNDS[selectedDistrict] || DISTRICT_BOUNDS["Colombo"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Globe2 className="w-4 h-4 text-red-500" />
          <span>Interactive Sri Lanka GIS Geofence Map</span>
        </label>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          Target District: <strong className="text-white">{selectedDistrict}</strong>
        </span>
      </div>

      {/* District Selector: Quick Buttons + Full Dropdown */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {POPULAR_DISTRICTS.map((district) => (
            <button
              key={district}
              type="button"
              onClick={() => handleSelect(district)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
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

        {/* Full 25 District Dropdown for Complete Sri Lanka Coverage */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 whitespace-nowrap">All 25 Districts:</span>
          <select
            value={selectedDistrict}
            onChange={(e) => handleSelect(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-red-500 font-medium"
          >
            {Object.keys(DISTRICT_BOUNDS).map((district) => (
              <option key={district} value={district}>
                {district} District
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real Sri Lanka OpenStreetMap Box */}
      <div className="relative w-full h-[400px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {isClient ? (
          <LeafletDistrictMap
            districtName={selectedDistrict}
            center={[currentInfo.lat, currentInfo.lng]}
            polygonGeoJsonRing={currentInfo.poly[0]}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            Initializing Leaflet OpenStreetMap...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
        <span>GIS Center: [{currentInfo.lat.toFixed(4)}, {currentInfo.lng.toFixed(4)}]</span>
        <span>Polygon Coordinates Ring: 5 vertices (closed)</span>
      </div>
    </div>
  );
};

export default MapAreaPicker;
