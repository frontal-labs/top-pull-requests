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
	additions: number;
	changed_files: number;
	comments: GitHubComment[];
	deletions: number;
	reviewComments: GitHubReviewComment[];
	reviews: GitHubReview[];
	reviewTime: number | null;
	totalChanges: number;
	totalComments: number;
	waitTime: number;
}

export interface ReviewerStats {
	approvalRate: number;
	approvals: number;
	changesRequested: number;
	comments: number;
	login: string;
	totalReviews: number;
}

export interface AuthorStats {
	login: string;
	openPRs: number;
	totalAdditions: number;
	totalChanges: number;
	totalDeletions: number;
}

export interface PRCategories {
	hotReviews: AnalyzedPR[];
	largeChanges: AnalyzedPR[];
	waiting: AnalyzedPR[];
}

export interface SlackPayload {
	authorInsights: string;
	hotReviews: string;
	largeChanges: string;
	prelude: string;
	prSummary: string;
	recommendations: string;
	reviewerInsights: string;
	waitingForReview: string;
}
