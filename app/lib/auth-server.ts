import { prisma } from "@lib/prisma";
import { User } from "@schema";
import { generateHandle } from "@services/user";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),

	emailAndPassword: { enabled: true },

	user: {
		additionalFields: {
			handle: {
				type: "string",
				required: false,
				unique: true,
			},
		},
	},

	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const result = User.Create.omit({ password: true }).safeParse(user);
					if (!result.success) throw new Error("Invalid user data.");

					const handle = await generateHandle(user.name);
					return { data: { ...user, handle } };
				},
			},
		},
	},

	trustedOrigins: [
		...(process.env.APP_URL ? process.env.APP_URL.split(',') : []),
	],
});
