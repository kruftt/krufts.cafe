import { SERVES_REGEX } from "@lib/amount";
import * as z from "zod";
import { Body } from "./recipe-body";

export const Name = z
	.string()
	.min(1)
	.max(64)
	.regex(/^[\p{L}\p{N} '\-&,]+$/u, { error: "Invalid characters." });


export type Fields = z.infer<typeof Fields>;
export const Fields = z.object({
	name: Name,
	tags: z.array(z.string().min(1).max(32)).max(20),
	published: z.boolean(),
	prepTime: z.coerce.number().int().min(0),
	cookTime: z.coerce.number().int().min(0),
	serves: z.string().regex(SERVES_REGEX, "Invalid format"),
	intro: z.string().max(5000),
});

export type Save = z.infer<typeof Save>;
export const Save = Fields.extend({
	id: z.int(),
	version: z.int().min(0),
	body: Body,
});
