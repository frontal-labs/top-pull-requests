import { describe, expect, it } from "vitest";
import {
	formatHotReviewPR,
	formatLargeChangePR,
	formatPR,
} from "../src/format";
import type { AnalyzedPR } from "../src/types";

describe("format", () => {
	const mockPR = {
		additions: 400,
		assignees: [],
		changed_files: 10,
		deletions: 200,
		head: { ref: "feature/test" },
		number: 123,
		requested_reviewers: [],
		reviewComments: [],
		title: "Test PR",
		totalChanges: 600,
		totalComments: 6,
		user: { login: "testuser" },
		waitTime: 3,
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
