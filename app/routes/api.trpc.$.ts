import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCRouter } from "../trpc/router";
import { createContext } from "../trpc/server";

export async function loader({ request }: { request: Request }) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: request,
		router: TRPCRouter,
		createContext: ({ req }) => createContext({ request: req }),
	});
}

export async function action({ request }: { request: Request }) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: request,
		router: TRPCRouter,
		createContext: ({ req }) => createContext({ request: req }),
	});
}
