# Top Pull Requests API Documentation

This document provides detailed API documentation for the `@frontal/top-pull-requests` tool.

## Overview

The top-pull-requests tool analyzes GitHub pull requests, tracks review metrics, and generates comprehensive Slack-compatible reports.

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GH_TOKEN` | Yes | GitHub personal access token | `ghp_xxxxxxxxxxxx` |
| `GITHUB_TOKEN` | Yes | Alternative name for GitHub token | `ghp_xxxxxxxxxxxx` |
| `GH_REPOSITORY` | No | Repository in format `owner/repo` | `usefrontal/frontal` |
| `GITHUB_REPOSITORY` | No | Alternative name for repository | `usefrontal/frontal` |

### Script Parameters

The script accepts one optional command-line argument:

```bash
bun scripts/pull-requests.ts [output-directory]
```

- `output-directory`: Path where the `slack-payload.json` file will be written (default: `./output`)

### Configuration Constants

Edit `scripts/pull-requests.ts` to customize:

```javascript
const NUM_OF_DAYS = 7;                    // Time range for analysis (default: 7)
const MAX_PRS = 20;                       // Max PRs to analyze (default: 20)
const WAITING_THRESHOLD_DAYS = 3;         // PRs waiting > 3 days need attention (default: 3)
const LARGE_CHANGE_THRESHOLD = 500;       // PRs with > 500 lines changed (default: 500)
const HOT_REVIEW_THRESHOLD = 5;           // PRs with > 5 comments (default: 5)
```

## Functions

### Date Utilities

#### `formatDate(date: Date): string`

Formats a date for display in reports.

**Parameters:**
- `date`: Date object to format

**Returns:** Formatted date string (MM/DD/YYYY)

**Example:**
```javascript
const formatted = formatDate(new Date());
// Returns: "1/15/2024"
```

#### `daysSince(date: string): number`

Calculates the number of days since a given date.

**Parameters:**
- `date`: ISO date string

**Returns:** Number of days

**Example:**
```javascript
const days = daysSince('2024-01-10T00:00:00Z');
// Returns: 5 (if today is 2024-01-15)
```

#### `formatDays(days: number): string`

Formats a day count for human-readable display.

**Parameters:**
- `days`: Number of days

**Returns:** Formatted string ("today", "1 day", or "N days")

**Example:**
```javascript
formatDays(0);  // "today"
formatDays(1);  // "1 day"
formatDays(5);  // "5 days"
```

### Pull Request Functions

#### `fetchPullRequests(): Promise<PullRequest[]>`

Fetches open pull requests from GitHub.

**Returns:** Promise resolving to an array of pull requests

**Example:**
```javascript
const prs = await fetchPullRequests();
console.log(`Found ${prs.length} pull requests`);
```

#### `fetchPRDetails(pr: PullRequest): Promise<PRDetails>`

Fetches detailed information for a pull request including reviews and comments.

**Parameters:**
- `pr`: Pull request object

**Returns:** Promise resolving to PR details object

**Example:**
```javascript
const details = await fetchPRDetails(pr);
console.log(`PR has ${details.reviews.length} reviews`);
```

### Analysis Functions

#### `calculateWaitTime(pr: PullRequest, reviews: GitHubReview[]): number`

Calculates how many days a PR has been waiting for review.

**Parameters:**
- `pr`: Pull request object
- `reviews`: Array of reviews

**Returns:** Number of days waiting (0 if already reviewed)

**Example:**
```javascript
const waitTime = calculateWaitTime(pr, reviews);
if (waitTime >= 3) {
  console.log('PR needs attention!');
}
```

#### `calculateReviewTime(pr: PullRequest, reviews: GitHubReview[]): number | null`

Calculates time from PR creation to first review.

**Parameters:**
- `pr`: Pull request object
- `reviews`: Array of reviews

**Returns:** Number of days or null if no reviews

**Example:**
```javascript
const reviewTime = calculateReviewTime(pr, reviews);
if (reviewTime !== null) {
  console.log(`First review after ${reviewTime} days`);
}
```

#### `analyzePRs(prs: PullRequest[]): Promise<AnalyzedPR[]>`

Analyzes multiple pull requests and enriches them with metrics.

**Parameters:**
- `prs`: Array of pull requests

**Returns:** Promise resolving to analyzed PRs

**Example:**
```javascript
const analyzed = await analyzePRs(prs);
```

#### `categorizePRs(prs: AnalyzedPR[]): PRCategories`

Categorizes PRs into waiting, large changes, and hot reviews.

**Parameters:**
- `prs`: Array of analyzed PRs

**Returns:** Object with categorized PRs

**Example:**
```javascript
const { waiting, largeChanges, hotReviews } = categorizePRs(analyzed);
console.log(`${waiting.length} PRs waiting for review`);
```

### Reviewer and Author Analysis

#### `analyzeReviewers(prs: AnalyzedPR[]): ReviewerStats[]`

Analyzes reviewer activity and statistics.

**Parameters:**
- `prs`: Array of analyzed PRs

**Returns:** Array of reviewer statistics

**Example:**
```javascript
const reviewers = analyzeReviewers(analyzed);
reviewers.forEach(r => {
  console.log(`${r.login}: ${r.approvalRate}% approval rate`);
});
```

#### `analyzeAuthors(prs: AnalyzedPR[]): AuthorStats[]`

Analyzes PR author activity and statistics.

**Parameters:**
- `prs`: Array of analyzed PRs

**Returns:** Array of author statistics

**Example:**
```javascript
const authors = analyzeAuthors(analyzed);
authors.forEach(a => {
  console.log(`${a.login}: ${a.openPRs} open PRs`);
});
```

### Recommendation Generation

#### `generateRecommendations(prs: AnalyzedPR[], waiting: AnalyzedPR[], largeChanges: AnalyzedPR[]): string[]`

Generates actionable recommendations based on PR analysis.

**Parameters:**
- `prs`: All analyzed PRs
- `waiting`: PRs waiting for review
- `largeChanges`: PRs with large changes

**Returns:** Array of recommendation strings

**Example:**
```javascript
const recommendations = generateRecommendations(analyzed, waiting, largeChanges);
recommendations.forEach(rec => console.log(`• ${rec}`));
```

### Formatting Functions

#### `formatPR(pr: AnalyzedPR, prefix?: string): string`

Formats a PR for display in reports.

**Parameters:**
- `pr`: Analyzed PR
- `prefix`: Optional prefix character (default: '•')

**Returns:** Formatted string

#### `formatLargeChangePR(pr: AnalyzedPR): string`

Formats a large change PR for display.

**Parameters:**
- `pr`: Analyzed PR

**Returns:** Formatted string

#### `formatHotReviewPR(pr: AnalyzedPR): string`

Formats a hot review PR for display.

**Parameters:**
- `pr`: Analyzed PR

**Returns:** Formatted string

### Payload Generation

#### `generateSlackPayload(...): SlackPayload`

Generates the final Slack-compatible payload.

**Parameters:**
- Multiple parameters including PRs, categories, reviewers, authors, recommendations

**Returns:** Slack payload object

**Example:**
```javascript
const payload = generateSlackPayload(
  prs,
  analyzed,
  waiting,
  largeChanges,
  hotReviews,
  reviewers,
  authors,
  recommendations
);
```

## Data Types

### `PullRequest`

```typescript
interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
  // ... more fields
}
```

### `AnalyzedPR`

```typescript
interface AnalyzedPR extends PullRequest {
  waitTime: number;
  reviewTime: number | null;
  totalComments: number;
  totalChanges: number;
  reviews: GitHubReview[];
  comments: GitHubComment[];
  reviewComments: GitHubComment[];
}
```

### `ReviewerStats`

```typescript
interface ReviewerStats {
  login: string;
  totalReviews: number;
  approvals: number;
  changesRequested: number;
  comments: number;
  approvalRate: number;
}
```

### `AuthorStats`

```typescript
interface AuthorStats {
  login: string;
  openPRs: number;
  totalAdditions: number;
  totalDeletions: number;
  totalChanges: number;
}
```

### `SlackPayload`

```typescript
interface SlackPayload {
  prelude: string;
  prSummary: string;
  waitingForReview: string;
  largeChanges: string;
  hotReviews: string;
  reviewerInsights: string;
  authorInsights: string;
  recommendations: string;
}
```

## Error Handling

The tool handles various error scenarios:

1. **Missing Token**: Exits with error if `GH_TOKEN` or `GITHUB_TOKEN` is not set
2. **Invalid Repository**: Exits with error if repository format is invalid
3. **API Errors**: Logs warnings for individual PR detail failures but continues processing
4. **No PRs Found**: Logs message and exits gracefully
5. **Rate Limiting**: GitHub API rate limits apply (5,000 requests/hour authenticated)

## Rate Limiting

GitHub API has rate limits:
- **Authenticated requests**: 5,000 requests/hour
- **Unauthenticated requests**: 60 requests/hour

The tool makes:
- 1 request to list PRs
- N requests for PR details (reviews, comments, review comments) - 3 requests per PR

For 20 PRs, this requires ~61 requests, well within authenticated limits.

## Best Practices

1. **Use GitHub Actions Token**: In CI/CD, use `${{ secrets.GITHUB_TOKEN }}`
2. **Adjust Thresholds**: Customize thresholds based on your team's velocity
3. **Monitor Rate Limits**: For large repositories, consider reducing `MAX_PRS`
4. **Error Handling**: The tool continues processing even if individual PRs fail
5. **Testing**: Test with a small repository first

## Examples

See the `examples/` directory for:
- Example output files
- GitHub Actions workflows
- Usage scripts


<environment_details>
Current time: 2026-10-30T16:21:25+00:00
Working directory: /Users/gabrielfonseca/Desktop/top-pull-requests
Workspace root folder: /Users/gabrielfonseca/Desktop/top-pull-requests
</environment_details>
