#!/usr/bin/env bun

import { join } from "node:path";
import { Octokit } from "@octokit/rest";
import {
	analyzeAuthors,
	analyzePRs,
	analyzeReviewers,
	categorizePRs,
	fetchPullRequests,
	generateRecommendations,
} from "../src/analysis";
import { MAX_PRS, NUM_OF_DAYS } from "../src/constants";
import { getGitHubToken, getOutputDir, getRepository } from "../src/env";
import { generateSlackPayload } from "../src/report";

const outputDir = process.argv[2] || getOutputDir();

const token = getGitHubToken();
const { owner, repo } = getRepository();

const octokit = new Octokit({
	auth: token,
});

async function main() {
	try {
		console.log(`Fetching pull requests for ${owner}/${repo}...`);
		const prs = await fetchPullRequests(
			octokit,
			owner,
			repo,
			NUM_OF_DAYS,
			MAX_PRS,
		);

		if (prs.length === 0) {
			console.log("No pull requests found in the specified time range.");
			return;
		}

		console.log(`Found ${prs.length} pull requests. Analyzing...`);
		const analyzed = await analyzePRs(octokit, owner, repo, prs);

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

		const payloadPath = join(outputDir, "slack-payload.json");
		await Bun.write(payloadPath, JSON.stringify(payload, null, 2));

		console.log(`Report generated successfully at ${payloadPath}`);
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
