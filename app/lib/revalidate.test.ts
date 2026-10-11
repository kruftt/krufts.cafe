import { describe, expect, it } from "bun:test";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { skipRevalidateOnQueryChange } from "./revalidate";

const args = (from: string, to: string, extra: Partial<ShouldRevalidateFunctionArgs> = {}) =>
	({
		currentUrl: new URL(from, "http://x"),
		nextUrl: new URL(to, "http://x"),
		defaultShouldRevalidate: true,
		...extra,
	}) as ShouldRevalidateFunctionArgs;

describe("skipRevalidateOnQueryChange", () => {
	it("skips when only q changes", () => {
		expect(skipRevalidateOnQueryChange(args("/", "/?q=soup"))).toBe(false);
		expect(skipRevalidateOnQueryChange(args("/?q=sou", "/?q=soup"))).toBe(false);
		expect(skipRevalidateOnQueryChange(args("/?q=soup", "/"))).toBe(false);
	});

	it("revalidates on an explicit revalidation of the same URL", () => {
		expect(skipRevalidateOnQueryChange(args("/?q=soup", "/?q=soup"))).toBe(true);
	});

	it("revalidates when another param or the path changes", () => {
		expect(skipRevalidateOnQueryChange(args("/?q=soup", "/?q=pie&x=1"))).toBe(true);
		expect(skipRevalidateOnQueryChange(args("/?q=soup", "/my-recipes?q=pie"))).toBe(true);
	});

	it("revalidates after a form submission", () => {
		expect(skipRevalidateOnQueryChange(args("/", "/?q=soup", { formMethod: "POST" }))).toBe(true);
	});
});
