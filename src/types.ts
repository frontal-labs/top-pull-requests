import type { Octokit } from "@octokit/rest";

// Derived from Octokit's own return types so the shapes always match the client.
type ListResponse<T extends (...args: never[]) => Promise<{ data: unknown }>> =
	Awaited<ReturnType<T>>["data"];

type RestApi = Octokit["rest"];

export type PullRequest = ListResponse<RestApi["pulls"]["list"]>[number];
export type GitHubReview = ListResponse<
	RestApi["pulls"]["listReviews"]
>[number];
export type GitHubComment = ListResponse<
	RestApi["issues"]["listComments"]
>[number];
export type GitHubReviewComment = ListResponse<
	RestApi["pulls"]["listReviewComments"]
>[number];
export type GitHubUser = NonNullable<PullRequest["user"]>;

export interface AnalyzedPR extends PullRequest {
	waitTime: number;
	reviewTime: number | null;
	totalComments: number;
	totalChanges: number;
	reviews: GitHubReview[];
	comments: GitHubComment[];
	reviewComments: GitHubReviewComment[];
	additions: number;
	deletions: number;
	changed_files: number;
}

export interface ReviewerStats {
	login: string;
	totalReviews: number;
	approvals: number;
	changesRequested: number;
	comments: number;
	approvalRate: number;
}

export interface AuthorStats {
	login: string;
	openPRs: number;
	totalAdditions: number;
	totalDeletions: number;
	totalChanges: number;
}

export interface PRCategories {
	waiting: AnalyzedPR[];
	largeChanges: AnalyzedPR[];
	hotReviews: AnalyzedPR[];
}

export interface SlackPayload {
	prelude: string;
	prSummary: string;
	waitingForReview: string;
	largeChanges: string;
	hotReviews: string;
	reviewerInsights: string;
	authorInsights: string;
	recommendations: string;
}
