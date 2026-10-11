import * as z from 'zod'

export const Password = z.string().min(8).max(24).regex(
		/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_\-+=[\]\\|;:'"`,.<>/?]).*$/,
		{
			error:
				"Password must contain an uppercase letter, a lowercase letter, a number, and a special character.",
		},
	);


const Model = z.object({
	name: z
		.string()
		.min(1)
		.max(16)
		.regex(/^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/, {
			error: "Name must contain only letters, numbers, or spaces.",
		}),
	handle: z.string(),
	email: z.email(),
  password: Password,
});

export const Create = Model.omit({
  handle: true,
});

export const Login = z.object({
  email: z.email(),
  password: z.string(),
});

export const Names = Model.omit({
  email: true,
  password: true,
});


export type Create = z.infer<typeof Create>;
export type Login = z.infer<typeof Login>;
export type Names = z.infer<typeof Names>;
export type Password = z.infer<typeof Password>;