import { z } from 'zod';

const basePaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(10),
});

export default basePaginationSchema;
