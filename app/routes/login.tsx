import { LoginForm } from "@components/app";
import { auth } from "@lib/auth-server";
import { redirect, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await auth.api.getSession({ headers: request.headers });
	const url = new URL(request.url);
	const redirectTo = url.searchParams.get("redirect") ?? "/";
	if (session) throw redirect(redirectTo);
	return { redirectTo };
}

export default function LoginPage() {
	const { redirectTo } = useLoaderData();
	const navigate = useNavigate();

	return (
		<div className="m-auto max-w-80 pt-12">
			<LoginForm onSuccess={() => navigate(redirectTo)} />
		</div>
	);
}
