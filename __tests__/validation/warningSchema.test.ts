import {
  createWarningSchema,
  geoJSONPolygonSchema,
  HAZARD_TYPES,
  SEVERITY_LEVELS,
} from "../../lib/validation/warningSchema";
import { ZodError } from "zod";

describe("UC1: Warning Validation Schemas Comprehensive Test Suite", () => {
  const validCoordinates = [
    [
      [79.84, 6.90] as [number, number],
      [79.88, 6.90] as [number, number],
      [79.88, 6.96] as [number, number],
      [79.84, 6.96] as [number, number],
      [79.84, 6.90] as [number, number],
    ],
  ];

  const validWarningPayload = {
    hazardType: "Flood" as const,
    severity: "High" as const,
    districtName: "Colombo",
    coordinates: {
      type: "Polygon" as const,
      coordinates: validCoordinates,
    },
    instructions: "Evacuate low-lying river areas along Kelani River immediately.",
    validFrom: new Date(2026, 6, 15, 10, 0),
    validUntil: new Date(2026, 6, 16, 10, 0),
  };

  describe("1. Hazard Type Constraints", () => {
    test.each(HAZARD_TYPES)("accepts valid domain hazard type: %s", (hazard) => {
      const payload = { ...validWarningPayload, hazardType: hazard };
      expect(() => createWarningSchema.parse(payload)).not.toThrow();
    });

    test("rejects unsupported hazard type (e.g. Earthquake)", () => {
      const payload = { ...validWarningPayload, hazardType: "Earthquake" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("rejects missing hazard type", () => {
      const { hazardType, ...rest } = validWarningPayload;
      expect(() => createWarningSchema.parse(rest)).toThrow(ZodError);
    });

    test("rejects empty string hazard type", () => {
      const payload = { ...validWarningPayload, hazardType: "" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });
  });

  describe("2. Severity Level Constraints", () => {
    test.each(SEVERITY_LEVELS)("accepts valid domain severity level: %s", (severity) => {
      const payload = { ...validWarningPayload, severity };
      expect(() => createWarningSchema.parse(payload)).not.toThrow();
    });

    test("rejects unsupported severity (e.g. Extreme / Severe)", () => {
      const payload = { ...validWarningPayload, severity: "Extreme" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("rejects lowercase severity level", () => {
      const payload = { ...validWarningPayload, severity: "critical" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });
  });

  describe("3. District Name Constraints", () => {
    test("accepts valid Sri Lankan district string", () => {
      const payload = { ...validWarningPayload, districtName: "Ratnapura" };
      const parsed = createWarningSchema.parse(payload);
      expect(parsed.districtName).toBe("Ratnapura");
    });

    test("rejects empty district name", () => {
      const payload = { ...validWarningPayload, districtName: "" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("rejects missing district name", () => {
      const { districtName, ...rest } = validWarningPayload;
      expect(() => createWarningSchema.parse(rest)).toThrow(ZodError);
    });
  });

  describe("4. Safety Directives & Instructions Constraints (Min 10 Chars)", () => {
    test("accepts instructions with exactly 10 characters", () => {
      const payload = { ...validWarningPayload, instructions: "1234567890" };
      expect(() => createWarningSchema.parse(payload)).not.toThrow();
    });

    test("rejects instructions with 9 characters (strictly below minimum)", () => {
      const payload = { ...validWarningPayload, instructions: "123456789" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("rejects empty instructions", () => {
      const payload = { ...validWarningPayload, instructions: "" };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("accepts extensive paragraph instructions with Sinhala/Tamil evacuation details", () => {
      const payload = {
        ...validWarningPayload,
        instructions: "Immediate evacuation ordered. කැලණි ගඟ දෙපස ජනතාව වහාම ආරක්ෂිත ස්ථාන කරා යන්න.",
      };
      expect(() => createWarningSchema.parse(payload)).not.toThrow();
    });
  });

  describe("5. Time Window & Chronology Constraints", () => {
    test("accepts validUntil strictly after validFrom", () => {
      const from = new Date(2026, 6, 1, 10, 0);
      const until = new Date(2026, 6, 1, 12, 0);
      const payload = { ...validWarningPayload, validFrom: from, validUntil: until };
      expect(() => createWarningSchema.parse(payload)).not.toThrow();
    });

    test("rejects validUntil strictly equal to validFrom (zero duration)", () => {
      const exactTime = new Date(2026, 6, 1, 10, 0);
      const payload = { ...validWarningPayload, validFrom: exactTime, validUntil: exactTime };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("rejects inverted dates where validUntil is before validFrom", () => {
      const from = new Date(2026, 6, 1, 12, 0);
      const until = new Date(2026, 6, 1, 10, 0);
      const payload = { ...validWarningPayload, validFrom: from, validUntil: until };
      expect(() => createWarningSchema.parse(payload)).toThrow(ZodError);
    });

    test("parses ISO string dates transparently into Date objects", () => {
      const payload = {
        ...validWarningPayload,
        validFrom: "2026-07-01T10:00:00.000Z",
        validUntil: "2026-07-02T10:00:00.000Z",
      };
      const parsed = createWarningSchema.parse(payload);
      expect(parsed.validFrom).toBeInstanceOf(Date);
      expect(parsed.validUntil).toBeInstanceOf(Date);
    });
  });

  describe("6. GeoJSON Boundary Polygon Constraints", () => {
    test("accepts closed 5-vertex polygon where first vertex equals last vertex", () => {
      const poly = {
        type: "Polygon" as const,
        coordinates: validCoordinates,
      };
      expect(() => geoJSONPolygonSchema.parse(poly)).not.toThrow();
    });

    test("accepts minimal closed 4-vertex triangle polygon", () => {
      const minimalPoly = {
        type: "Polygon" as const,
        coordinates: [
          [
            [80.0, 7.0] as [number, number],
            [80.1, 7.0] as [number, number],
            [80.05, 7.1] as [number, number],
            [80.0, 7.0] as [number, number],
          ],
        ],
      };
      expect(() => geoJSONPolygonSchema.parse(minimalPoly)).not.toThrow();
    });

    test("rejects unclosed polygon where first and last vertices differ", () => {
      const unclosed = {
        type: "Polygon" as const,
        coordinates: [
          [
            [79.84, 6.90] as [number, number],
            [79.88, 6.90] as [number, number],
            [79.88, 6.96] as [number, number],
            [79.84, 6.96] as [number, number], // Missing closure to 79.84, 6.90
          ],
        ],
      };
      expect(() => geoJSONPolygonSchema.parse(unclosed)).toThrow(ZodError);
    });

    test("rejects polygon with fewer than 4 vertices", () => {
      const tooFew = {
        type: "Polygon" as const,
        coordinates: [
          [
            [79.84, 6.90] as [number, number],
            [79.88, 6.90] as [number, number],
            [79.84, 6.90] as [number, number],
          ],
        ],
      };
      expect(() => geoJSONPolygonSchema.parse(tooFew)).toThrow(ZodError);
    });

    test("rejects invalid GeoJSON type other than 'Polygon'", () => {
      const invalidType = {
        type: "Point",
        coordinates: [79.84, 6.90],
      };
      expect(() => geoJSONPolygonSchema.parse(invalidType)).toThrow(ZodError);
    });
  });

  describe("7. Optional Linked Source Incident ID", () => {
    test("accepts optional sourceIncidentId when provided", () => {
      const payload = {
        ...validWarningPayload,
        sourceIncidentId: "INC-2026-101",
      };
      const parsed = createWarningSchema.parse(payload);
      expect(parsed.sourceIncidentId).toBe("INC-2026-101");
    });

    test("accepts undefined sourceIncidentId for standalone warnings", () => {
      const parsed = createWarningSchema.parse(validWarningPayload);
      expect(parsed.sourceIncidentId).toBeUndefined();
    });
  });
});
