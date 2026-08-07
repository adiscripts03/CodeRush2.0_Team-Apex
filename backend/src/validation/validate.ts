import type { ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>, value: unknown): T {
  return schema.parse(value);
}
