import type { AnalyzedPR, GitHubUser } from "./types";
import { formatDays } from "./utils";

export function formatPR(pr: AnalyzedPR, prefix = "•"): string {
	const lines = [
		`${prefix} PR #${pr.number} (${pr.head.ref}) waiting ${formatDays(pr.waitTime)}`,
	];

	if (pr.title) {
		lines.push(`  ${pr.title}`);
	}

	if (pr.user) {
		lines.push(`  Author: @${pr.user.login}`);
	}

	if (pr.assignees && pr.assignees.length > 0) {
		const assignees = pr.assignees
			.map((a: GitHubUser) => `@${a.login}`)
			.join(", ");
		lines.push(`  Assigned: ${assignees}`);
	}

	if (pr.requested_reviewers && pr.requested_reviewers.length > 0) {
		const reviewers = pr.requested_reviewers
			.map((r: GitHubUser) => `@${r.login}`)
			.join(", ");
		lines.push(`  Reviewers: ${reviewers}`);
	}

	return lines.join("\n");
}

export function formatLargeChangePR(pr: AnalyzedPR): string {
	const lines = [
		`• PR #${pr.number} (${pr.head.ref}) - ${pr.totalChanges} lines changed`,
	];

	if (pr.title) {
		lines.push(`  ${pr.title}`);
	}

	if (pr.user) {
		lines.push(`  Author: @${pr.user.login}`);
	}

	if (pr.assignees && pr.assignees.length > 0) {
		const assignees = pr.assignees
			.map((a: GitHubUser) => `@${a.login}`)
			.join(", ");
		lines.push(`  Assigned: ${assignees}`);
	}

	lines.push(`  +${pr.additions} -${pr.deletions} (${pr.changed_files} files)`);

	return lines.join("\n");
}

export function formatHotReviewPR(pr: AnalyzedPR): string {
	const lines = [
		`• PR #${pr.number} (${pr.head.ref}) - ${pr.totalComments} comments`,
	];

	if (pr.title) {
		lines.push(`  ${pr.title}`);
	}

	if (pr.user) {
		lines.push(`  Author: @${pr.user.login}`);
	}

	if (pr.assignees && pr.assignees.length > 0) {
		const assignees = pr.assignees
			.map((a: GitHubUser) => `@${a.login}`)
			.join(", ");
		lines.push(`  Assigned: ${assignees}`);
	}

	lines.push(
		`  ${pr.totalComments} comments, ${pr.reviewComments.length} review comments`,
	);

	return lines.join("\n");
}
