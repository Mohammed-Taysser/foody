import { z } from 'zod';

const baseOrderSchema = z.object({
  restaurantId: z.string(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .min(1),
  tableNumber: z.number().optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).default(0),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED']),
});

const payOrderSchema = z.object({
  method: z.enum(['CASH', 'CARD', 'ONLINE']),
});

const createOrderSchema = baseOrderSchema.extend({});
const updateOrderSchema = baseOrderSchema.partial();

type CreateOrderInput = z.infer<typeof createOrderSchema>;
type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
type PayOrderInput = z.infer<typeof payOrderSchema>;

export { createOrderSchema, payOrderSchema, updateOrderSchema, updateOrderStatusSchema };
export type { CreateOrderInput, PayOrderInput, UpdateOrderInput, UpdateOrderStatusInput };
