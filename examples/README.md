# Top Pull Requests Examples

This directory contains example files and usage patterns for the `@frontal/top-pull-requests` tool.

## Files

### `example-output.json`

Example Slack payload output that the tool generates. This shows the complete structure and format of the JSON file created by the script.

**Usage:**
```bash
# After running the tool, compare your output with this example
diff ./output/slack-payload.json examples/example-output.json
```

### `github-actions-workflow.yml`

Complete GitHub Actions workflow configuration for automated PR reporting.

**Features:**
- Scheduled runs every weekday at 9AM UTC
- Manual trigger support
- Artifact upload for report storage
- Slack integration

**Setup:**
1. Copy this file to `.github/workflows/top-pull-requests.yml`
2. Add `SLACK_WEBHOOK_URL` to your repository secrets
3. The workflow will automatically use `GITHUB_TOKEN` for authentication

### `usage-example.sh`

Bash script demonstrating various usage scenarios.

**Scenarios covered:**
1. Basic usage with default repository
2. Generating report for specific repository
3. Customizing thresholds
4. Viewing generated payload
5. Integration with Slack webhook
6. Understanding PR categories

**Usage:**
```bash
# Make sure you have a GitHub token set
export GH_TOKEN="your-token-here"
export GH_REPOSITORY="owner/repo"

# Run the examples
./examples/usage-example.sh
```

## Integration Examples

### Slack Webhook Integration

```bash
# Generate the report
node scripts/pull-requests.mjs ./output

# Send to Slack
curl -X POST -H 'Content-type: application/json' \
  --data @./output/slack-payload.json \
  "$SLACK_WEBHOOK_URL"
```

### GitHub Actions Integration

See `github-actions-workflow.yml` for a complete example. The workflow:
- Runs on a schedule (weekdays at 9AM UTC)
- Can be manually triggered
- Uploads the report as an artifact
- Posts to Slack automatically

### Custom Thresholds

Edit `scripts/pull-requests.mjs` to customize thresholds:

```javascript
const WAITING_THRESHOLD_DAYS = 1;      // 1 day instead of 3
const LARGE_CHANGE_THRESHOLD = 200;    // 200 lines instead of 500
const HOT_REVIEW_THRESHOLD = 3;        // 3 comments instead of 5
```

### Team-Specific Configuration

For high-velocity teams:
```javascript
const WAITING_THRESHOLD_DAYS = 1;
const LARGE_CHANGE_THRESHOLD = 200;
const HOT_REVIEW_THRESHOLD = 3;
```

For slower teams:
```javascript
const WAITING_THRESHOLD_DAYS = 5;
const LARGE_CHANGE_THRESHOLD = 1000;
const HOT_REVIEW_THRESHOLD = 10;
```

### Multiple Repositories

To analyze multiple repositories, modify the script:

```javascript
const REPOSITORIES = [
  'usefrontal/frontal',
  'usefrontal/frontal-core',
  'usefrontal/frontal-ui'
];

for (const repo of REPOSITORIES) {
  const [owner, repoName] = repo.split('/');
  // Process each repository
}
```

## PR Categories Explained

The tool automatically categorizes PRs into three groups:

### 1. Waiting for Review
PRs that have been waiting longer than the threshold (default: 3 days) without a review.

**Why it matters:**
- Blocks developers from merging
- Indicates review bottleneck
- May need reviewer assignment

### 2. Large Changes
PRs with significant code changes (default: 500+ lines).

**Why it matters:**
- Requires more review time
- Higher risk of bugs
- May need multiple reviewers
- Could benefit from splitting

### 3. Hot Reviews
PRs with high comment activity (default: 5+ comments).

**Why it matters:**
- Indicates active discussion
- May need resolution
- Shows team collaboration
- Could indicate complexity

## Testing

Use the example output to verify your setup:

```bash
# Generate a test report
GH_TOKEN="your-token" GH_REPOSITORY="test/repo" \
  node scripts/pull-requests.mjs ./test-output

# Compare with example
cat ./test-output/slack-payload.json | jq .
```

## Troubleshooting

### No PRs Found

If the report shows no PRs:
- Check the time range (`NUM_OF_DAYS`)
- Verify the repository has open pull requests
- Ensure the GitHub token has proper permissions

### API Rate Limits

If you hit rate limits:
- Use an authenticated token (5,000 requests/hour)
- Reduce `MAX_PRS` to analyze fewer PRs
- Add delays between API calls

### Performance Issues

For large repositories:
- Reduce `MAX_PRS` to 10-15
- Increase `WAITING_THRESHOLD_DAYS` to focus on urgent PRs
- Consider repository-specific analysis

### Invalid Output

If the output format is incorrect:
- Check the example output file
- Verify all required fields are present
- Ensure JSON is valid

## Related Documentation

- [Main README](../README.md) - Tool overview and usage
- [API Documentation](../docs/API.md) - Detailed API reference
- [Tests](../tests/) - Test files and examples

