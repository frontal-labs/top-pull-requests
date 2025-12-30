#!/usr/bin/env bun

import { join } from "@frontal/shared-tools/path-utils";
import { Octokit } from "@octokit/rest";

// Configuration constants
const NUM_OF_DAYS = 7;
const MAX_PRS = 20;
const WAITING_THRESHOLD_DAYS = 3;
const LARGE_CHANGE_THRESHOLD = 500;
const HOT_REVIEW_THRESHOLD = 5;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY =
	MILLISECONDS_PER_SECOND *
	SECONDS_PER_MINUTE *
	MINUTES_PER_HOUR *
	HOURS_PER_DAY;
const PERCENTAGE_MULTIPLIER = 100;
const TOP_LABELS_COUNT = 3;
const TOP_REVIEWERS_COUNT = 5;
const TOP_AUTHORS_COUNT = 5;

// Get output directory from command line arguments or environment
const outputDir = process.argv[2] || process.env.OUTPUT_DIR || "./output";

// Validate environment variables
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
	console.error(
		"Error: GH_TOKEN or GITHUB_TOKEN environment variable is required",
	);
	process.exit(1);
}

// Get repository from environment or default to current repo
const repository = process.env.GH_REPOSITORY || process.env.GITHUB_REPOSITORY;
if (!repository?.includes("/")) {
	console.error("Error: GH_REPOSITORY must be in format owner/repo");
	process.exit(1);
}

const [owner, repo] = repository.split("/");

// Initialize GitHub client
const octokit = new Octokit({
	auth: token,
});

// Utility functions
function formatDate(date) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "numeric",
		day: "numeric",
		year: "numeric",
	});
}

function daysSince(date) {
	const now = new Date();
	const then = new Date(date);
	const diffTime = Math.abs(now - then);
	return Math.floor(diffTime / MILLISECONDS_PER_DAY);
}

function formatDays(days) {
	if (days === 0) {
		return "today";
	}
	if (days === 1) {
		return "1 day";
	}
	return `${days} days`;
}

// Fetch pull requests
async function fetchPullRequests() {
	const since = new Date();
	since.setDate(since.getDate() - NUM_OF_DAYS);

	try {
		const { data: prs } = await octokit.rest.pulls.list({
			owner,
			repo,
			state: "open",
			sort: "updated",
			direction: "desc",
			per_page: MAX_PRS,
		});

		// Filter PRs created or updated within the time range
		const recentPRs = prs.filter((pr) => {
			const created = new Date(pr.created_at);
			const updated = new Date(pr.updated_at);
			return created >= since || updated >= since;
		});

		return recentPRs.slice(0, MAX_PRS);
	} catch (error) {
		console.error("Error fetching pull requests:", error.message);
		throw error;
	}
}

// Fetch PR details including reviews and comments
async function fetchPRDetails(pr) {
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
		console.error(
			`Error fetching details for PR #${pr.number}:`,
			error.message,
		);
		return {
			reviews: [],
			comments: [],
			reviewComments: [],
		};
	}
}

// Calculate wait time (current days waiting for review)
// Returns 0 if PR has reviews (no longer waiting), otherwise days since creation
function calculateWaitTime(pr, reviews) {
	// If PR has no reviews, it's waiting since creation
	if (reviews.length === 0) {
		return daysSince(pr.created_at);
	}

	// Check if there are any non-pending reviews
	const nonPendingReviews = reviews.filter((r) => r.state !== "PENDING");

	// If all reviews are pending, PR is still waiting
	if (nonPendingReviews.length === 0) {
		return daysSince(pr.created_at);
	}

	// PR has reviews, so it's no longer waiting for initial review
	// Return 0 to indicate it's not currently waiting
	return 0;
}

// Calculate review time (time from creation to first review)
function calculateReviewTime(pr, reviews) {
	if (reviews.length === 0) {
		return null;
	}

	const firstReview = reviews
		.filter((r) => r.state !== "PENDING")
		.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))[0];

	if (!firstReview) {
		return null;
	}

	return daysSince(pr.created_at) - daysSince(firstReview.submitted_at);
}

// Analyze PRs
async function analyzePRs(prs) {
	const analyzedPRs = [];

	for (const pr of prs) {
		const details = await fetchPRDetails(pr);
		const waitTime = calculateWaitTime(pr, details.reviews);
		const reviewTime = calculateReviewTime(pr, details.reviews);
		const totalComments =
			details.comments.length + details.reviewComments.length;
		const totalChanges = pr.additions + pr.deletions;

		analyzedPRs.push({
			...pr,
			waitTime,
			reviewTime,
			totalComments,
			totalChanges,
			reviews: details.reviews,
			comments: details.comments,
			reviewComments: details.reviewComments,
		});
	}

	return analyzedPRs;
}

// Categorize PRs
function categorizePRs(prs) {
	const waiting = [];
	const largeChanges = [];
	const hotReviews = [];

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

	// Sort waiting PRs by wait time (longest first)
	waiting.sort((a, b) => b.waitTime - a.waitTime);

	// Sort large changes by size (largest first)
	largeChanges.sort((a, b) => b.totalChanges - a.totalChanges);

	// Sort hot reviews by comment count (most comments first)
	hotReviews.sort((a, b) => b.totalComments - a.totalComments);

	return { waiting, largeChanges, hotReviews };
}

// Analyze reviewers
function analyzeReviewers(prs) {
	const reviewerMap = new Map();

	for (const pr of prs) {
		for (const review of pr.reviews) {
			if (review.state === "PENDING" || !review.user) {
				continue;
			}

			const reviewer = review.user.login;
			if (!reviewerMap.has(reviewer)) {
				reviewerMap.set(reviewer, {
					reviews: [],
					approvals: 0,
					changesRequested: 0,
					comments: 0,
				});
			}

			const stats = reviewerMap.get(reviewer);
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
			total > 0
				? Math.round((stats.approvals / total) * PERCENTAGE_MULTIPLIER)
				: 0;

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

// Analyze authors
function analyzeAuthors(prs) {
	const authorMap = new Map();

	for (const pr of prs) {
		const author = pr.user.login;
		if (!authorMap.has(author)) {
			authorMap.set(author, {
				prs: [],
				totalAdditions: 0,
				totalDeletions: 0,
			});
		}

		const stats = authorMap.get(author);
		stats.prs.push(pr);
		stats.totalAdditions += pr.additions;
		stats.totalDeletions += pr.deletions;
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

// Generate recommendations
function generateRecommendations(prs, waiting, largeChanges) {
	const recommendations = [];

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

// Format PR for display
function formatPR(pr, prefix = "•") {
	const lines = [
		`${prefix} PR #${pr.number} (${pr.head.ref}) waiting ${formatDays(pr.waitTime)}`,
	];

	if (pr.title) {
		lines.push(`  📝 ${pr.title}`);
	}

	if (pr.user) {
		lines.push(`  👤 Author: @${pr.user.login}`);
	}

	if (pr.assignees && pr.assignees.length > 0) {
		const assignees = pr.assignees.map((a) => `@${a.login}`).join(", ");
		lines.push(`  🎯 Assigned: ${assignees}`);
	}

	if (pr.requested_reviewers && pr.requested_reviewers.length > 0) {
		const reviewers = pr.requested_reviewers
			.map((r) => `@${r.login}`)
			.join(", ");
		lines.push(`  👀 Reviewers: ${reviewers}`);
	}

	return lines.join("\n");
}

// Format large change PR
function formatLargeChangePR(pr) {
	const lines = [
		`• PR #${pr.number} (${pr.head.ref}) - ${pr.totalChanges} lines changed`,
	];

	if (pr.title) {
		lines.push(`  📝 ${pr.title}`);
	}

	if (pr.user) {
		lines.push(`  👤 Author: @${pr.user.login}`);
	}

	if (pr.assignees && pr.assignees.length > 0) {
		const assignees = pr.assignees.map((a) => `@${a.login}`).join(", ");
		lines.push(`  🎯 Assigned: ${assignees}`);
	}

	lines.push(
		`  📊 +${pr.additions} -${pr.deletions} (${pr.changed_files} files)`,
	);

	return lines.join("\n");
}

// Format hot review PR
function formatHotReviewPR(pr) {
	const lines = [
		`• PR #${pr.number} (${pr.head.ref}) - ${pr.totalComments} comments`,
	];

	if (pr.title) {
		lines.push(`  📝 ${pr.title}`);
	}

	if (pr.user) {
		lines.push(`  👤 Author: @${pr.user.login}`);
	}

	if (pr.assignees && pr.assignees.length > 0) {
		const assignees = pr.assignees.map((a) => `@${a.login}`).join(", ");
		lines.push(`  🎯 Assigned: ${assignees}`);
	}

	lines.push(
		`  💬 ${pr.totalComments} comments, ${pr.reviewComments.length} review comments`,
	);

	return lines.join("\n");
}

// Calculate average wait time
function calculateAverageWaitTime(analyzed) {
	if (analyzed.length === 0) {
		return "0";
	}
	return (
		analyzed.reduce((sum, pr) => sum + pr.waitTime, 0) / analyzed.length
	).toFixed(1);
}

// Calculate average review time
function calculateAverageReviewTime(analyzed) {
	const prsWithReviews = analyzed.filter((pr) => pr.reviewTime !== null);
	if (prsWithReviews.length === 0) {
		return "0";
	}
	return (
		prsWithReviews.reduce((sum, pr) => sum + pr.reviewTime, 0) /
		prsWithReviews.length
	).toFixed(1);
}

// Generate Slack payload
function generateSlackPayload(options) {
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

	// Calculate averages
	const avgWaitTime = calculateAverageWaitTime(analyzed);
	const avgReviewTime = calculateAverageReviewTime(analyzed);

	// Count labels
	const labelCounts = new Map();
	for (const pr of prs) {
		if (pr.labels) {
			for (const label of pr.labels) {
				labelCounts.set(label.name, (labelCounts.get(label.name) || 0) + 1);
			}
		}
	}
	const topLabels = Array.from(labelCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_LABELS_COUNT)
		.map(([name, count]) => `${name} (${count})`)
		.join(", ");

	// Build payload
	const payload = {
		prelude: `🔍 Top Pull Requests Report (${today})\nThis report shows the most important pull requests that need attention.`,
		prSummary: `📊 Pull Request Summary\n• Total Open PRs: ${totalPRs}\n• Average Wait Time: ${avgWaitTime} days\n• Average Review Time: ${avgReviewTime} days${topLabels ? `\n• Top Labels: ${topLabels}` : ""}`,
		waitingForReview:
			waiting.length > 0
				? `⏳ Waiting for Review (${waiting.length} PR${waiting.length > 1 ? "s" : ""})\n${waiting.map((pr) => formatPR(pr)).join("\n")}`
				: "⏳ Waiting for Review\n• No PRs waiting longer than the threshold",
		largeChanges:
			largeChanges.length > 0
				? `📦 Large Changes (${largeChanges.length} PR${largeChanges.length > 1 ? "s" : ""})\n${largeChanges.map((pr) => formatLargeChangePR(pr)).join("\n")}`
				: "📦 Large Changes\n• No PRs exceed the large change threshold",
		hotReviews:
			hotReviews.length > 0
				? `🔥 Hot Reviews (${hotReviews.length} PR${hotReviews.length > 1 ? "s" : ""})\n${hotReviews.map((pr) => formatHotReviewPR(pr)).join("\n")}`
				: "🔥 Hot Reviews\n• No PRs exceed the hot review threshold",
		reviewerInsights:
			reviewers.length > 0
				? `👀 Reviewer Insights\n${reviewers
						.slice(0, TOP_REVIEWERS_COUNT)
						.map(
							(r) =>
								`• @${r.login}: ${r.totalReviews} reviews (${r.approvalRate}% approval rate)\n  ✅ ${r.approvals} approved, ❌ ${r.changesRequested} changes requested`,
						)
						.join("\n")}`
				: "👀 Reviewer Insights\n• No review activity in the analyzed period",
		authorInsights:
			authors.length > 0
				? `👤 Author Insights\n${authors
						.slice(0, TOP_AUTHORS_COUNT)
						.map(
							(a) =>
								`• @${a.login}: ${a.openPRs} open PR${a.openPRs > 1 ? "s" : ""}\n  📊 ${a.totalChanges} lines changed (+${a.totalAdditions} -${a.totalDeletions})`,
						)
						.join("\n")}`
				: "👤 Author Insights\n• No author activity in the analyzed period",
		recommendations: `💡 Recommendations\n${recommendations.map((r) => `• ${r}`).join("\n")}`,
	};

	return payload;
}

// Main execution
async function main() {
	try {
		console.log(`Fetching pull requests for ${owner}/${repo}...`);
		const prs = await fetchPullRequests();

		if (prs.length === 0) {
			console.log("No pull requests found in the specified time range.");
			return;
		}

		console.log(`Found ${prs.length} pull requests. Analyzing...`);
		const analyzed = await analyzePRs(prs);

		console.log("Categorizing PRs...");
		const { waiting, largeChanges, hotReviews } = categorizePRs(analyzed);

		console.log("Analyzing reviewers and authors...");
		const reviewers = analyzeReviewers(analyzed);
		const authors = analyzeAuthors(analyzed);

		console.log("Generating recommendations...");
		const recommendations = generateRecommendations(
			analyzed,
			waiting,
			largeChanges,
		);

		console.log("Generating Slack payload...");
		const payload = generateSlackPayload({
			prs,
			analyzed,
			waiting,
			largeChanges,
			hotReviews,
			reviewers,
			authors,
			recommendations,
		});

		// Ensure output directory exists (Bun.write creates directories automatically)
		// But we can still use mkdir for explicit directory creation if needed
		// For now, Bun.write will handle it

		// Write payload to file using Bun.write
		const payloadPath = join(outputDir, "slack-payload.json");
		await Bun.write(payloadPath, JSON.stringify(payload, null, 2));

		console.log(`✅ Report generated successfully at ${payloadPath}`);
		console.log("\nSummary:");
		console.log(`  • Total PRs: ${prs.length}`);
		console.log(`  • Waiting for review: ${waiting.length}`);
		console.log(`  • Large changes: ${largeChanges.length}`);
		console.log(`  • Hot reviews: ${hotReviews.length}`);
	} catch (error) {
		console.error("Error generating report:", error);
		process.exit(1);
	}
}

main();
