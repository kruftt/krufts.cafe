import type { auth as authServer } from "@lib/auth-server";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	// baseURL: "http://localhost:5173",
	plugins: [inferAdditionalFields<typeof authServer>()],
});

export type SessionUser = typeof auth.$Infer.Session.user;
