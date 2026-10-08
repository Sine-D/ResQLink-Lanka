/**
 * @file warningSchema.ts
 * @description Zod Validation Schemas and TypeScript DTO types for UC1: Disaster Early-Warning.
 * Enforces strict input validation for disaster warning creation, GeoJSON Polygon closure,
 * chronological date boundaries, and domain enumerations.
 *
 * @architecture Clean Architecture / Interface Segregation Principle (ISP)
 * @solid
 * - Single Responsibility Principle (SRP): Isolates pure input validation and schema invariants.
 * - Interface Segregation Principle (ISP): Exports concise, strictly-typed DTOs (CreateWarningInput).
 * - Open/Closed Principle (OCP): Enum definitions allow domain extension without schema breaking.
 */

import { z } from "zod";

// ============================================================================
// DOMAIN ENUMERATIONS
// ============================================================================

/**
 * Recognised natural hazard categories supported across Sri Lanka early-warning networks.
 */
export const hazardTypeEnum = z.enum([
  "Flood",
  "Landslide",
  "Cyclone",
  "Tsunami",
  "Drought",
  "FlashFlood",
]);

/**
 * Standard four-tier severity classification adhering to disaster response protocols.
 */
export const severityEnum = z.enum(["Low", "Medium", "High", "Critical"]);

// ============================================================================
// GEOSPATIAL VALIDATION SCHEMAS
// ============================================================================

/**
 * GeoJSON RFC 7946 Polygon schema with geometric closure validation.
 * Ensures the polygon has at least 4 coordinate vertices and that the first and
 * last coordinate pairs match identically to form a closed ring.
 */
export const geoJSONPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z
    .array(z.array(z.tuple([z.number(), z.number()])))
    .min(1, "Polygon must contain at least one ring")
    .refine((rings) => {
      const outerRing = rings[0];
      if (!outerRing || outerRing.length < 4) return false;
      const first = outerRing[0];
      const last = outerRing[outerRing.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    }, "Polygon outer ring must have at least 4 coordinate pairs and close on itself"),
});

// ============================================================================
// WARNING DRAFT INPUT SCHEMA
// ============================================================================

/**
 * Complete Zod schema for validating DMC Officer warning draft submissions.
 */
export const createWarningSchema = z
  .object({
    hazardType: hazardTypeEnum,
    severity: severityEnum,
    districtName: z.string().min(1, "District name is required"),
    coordinates: geoJSONPolygonSchema,
    instructions: z.string().min(10, "Instructions must be at least 10 characters long"),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: "Valid Until date must be strictly after Valid From date",
    path: ["validUntil"],
  });

/**
 * TypeScript type inferred directly from createWarningSchema for compile-time type safety.
 */
export type CreateWarningInput = z.infer<typeof createWarningSchema>;
