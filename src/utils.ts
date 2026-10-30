import { MILLISECONDS_PER_DAY } from "./constants";

export function formatDate(date: Date): string {
	return new Date(date).toLocaleDateString("en-US", {
		month: "numeric",
		day: "numeric",
		year: "numeric",
	});
}

export function daysSince(date: string | Date): number {
	const now = new Date();
	const then = new Date(date);
	const diffTime = Math.abs(now.getTime() - then.getTime());
	return Math.floor(diffTime / MILLISECONDS_PER_DAY);
}

export function formatDays(days: number): string {
	if (days === 0) {
		return "today";
	}
	if (days === 1) {
		return "1 day";
	}
	return `${days} days`;
}
