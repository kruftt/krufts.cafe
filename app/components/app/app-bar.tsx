import { buttonVariants } from "@components/ui/button";
import { useUser } from "@hooks/session";
import { cn } from "@lib/utils";
import { SearchIcon } from "lucide-react";
import { BsCupHotFill } from "react-icons/bs";
import { Link } from "react-router";
import { LoginPopover, UserMenu } from "./menu";
import { themeAtom } from '@atoms/theme';
import { useAtom } from "jotai";

export function AppBar() {
	const user = useUser();
  const isLoggedIn = user !== null;
  const [theme] = useAtom(themeAtom);

	return (
		<header
			className={cn(
				"relative z-10 w-1/1 h-16 p-4 text-white shadow-[0_0_3px_3px_rgba(0,0,0,0.2)]",
				"bg-cafe-blue-1",
				"dark:bg-cafe-blue-1-d",
			)}
		>
			<Link
				to="/"
				tabIndex={0}
				className={`${buttonVariants()} absolute top-3 left-2 h-10 rounded-2xl! drop-shadow-md/50 opacity-90`}
			>
				<BsCupHotFill className="w-5! h-5!" color={`${theme ? "white" : "black"}`} />
				<h1 className="text-md mx-1 relative top-0.5 hidden sm:block">
					Kruft's Cafe
				</h1>
			</Link>
			<form
				method="get"
				action="/"
        className={cn(
          theme ? "bg-black/78" : "bg-gray-100/78",
          "m-auto flex items-center w-64 rounded-full border border-white/20 px-3 py-1 gap-2"
        )}
			>
				<input
					name="q"
					type="text"
					placeholder="Search all recipes.."
          className={cn(theme
            ? "flex-1 bg-transparent outline-none text-white placeholder:text-white/50 text-sm"
            : "flex-1 bg-transparent outline-none text-black placeholder:text-black/50 text-sm"
          )}
				/>
        <button type="submit" className={cn(
          theme ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
        )}>
					<SearchIcon size={16} />
				</button>
			</form>
			<div className="absolute right-2 top-3.5 drop-shadow-md/30 opacity-90">
				{isLoggedIn && user ? <UserMenu user={user} /> : <LoginPopover />}
			</div>
		</header>
	);
}
