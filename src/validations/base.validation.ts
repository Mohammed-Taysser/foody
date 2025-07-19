import { z } from 'zod';

const basePaginationSchema = z.object({
  page: z.coerce.number().positive().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(10),
});

const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

type BasePaginationInput = z.infer<typeof basePaginationSchema>;
type DateRangeInput = z.infer<typeof dateRangeSchema>;

export type { BasePaginationInput, DateRangeInput };
export { basePaginationSchema, dateRangeSchema };
