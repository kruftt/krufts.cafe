import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { CreateUser } from "./create-user";
import { LoginForm } from "./login-form";

export function LoginPopover() {
	return (
		<Popover>
			<PopoverTrigger render={<Button className="drop-shadow-md/30" />}>
				login
			</PopoverTrigger>
			<PopoverContent>
				<LoginForm />
				<CreateUser />
			</PopoverContent>
		</Popover>
	);
}
