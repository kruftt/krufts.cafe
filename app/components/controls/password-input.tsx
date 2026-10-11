import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordInput ({className, ...rest}: React.ComponentProps<'input'>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-9", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
		);
}