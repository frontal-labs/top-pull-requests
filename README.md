# @frontal/top-pull-requests

An internal package that surfaces the most important pull requests by analyzing waiting times, change sizes, review activity, and reviewer assignments to provide actionable insights for improving PR velocity and code review processes.

## Purpose

This tool is designed to:
- **Surface important PRs** that need immediate attention
- **Track review wait times** and identify bottlenecks
- **Monitor large changes** that require special attention
- **Identify hot reviews** with high comment activity
- **Map reviewer ownership** and assignment patterns
- **Provide reviewer reminders** with automated Slack notifications

## Features

- **Waiting Time Analysis**: Identifies PRs waiting longer than threshold for review
- **Large Change Detection**: Flags PRs with significant code changes
- **Hot Review Tracking**: Monitors PRs with high comment activity
- **Reviewer Mapping**: Tracks reviewer assignments and performance
- **Author Insights**: Analyzes PR author patterns and contributions
- **Smart Prioritization**: Automatically prioritizes PRs based on multiple factors
- **Slack Integration**: Generates formatted payloads for automated notifications
- **GitHub Actions Ready**: Designed for automated workflows with scheduling

## Installation

This package is part of the Frontal monorepo and uses bun for dependency management:

```bash
# Install dependencies
bun install

# Build the package
bun run build
```

## Usage

### Command Line

```bash
# Basic usage
bun scripts/pull-requests.mjs <output-directory>

# Example
bun scripts/pull-requests.mjs ./output
```

### GitHub Actions Integration

```yaml
# .github/workflows/top-pull-requests.yml
name: Top Pull Requests
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Every weekday at 9AM UTC
  workflow_dispatch:        # Manual trigger

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: bun install
        
      - name: Generate PR report
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bun tools/top-pull-requests/scripts/pull-requests.mjs ./output
        
      - name: Post to Slack
        uses: 8398a7/action-slack@v3
        with:
          status: success
          payload_file_path: ./output/slack-payload.json
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GH_TOKEN` | Yes | GitHub personal access token or Actions token |
| `GH_REPOSITORY` | No | Repository in format `owner/repo` (defaults to current repo) |

### Parameters

The following constants can be modified in `scripts/pull-requests.mjs`:

```javascript
const NUM_OF_DAYS = 7;                    // Time range for analysis
const MAX_PRS = 20;                       // Number of PRs to analyze
const WAITING_THRESHOLD_DAYS = 3;         // PRs waiting more than 3 days need attention
const LARGE_CHANGE_THRESHOLD = 500;       // PRs with more than 500 lines changed
const HOT_REVIEW_THRESHOLD = 5;           // PRs with more than 5 comments
```

### Output Format

The tool generates a `slack-payload.json` file with the following structure:

```json
{
  "prelude": "🔍 Top Pull Requests Report (8/28/2025)\nThis report shows the most important pull requests that need attention.",
  "prSummary": "📊 Pull Request Summary\n• Total Open PRs: 15\n• Average Wait Time: 2.5 days\n• Average Review Time: 1.2 days\n• Top Labels: bug (5), feature (3), documentation (2)",
  "waitingForReview": "⏳ Waiting for Review (3 PRs)\n• PR #234 (feature/auth-refactor) waiting 5 days\n  📝 Refactor authentication system\n  👤 Author: @alice\n  🎯 Assigned: @bob\n  👀 Reviewers: @charlie, @dave",
  "largeChanges": "📦 Large Changes (2 PRs)\n• PR #245 (api-overhaul) - 1200 lines changed\n  📝 Complete API redesign\n  👤 Author: @eve\n  🎯 Assigned: @frank\n  📊 +800 -400 (45 files)",
  "hotReviews": "🔥 Hot Reviews (1 PRs)\n• PR #251 (database-migration) - 12 comments\n  📝 Database schema migration\n  👤 Author: @grace\n  🎯 Assigned: @henry\n  💬 12 comments, 8 review comments",
  "reviewerInsights": "👀 Reviewer Insights\n• @bob: 8 reviews (75% approval rate)\n  ✅ 6 approved, ❌ 2 changes requested",
  "authorInsights": "👤 Author Insights\n• @alice: 3 open PRs\n  📊 450 lines changed (+300 -150)",
  "recommendations": "💡 Recommendations\n• Review PRs waiting more than 3 days\n• Assign reviewers to unassigned PRs\n• Break down large PRs into smaller, focused changes"
}
```

## Metrics Tracked

### Pull Request Metrics
- **Wait Time**: Days since PR creation without review
- **Review Time**: Time from creation to first review
- **Change Size**: Total lines added/removed
- **Comment Activity**: Number of comments and review comments
- **Review Status**: Approved, changes requested, or commented
- **Merge Status**: Mergeable, rebaseable, or blocked

### Reviewer Metrics
- **Review Count**: Total number of reviews performed
- **Approval Rate**: Percentage of approved reviews
- **Response Time**: Average time to respond to review requests
- **Review Quality**: Distribution of review types

### Author Metrics
- **Open PRs**: Number of currently open pull requests
- **Total Changes**: Cumulative lines changed across PRs
- **PR Velocity**: Average time to get PRs reviewed and merged

## PR Analysis Categories

### Waiting for Review
PRs that have been waiting longer than the configured threshold (default: 3 days) are flagged as needing immediate attention. These PRs are prioritized based on:
- **Wait time** (longest first)
- **Author** (to avoid blocking specific developers)
- **Size** (larger changes may need more time)
- **Labels** (priority labels affect urgency)

### Large Changes
PRs with significant code changes (default: 500+ lines) are flagged for special attention because they:
- **Require more review time** and careful consideration
- **Have higher risk** of introducing bugs
- **May need multiple reviewers** for different areas
- **Could benefit from breaking down** into smaller PRs

### Hot Reviews
PRs with high comment activity (default: 5+ comments) indicate:
- **Controversial changes** that need discussion
- **Complex implementations** requiring clarification
- **Potential issues** that need resolution
- **Team collaboration** and knowledge sharing

## Reviewer Mapping

### Assignment Patterns
The tool tracks reviewer assignments to identify:
- **Reviewer workload** and capacity
- **Expertise areas** based on review history
- **Response times** and availability
- **Review quality** and consistency

### Ownership Mapping
Based on file changes and review history, the tool can suggest:
- **Primary reviewers** for specific areas
- **Backup reviewers** when primary reviewers are unavailable
- **Cross-team reviews** for changes affecting multiple areas
- **Automated assignments** based on file patterns

## Slack Integration Examples

### Waiting for Review Alert
```
⏳ PR #234 (refactor-auth) waiting 3 days for review. Assigned to @alice.
```

### Large Change Alert
```
📦 PR #245 (api-overhaul) - 1200 lines changed. Needs review from @bob and @charlie.
```

### Hot Review Alert
```
🔥 PR #251 (database-migration) - 12 comments. @dave and @eve discussing implementation.
```

### Reviewer Reminder
```
👀 @frank has 3 PRs waiting for review. Consider reassigning if unavailable.
```

## Customization

### Multi-Repository Support

To analyze multiple repositories, modify the script:

```javascript
// In scripts/pull-requests.mjs
const REPOSITORIES = [
  'usefrontal/frontal',
  'usefrontal/frontal-core',
  'usefrontal/frontal-ui'
];

// Update the analysis to loop through repositories
for (const repo of REPOSITORIES) {
  const [owner, repoName] = repo.split('/');
  // Analyze each repository
}
```

### Custom Thresholds

Adjust thresholds based on your team's needs:

```javascript
// Strict thresholds for high-velocity teams
const WAITING_THRESHOLD_DAYS = 1;         // 1 day max wait time
const LARGE_CHANGE_THRESHOLD = 200;       // 200 lines max per PR
const HOT_REVIEW_THRESHOLD = 3;           // 3 comments trigger alert

// More lenient thresholds for slower teams
const WAITING_THRESHOLD_DAYS = 5;         // 5 days max wait time
const LARGE_CHANGE_THRESHOLD = 1000;      // 1000 lines max per PR
const HOT_REVIEW_THRESHOLD = 10;          // 10 comments trigger alert
```

### Team-Specific Rules

Add team-specific logic for reviewer assignments:

```javascript
// Team ownership mapping
const TEAM_OWNERSHIP = {
  'frontend': ['alice', 'bob', 'charlie'],
  'backend': ['dave', 'eve', 'frank'],
  'infrastructure': ['grace', 'henry', 'iris'],
  'design': ['jack', 'kate', 'leo']
};

// File pattern to team mapping
const FILE_PATTERNS = {
  'src/components/': 'frontend',
  'src/api/': 'backend',
  'infrastructure/': 'infrastructure',
  'design/': 'design'
};
```

## Development

### Scripts

```bash
# Code quality
bun run lint          # Run linting
bun run format        # Format code
bun run style:check   # Check style compliance
```

### Testing

```bash
# Run tests
bun test

# Test with mock data
MOCK_DATA=true bun scripts/pull-requests.mjs ./test-output
```

### Local Development

```bash
# Run with debug logging
DEBUG=true bun scripts/pull-requests.mjs ./debug-output

# Test with specific repository
GITHUB_REPOSITORY=usefrontal/frontal bun scripts/pull-requests.mjs ./output
```

## Troubleshooting

### Common Issues

**Error: "GITHUB_TOKEN not set"**
- Ensure the `GITHUB_TOKEN` environment variable is properly configured
- For GitHub Actions, use `${{ secrets.GITHUB_TOKEN }}`

**Error: "No pull requests found"**
- Check if the repository has open pull requests
- Verify the repository name and permissions
- Adjust the `NUM_OF_DAYS` parameter if needed

**Error: "Rate limit exceeded"**
- GitHub API has rate limits for unauthenticated requests
- Use a GitHub token to increase rate limits
- Consider reducing the number of PRs analyzed

**Performance issues with large repositories**
- Reduce `MAX_PRS` to analyze fewer pull requests
- Increase `WAITING_THRESHOLD_DAYS` to focus on urgent PRs
- Use repository-specific analysis for large monorepos

### Debug Mode

Enable verbose logging by adding debug statements:

```javascript
// In scripts/pull-requests.mjs
logger.debug('PR analysis:', prAnalysis);
logger.debug('Reviewer data:', reviewerData);
logger.debug('Author data:', authorData);
```

## Best Practices

### Review Process Optimization
- **Set clear expectations** for review turnaround times
- **Use PR templates** to ensure consistent information
- **Automate reviewer assignments** based on file changes
- **Implement review checklists** for quality assurance

### PR Management
- **Keep PRs small and focused** on single concerns
- **Use descriptive titles** and detailed descriptions
- **Add appropriate labels** for categorization
- **Request specific reviewers** based on expertise

### Team Communication
- **Set up automated reminders** for overdue reviews
- **Use Slack channels** for PR discussions
- **Schedule regular PR review sessions** for large changes
- **Celebrate good review practices** and quick responses

## Reference

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [GitHub Pull Requests API](https://docs.github.com/en/rest/pulls)
- [GitHub Reviews API](https://docs.github.com/en/rest/pulls/reviews)
- [License](LICENSE.md)

