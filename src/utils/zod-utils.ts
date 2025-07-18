import { z, ZodType } from 'zod';

function zodBoolean() {
  return z
    .union([
      z.boolean(),
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
      z.literal('yes'),
      z.literal('no'),
    ])
    .transform((val) => {
      if (val === true || val === 'true' || val === '1' || val === 'yes') return true;
      return false;
    });
}

function zodParseEnumList<T>(values: T[]): ZodType<T[]> {
  return z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .refine((values) => values.every((v) => values.includes(v)), {
      message: `Must be a comma-separated list of valid enum values: ${values.join(', ')}`,
    }) as unknown as ZodType<T[]>;
}

export { zodBoolean, zodParseEnumList };
