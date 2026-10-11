import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return hours
		? `${hours} hr${hours > 1 ? 's' : ''} ${remainder > 0 ? `${remainder} min` : ""}`
		: `${minutes} min`;
}
