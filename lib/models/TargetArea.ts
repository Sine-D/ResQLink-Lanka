export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
}

export interface ITargetArea {
  districtName: string;
  coordinates: GeoJSONPolygon;
  estimatedReach: number;
}
