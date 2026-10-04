import { z } from "zod";

export const resourceCategoryEnum = z.enum(["FOOD", "WATER", "MEDICAL", "SHELTER", "CLOTHING"]);
export const availabilityStatusEnum = z.enum(["AVAILABLE", "LOW_STOCK", "DEPLETED", "UNAVAILABLE"]);

export const resourceFilterSchema = z.object({
  category: resourceCategoryEnum.optional(),
  agency: z.string().optional(),
  district: z.string().optional(),
  status: availabilityStatusEnum.optional(),
  minQuantity: z.coerce.number().min(0).optional(),
});

export const allocateItemSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  agency: z.string().optional(),
});

export const multiAgencyAllocateSchema = z.object({
  items: z.array(allocateItemSchema).min(1, "At least one resource item must be selected for allocation"),
  district: z.string().min(1, "Destination district is required"),
  requirementNotes: z.string().optional(),
  centerName: z.string().optional(),
});

export type ResourceFilterInput = z.infer<typeof resourceFilterSchema>;
export type AllocateItemInput = z.infer<typeof allocateItemSchema>;
export type MultiAgencyAllocateInput = z.infer<typeof multiAgencyAllocateSchema>;
