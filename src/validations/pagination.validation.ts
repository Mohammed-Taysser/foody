import { z } from 'zod';

const basePaginationSchema = z.object({
  page: z.coerce.number().positive().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(10),
});

type BasePaginationInput = z.infer<typeof basePaginationSchema>;

export default basePaginationSchema;

export type { BasePaginationInput };
