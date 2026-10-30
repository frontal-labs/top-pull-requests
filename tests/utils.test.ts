import { describe, expect, it } from "vitest";
import { daysSince, formatDate, formatDays } from "../src/utils";

describe("utils", () => {
	it("formats days correctly", () => {
		expect(formatDays(0)).toBe("today");
		expect(formatDays(1)).toBe("1 day");
		expect(formatDays(5)).toBe("5 days");
	});

	it("calculates days since", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		expect(daysSince(yesterday)).toBe(1);
	});

	it("formats date", () => {
		const date = new Date("2024-01-15T00:00:00Z");
		const formatted = formatDate(date);
		expect(formatted).toBeTruthy();
	});
});
