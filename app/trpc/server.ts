import { auth } from "@lib/auth-server";
import { initTRPC, TRPCError } from "@trpc/server";

export const createContext = async ({ request }: { request: Request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	return { session };
};

const t = initTRPC
	.context<Awaited<ReturnType<typeof createContext>>>()
	.create();

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
	const session = ctx.session;
	if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
	return next({ ctx: { session } });
});

export const router = t.router;
export const procedure = t.procedure;
export const authedProcedure = t.procedure.use(isAuthenticated);
