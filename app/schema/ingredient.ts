import { AMOUNT_REGEX } from '@lib/amount'
import * as z from 'zod'

export type Create = z.infer<typeof Create>;
export const Create = z.object({
  groupId: z.int(),
  index: z.int(),
});

export type Update = z.infer<typeof Update>;
export const Update = z.object({
	amount: z.string().regex(AMOUNT_REGEX, "Invalid format").optional(),
	units: z.string().optional(),
	name: z.string().optional(),
	preparation: z.string().optional(),
});

