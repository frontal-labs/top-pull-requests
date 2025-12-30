import { describe, expect, test } from "bun:test";

describe("Sanity Check", () => {
	test("basic math works", () => {
		expect(1 + 1).toBe(2);
	});

	test("string matching", () => {
		expect("hello world").toContain("hello");
	});
});
