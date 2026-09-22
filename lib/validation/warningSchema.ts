import { z } from "zod";

export const hazardTypeEnum = z.enum([
  "Flood",
  "Landslide",
  "Cyclone",
  "Tsunami",
  "Drought",
  "FlashFlood",
]);

export const severityEnum = z.enum(["Low", "Medium", "High", "Critical"]);

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

export type CreateWarningInput = z.infer<typeof createWarningSchema>;
