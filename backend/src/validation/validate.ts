import type { z, ZodTypeAny } from "zod";

export function validate<TSchema extends ZodTypeAny>(schema: TSchema, value: unknown): z.output<TSchema> {
  return schema.parse(value) as z.output<TSchema>;
}
