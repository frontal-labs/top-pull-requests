import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	emptyStringAsUndefined: true,
	runtimeEnv: process.env,
	server: {
		GH_REPOSITORY: z
			.string()
			.regex(/^[^/]+\/[^/]+$/u, "Repository must be in format owner/repo")
			.optional(),
		GH_TOKEN: z.string().optional(),
		GITHUB_REPOSITORY: z
			.string()
			.regex(/^[^/]+\/[^/]+$/u, "Repository must be in format owner/repo")
			.optional(),
		GITHUB_TOKEN: z.string().optional(),
		OUTPUT_DIR: z.string().optional(),
	},
});

export function getGitHubToken(): string {
	const token = env.GH_TOKEN || env.GITHUB_TOKEN;
	if (!token) {
		console.error(
			"Error: GH_TOKEN or GITHUB_TOKEN environment variable is required"
		);
		process.exit(1);
	}
	return token;
}

export function getRepository(): { owner: string; repo: string } {
	const repository = env.GH_REPOSITORY || env.GITHUB_REPOSITORY;
	if (!repository?.includes("/")) {
		console.error("Error: GH_REPOSITORY must be in format owner/repo");
		process.exit(1);
	}
	const [owner, repo] = repository.split("/");
	return { owner, repo };
}

export function getOutputDir(): string {
	return env.OUTPUT_DIR || "./output";
}
