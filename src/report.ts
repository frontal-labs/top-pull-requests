import {
	TOP_AUTHORS_COUNT,
	TOP_LABELS_COUNT,
	TOP_REVIEWERS_COUNT,
} from "./constants";
import { formatHotReviewPR, formatLargeChangePR, formatPR } from "./format";
import type {
	AnalyzedPR,
	AuthorStats,
	PullRequest,
	ReviewerStats,
	SlackPayload,
} from "./types";
import { formatDate } from "./utils";

export function calculateAverageWaitTime(analyzed: AnalyzedPR[]): string {
	if (analyzed.length === 0) {
		return "0";
	}
	return (
		analyzed.reduce((sum, pr) => sum + pr.waitTime, 0) / analyzed.length
	).toFixed(1);
}

export function calculateAverageReviewTime(analyzed: AnalyzedPR[]): string {
	const prsWithReviews = analyzed.filter((pr) => pr.reviewTime !== null);
	if (prsWithReviews.length === 0) {
		return "0";
	}
	return (
		prsWithReviews.reduce((sum, pr) => sum + (pr.reviewTime || 0), 0) /
		prsWithReviews.length
	).toFixed(1);
}

export function generateSlackPayload(options: {
	prs: PullRequest[];
	analyzed: AnalyzedPR[];
	waiting: AnalyzedPR[];
	largeChanges: AnalyzedPR[];
	hotReviews: AnalyzedPR[];
	reviewers: ReviewerStats[];
	authors: AuthorStats[];
	recommendations: string[];
}): SlackPayload {
	const {
		prs,
		analyzed,
		waiting,
		largeChanges,
		hotReviews,
		reviewers,
		authors,
		recommendations,
	} = options;
	const today = formatDate(new Date());
	const totalPRs = prs.length;

	const avgWaitTime = calculateAverageWaitTime(analyzed);
	const avgReviewTime = calculateAverageReviewTime(analyzed);

	const labelCounts = new Map<string, number>();
	for (const pr of prs) {
		if (pr.labels) {
			for (const label of pr.labels) {
				if (label.name) {
					labelCounts.set(label.name, (labelCounts.get(label.name) || 0) + 1);
				}
			}
		}
	}
	const topLabels = Array.from(labelCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_LABELS_COUNT)
		.map(([name, count]) => `${name} (${count})`)
		.join(", ");

	const payload: SlackPayload = {
		prelude: `Top Pull Requests Report (${today})\nThis report shows the most important pull requests that need attention.`,
		prSummary: `Pull Request Summary\n• Total Open PRs: ${totalPRs}\n• Average Wait Time: ${avgWaitTime} days\n• Average Review Time: ${avgReviewTime} days${topLabels ? `\n• Top Labels: ${topLabels}` : ""}`,
		waitingForReview:
			waiting.length > 0
				? `Waiting for Review (${waiting.length} PRs)\n${waiting.map((pr) => formatPR(pr)).join("\n")}`
				: "Waiting for Review\n• No PRs waiting longer than the threshold",
		largeChanges:
			largeChanges.length > 0
				? `Large Changes (${largeChanges.length} PRs)\n${largeChanges.map((pr) => formatLargeChangePR(pr)).join("\n")}`
				: "Large Changes\n• No PRs exceed the large change threshold",
		hotReviews:
			hotReviews.length > 0
				? `Hot Reviews (${hotReviews.length} PRs)\n${hotReviews.map((pr) => formatHotReviewPR(pr)).join("\n")}`
				: "Hot Reviews\n• No PRs exceed the hot review threshold",
		reviewerInsights:
			reviewers.length > 0
				? `Reviewer Insights\n${reviewers
						.slice(0, TOP_REVIEWERS_COUNT)
						.map(
							(r) =>
								`• @${r.login}: ${r.totalReviews} reviews (${r.approvalRate}% approval rate)\n  ${r.approvals} approved, ${r.changesRequested} changes requested`,
						)
						.join("\n")}`
				: "Reviewer Insights\n• No review activity in the analyzed period",
		authorInsights:
			authors.length > 0
				? `Author Insights\n${authors
						.slice(0, TOP_AUTHORS_COUNT)
						.map(
							(a) =>
								`• @${a.login}: ${a.openPRs} open PRs\n  ${a.totalChanges} lines changed (+${a.totalAdditions} -${a.totalDeletions})`,
						)
						.join("\n")}`
				: "Author Insights\n• No author activity in the analyzed period",
		recommendations: `Recommendations\n${recommendations.map((r) => `• ${r}`).join("\n")}`,
	};

	return payload;
}
