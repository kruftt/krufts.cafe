import { Button } from "@components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { usePins } from "@hooks/pins";
import { auth, type SessionUser } from "@lib/auth-client";
import { Link, useNavigate, useRevalidator } from "react-router";

export function UserMenu({ user }: { user: SessionUser }) {
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const { clearPins } = usePins();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button className="drop-shadow-md/30 bg-cafe-blue-1 hover:bg-cafe-blue-2 dark:bg-cafe-blue-1-dark dark:hover:bg-cafe-blue-2-dark text-white/90" />}>
				{user.name}
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Link tabIndex={0} className="w-1/1" to="/my-recipes/">My Recipes</Link>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Link tabIndex={0} className="w-1/1" to="/bookmarks/">Bookmarks</Link>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Link tabIndex={0} className="w-1/1" to="/meal-plan/">Meal Plan</Link>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Link tabIndex={0} className="w-1/1" to="/profile/">Profile</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="cursor-pointer"
						variant="destructive"
						onClick={() => {
							auth.signOut({
								fetchOptions: {
									onSuccess: () => {
										clearPins();
										revalidator.revalidate();
									},
								},
							});
							navigate("/");
						}}
					>
						Logout
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
