import { describe, expect, it } from "vitest";
import {
	formatHotReviewPR,
	formatLargeChangePR,
	formatPR,
} from "../src/format";
import type { AnalyzedPR } from "../src/types";

describe("format", () => {
	const mockPR = {
		number: 123,
		head: { ref: "feature/test" },
		title: "Test PR",
		user: { login: "testuser" },
		assignees: [],
		requested_reviewers: [],
		waitTime: 3,
		totalChanges: 600,
		additions: 400,
		deletions: 200,
		changed_files: 10,
		totalComments: 6,
		reviewComments: [],
	} as unknown as AnalyzedPR;

	it("formats PR correctly", () => {
		const result = formatPR(mockPR);
		expect(result).toContain("PR #123");
		expect(result).toContain("Test PR");
		expect(result).toContain("testuser");
	});

	it("formats large change PR correctly", () => {
		const result = formatLargeChangePR(mockPR);
		expect(result).toContain("PR #123");
		expect(result).toContain("600 lines changed");
	});

	it("formats hot review PR correctly", () => {
		const result = formatHotReviewPR(mockPR);
		expect(result).toContain("PR #123");
		expect(result).toContain("6 comments");
	});
});
