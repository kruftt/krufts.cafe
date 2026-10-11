import { cn } from "@lib/utils";

export function Container({ children, className }: React.ComponentProps<'div'>) {
  return <div className={cn('content_container', className)}>{children}</div>;
}

export const Header = {
  Section: ({ children, className }: React.ComponentProps<'div'>) => {
    return <div className={cn('header__section', className)}>{children}</div>;
  },

  Title: ({ children, className }: React.ComponentProps<'h1'>) => {
    return <div className={cn('header__title', className)}>{children}</div>;
  },

  Item: ({ children, className }: React.ComponentProps<'div'>) => {
    return <div className={cn('header__item', className)}>{children}</div>;
  },
}

export const Panel = {
	Section: ({ children, className, ...rest }: React.ComponentProps<"div">) => {
		return <div className={cn('panel__section', className)} {...rest}>{children}</div>;
	},
	
  Title: ({ children, className }: React.ComponentProps<"div">) => {
		return <div className={cn('panel__title', className)}>{children}</div>;
	},
	
  Item: ({ children, className, ...rest }: React.ComponentProps<"div">) => {
		return <div className={cn('panel__item', className)} {...rest}>{children}</div>;
	},
};
