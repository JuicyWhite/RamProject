import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  code: z.string().max(20).optional().nullable(),
  client: z.string().max(120).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  region: z.string().optional().nullable(),
  contractType: z.enum(["PRIVATE", "GOVERNMENT"]).default("PRIVATE"),
  philgepsRef: z.string().max(50).optional().nullable(),
  permitNumber: z.string().max(80).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  budget: z.coerce.number().positive().optional().nullable(),
  contractAmount: z.coerce.number().positive().optional().nullable(),
  overheadPct: z.coerce.number().min(0).max(100).default(0),
  profitPct: z.coerce.number().min(0).max(100).default(0),
  vatPct: z.coerce.number().min(0).max(100).default(12),
  status: z
    .enum(["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"])
    .default("DRAFT"),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
