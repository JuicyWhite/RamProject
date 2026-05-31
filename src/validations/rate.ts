import { z } from "zod";

export const CreateRateItemSchema = z.object({
  code: z.string().max(30).optional().nullable(),
  description: z.string().min(2).max(300),
  category: z.enum(["LABOR", "MATERIAL", "EQUIPMENT", "SUBCONTRACT", "OTHER"]),
  unit: z.string().min(1).max(20),
  unitRate: z.coerce.number().min(0),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const UpdateRateItemSchema = CreateRateItemSchema.partial();

export const CreateRateOverrideSchema = z.object({
  projectId: z.string().cuid(),
  rateItemId: z.string().cuid(),
  unitRate: z.coerce.number().min(0),
});

export const CreateEstimateLineItemSchema = z.object({
  wbsItemId: z.string().cuid(),
  rateItemId: z.string().cuid(),
  quantity: z.coerce.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const UpdateEstimateLineItemSchema = CreateEstimateLineItemSchema.omit({
  wbsItemId: true,
  rateItemId: true,
}).partial();

export type CreateRateItemInput = z.infer<typeof CreateRateItemSchema>;
export type UpdateRateItemInput = z.infer<typeof UpdateRateItemSchema>;
export type CreateEstimateLineItemInput = z.infer<typeof CreateEstimateLineItemSchema>;
