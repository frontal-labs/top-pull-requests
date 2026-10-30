import type { Octokit } from "@octokit/rest";
import {
	HOT_REVIEW_THRESHOLD,
	LARGE_CHANGE_THRESHOLD,
	WAITING_THRESHOLD_DAYS,
} from "./constants";
import type {
	AnalyzedPR,
	AuthorStats,
	GitHubComment,
	GitHubReview,
	GitHubReviewComment,
	PRCategories,
	PullRequest,
	ReviewerStats,
} from "./types";
import { daysSince } from "./utils";

export async function fetchPullRequests(
	octokit: Octokit,
	owner: string,
	repo: string,
	numOfDays: number,
	maxPRs: number,
): Promise<PullRequest[]> {
	const since = new Date();
	since.setDate(since.getDate() - numOfDays);

	try {
		const { data: prs } = await octokit.rest.pulls.list({
			owner,
			repo,
			state: "open",
			sort: "updated",
			direction: "desc",
			per_page: maxPRs,
		});

		const recentPRs = prs.filter((pr: PullRequest) => {
			const created = new Date(pr.created_at);
			const updated = new Date(pr.updated_at);
			return created >= since || updated >= since;
		});

		return recentPRs.slice(0, maxPRs);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("Error fetching pull requests:", message);
		throw error;
	}
}

export async function fetchPRDetails(
	octokit: Octokit,
	owner: string,
	repo: string,
	pr: PullRequest,
): Promise<{
	reviews: GitHubReview[];
	comments: GitHubComment[];
	reviewComments: GitHubReviewComment[];
}> {
	try {
		const [reviews, comments, reviewComments] = await Promise.all([
			octokit.rest.pulls.listReviews({
				owner,
				repo,
				pull_number: pr.number,
			}),
			octokit.rest.issues.listComments({
				owner,
				repo,
				issue_number: pr.number,
			}),
			octokit.rest.pulls.listReviewComments({
				owner,
				repo,
				pull_number: pr.number,
			}),
		]);

		return {
			reviews: reviews.data,
			comments: comments.data,
			reviewComments: reviewComments.data,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error fetching details for PR #${pr.number}:`, message);
		return {
			reviews: [],
			comments: [],
			reviewComments: [],
		};
	}
}

export function calculateWaitTime(
	pr: PullRequest,
	reviews: GitHubReview[],
): number {
	if (reviews.length === 0) {
		return daysSince(pr.created_at);
	}

	const nonPendingReviews = reviews.filter((r) => r.state !== "PENDING");

	if (nonPendingReviews.length === 0) {
		return daysSince(pr.created_at);
	}

	return 0;
}

export function calculateReviewTime(
	pr: PullRequest,
	reviews: GitHubReview[],
): number | null {
	const firstSubmittedAt = reviews
		.map((r) => (r.state === "PENDING" ? undefined : r.submitted_at))
		.filter((submittedAt): submittedAt is string => Boolean(submittedAt))
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

	if (!firstSubmittedAt) {
		return null;
	}

	return daysSince(pr.created_at) - daysSince(firstSubmittedAt);
}

export async function analyzePRs(
	octokit: Octokit,
	owner: string,
	repo: string,
	prs: PullRequest[],
): Promise<AnalyzedPR[]> {
	const analyzedPRs: AnalyzedPR[] = [];

	for (const pr of prs) {
		const prDetails = await octokit.rest.pulls.get({
			owner,
			repo,
			pull_number: pr.number,
		});
		const fullPR = prDetails.data;
		const details = await fetchPRDetails(octokit, owner, repo, pr);
		const waitTime = calculateWaitTime(pr, details.reviews);
		const reviewTime = calculateReviewTime(pr, details.reviews);
		const totalComments =
			details.comments.length + details.reviewComments.length;
		const totalChanges = (fullPR.additions || 0) + (fullPR.deletions || 0);

		analyzedPRs.push({
			...pr,
			waitTime,
			reviewTime,
			totalComments,
			totalChanges,
			reviews: details.reviews,
			comments: details.comments,
			reviewComments: details.reviewComments,
			additions: fullPR.additions || 0,
			deletions: fullPR.deletions || 0,
			changed_files: fullPR.changed_files || 0,
		});
	}

	return analyzedPRs;
}

export function categorizePRs(prs: AnalyzedPR[]): PRCategories {
	const waiting: AnalyzedPR[] = [];
	const largeChanges: AnalyzedPR[] = [];
	const hotReviews: AnalyzedPR[] = [];

	for (const pr of prs) {
		if (pr.waitTime >= WAITING_THRESHOLD_DAYS) {
			waiting.push(pr);
		}

		if (pr.totalChanges >= LARGE_CHANGE_THRESHOLD) {
			largeChanges.push(pr);
		}

		if (pr.totalComments >= HOT_REVIEW_THRESHOLD) {
			hotReviews.push(pr);
		}
	}

	waiting.sort((a, b) => b.waitTime - a.waitTime);
	largeChanges.sort((a, b) => b.totalChanges - a.totalChanges);
	hotReviews.sort((a, b) => b.totalComments - a.totalComments);

	return { waiting, largeChanges, hotReviews };
}

interface ReviewerMapEntry {
	reviews: GitHubReview[];
	approvals: number;
	changesRequested: number;
	comments: number;
}

export function analyzeReviewers(prs: AnalyzedPR[]): ReviewerStats[] {
	const reviewerMap = new Map<string, ReviewerMapEntry>();

	for (const pr of prs) {
		for (const review of pr.reviews) {
			if (review.state === "PENDING" || !review.user) {
				continue;
			}

			const reviewer = review.user.login;
			let stats = reviewerMap.get(reviewer);
			if (!stats) {
				stats = { reviews: [], approvals: 0, changesRequested: 0, comments: 0 };
				reviewerMap.set(reviewer, stats);
			}
			stats.reviews.push(review);

			if (review.state === "APPROVED") {
				stats.approvals += 1;
			} else if (review.state === "CHANGES_REQUESTED") {
				stats.changesRequested += 1;
			} else if (review.state === "COMMENTED") {
				stats.comments += 1;
			}
		}
	}

	const reviewers = Array.from(reviewerMap.entries()).map(([login, stats]) => {
		const total = stats.reviews.length;
		const approvalRate =
			total > 0 ? Math.round((stats.approvals / total) * 100) : 0;

		return {
			login,
			totalReviews: total,
			approvals: stats.approvals,
			changesRequested: stats.changesRequested,
			comments: stats.comments,
			approvalRate,
		};
	});

	return reviewers.sort((a, b) => b.totalReviews - a.totalReviews);
}

interface AuthorMapEntry {
	prs: AnalyzedPR[];
	totalAdditions: number;
	totalDeletions: number;
}

export function analyzeAuthors(prs: AnalyzedPR[]): AuthorStats[] {
	const authorMap = new Map<string, AuthorMapEntry>();

	for (const pr of prs) {
		const author = pr.user?.login;
		if (!author) continue;
		let stats = authorMap.get(author);
		if (!stats) {
			stats = { prs: [], totalAdditions: 0, totalDeletions: 0 };
			authorMap.set(author, stats);
		}
		stats.prs.push(pr);
		stats.totalAdditions += pr.additions || 0;
		stats.totalDeletions += pr.deletions || 0;
	}

	const authors = Array.from(authorMap.entries()).map(([login, stats]) => ({
		login,
		openPRs: stats.prs.length,
		totalAdditions: stats.totalAdditions,
		totalDeletions: stats.totalDeletions,
		totalChanges: stats.totalAdditions + stats.totalDeletions,
	}));

	return authors.sort((a, b) => b.openPRs - a.openPRs);
}

export function generateRecommendations(
	prs: AnalyzedPR[],
	waiting: AnalyzedPR[],
	largeChanges: AnalyzedPR[],
): string[] {
	const recommendations: string[] = [];

	if (waiting.length > 0) {
		recommendations.push(
			`Review PRs waiting more than ${WAITING_THRESHOLD_DAYS} days (${waiting.length} PRs)`,
		);
	}

	const unassignedPRs = prs.filter(
		(pr) => !pr.assignees || pr.assignees.length === 0,
	);
	if (unassignedPRs.length > 0) {
		recommendations.push(
			`Assign reviewers to unassigned PRs (${unassignedPRs.length} PRs)`,
		);
	}

	if (largeChanges.length > 0) {
		recommendations.push(
			`Break down large PRs into smaller, focused changes (${largeChanges.length} PRs)`,
		);
	}

	const prsWithoutLabels = prs.filter(
		(pr) => !pr.labels || pr.labels.length === 0,
	);
	if (prsWithoutLabels.length > 0) {
		recommendations.push(
			`Add labels to PRs for better categorization (${prsWithoutLabels.length} PRs)`,
		);
	}

	return recommendations.length > 0
		? recommendations
		: ["All PRs are in good shape! Keep up the great work!"];
}
