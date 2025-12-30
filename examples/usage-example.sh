#!/bin/bash

# Example usage script for top-pull-requests tool
# This script demonstrates how to use the tool in various scenarios

set -e

echo "=== Top Pull Requests Tool Usage Examples ==="
echo ""

# Example 1: Basic usage with default repository
echo "Example 1: Generate report for current repository"
echo "----------------------------------------"
export GH_TOKEN="${GITHUB_TOKEN:-your-token-here}"
export GH_REPOSITORY="${GITHUB_REPOSITORY:-owner/repo}"
node scripts/pull-requests.mjs ./output
echo "Report generated at ./output/slack-payload.json"
echo ""

# Example 2: Generate report for specific repository
echo "Example 2: Generate report for specific repository"
echo "----------------------------------------"
export GH_REPOSITORY="usefrontal/frontal"
node scripts/pull-requests.mjs ./output-frontal
echo "Report generated at ./output-frontal/slack-payload.json"
echo ""

# Example 3: Customize thresholds
echo "Example 3: Customize thresholds (modify constants in script)"
echo "----------------------------------------"
echo "To change thresholds, edit scripts/pull-requests.mjs:"
echo "  const WAITING_THRESHOLD_DAYS = 1;      // 1 day instead of 3"
echo "  const LARGE_CHANGE_THRESHOLD = 200;    // 200 lines instead of 500"
echo "  const HOT_REVIEW_THRESHOLD = 3;        // 3 comments instead of 5"
echo ""

# Example 4: View the generated payload
echo "Example 4: View generated payload"
echo "----------------------------------------"
if [ -f "./output/slack-payload.json" ]; then
  cat ./output/slack-payload.json | jq .
else
  echo "No output file found. Run Example 1 first."
fi
echo ""

# Example 5: Integration with Slack webhook
echo "Example 5: Send to Slack webhook"
echo "----------------------------------------"
if [ -f "./output/slack-payload.json" ] && [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data @./output/slack-payload.json \
    "$SLACK_WEBHOOK_URL"
  echo "Payload sent to Slack"
else
  echo "Set SLACK_WEBHOOK_URL environment variable to send to Slack"
fi
echo ""

# Example 6: Filter by specific criteria
echo "Example 6: Analyze specific PR categories"
echo "----------------------------------------"
echo "The tool automatically categorizes PRs into:"
echo "  - Waiting for Review: PRs waiting > threshold days"
echo "  - Large Changes: PRs with > threshold lines changed"
echo "  - Hot Reviews: PRs with > threshold comments"
echo ""

echo "=== Examples Complete ==="

