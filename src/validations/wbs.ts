import { z } from "zod";

export const CreateWbsItemSchema = z.object({
  projectId: z.string().cuid(),
  parentId: z.string().cuid().optional().nullable(),
  description: z.string().min(1).max(300),
  unit: z.string().max(20).optional().nullable(),
  formula: z.string().max(500).optional().nullable(),
  quantity: z.coerce.number().positive().optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
  isGroup: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const UpdateWbsItemSchema = CreateWbsItemSchema.omit({
  projectId: true,
}).partial();

export const ReorderWbsSchema = z.object({
  projectId: z.string().cuid(),
  items: z.array(
    z.object({
      id: z.string().cuid(),
      parentId: z.string().cuid().nullable(),
      sortOrder: z.number().int(),
    })
  ),
});

export const UpsertWbsVariableSchema = z.object({
  wbsItemId: z.string().cuid(),
  name: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Variable names must be letters/numbers/underscore"),
  label: z.string().max(60).optional().nullable(),
  value: z.coerce.number(),
});

export type CreateWbsItemInput = z.infer<typeof CreateWbsItemSchema>;
export type UpdateWbsItemInput = z.infer<typeof UpdateWbsItemSchema>;
export type UpsertWbsVariableInput = z.infer<typeof UpsertWbsVariableSchema>;
