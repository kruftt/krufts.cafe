import { Container, Header, Panel } from "@components/app";
import { PasswordForm, ProfileForm } from "@components/user";
import { requireAuth } from "@lib/auth-loader";
import { redirect } from "react-router";
import type { Route } from "./+types/profile";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await requireAuth(request);
	if (!session.user) throw redirect("/");
	return { user: session.user };
}

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
	const { user } = loaderData;

	return (
		<Container>
			<Header.Section className="userpage__header">
				<Header.Title>
					<h2>User Profile</h2>
				</Header.Title>
			</Header.Section>
			<Panel.Section className="max-w-120 m-auto">
				<ProfileForm user={user} />
			</Panel.Section>
			<Panel.Section className="max-w-120 mx-auto mt-6">
				<PasswordForm />
			</Panel.Section>
		</Container>
	);
}
