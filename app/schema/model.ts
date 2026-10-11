import * as z from 'zod'

export const Id = z.object({ id: z.int() });
export type Id = z.infer<typeof Id>;
