import type { ShouldRevalidateFunctionArgs } from "react-router";

// List pages filter on the client, so a change to only `?q=` must not refetch the list.
export function skipRevalidateOnQueryChange({
	currentUrl,
	nextUrl,
	formMethod,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
	if (formMethod || currentUrl.pathname !== nextUrl.pathname) return defaultShouldRevalidate;

	const current = new URLSearchParams(currentUrl.search);
	const next = new URLSearchParams(nextUrl.search);
	if (current.get("q") === next.get("q")) return defaultShouldRevalidate;

	current.delete("q");
	next.delete("q");
	current.sort();
	next.sort();
	return current.toString() === next.toString() ? false : defaultShouldRevalidate;
}
