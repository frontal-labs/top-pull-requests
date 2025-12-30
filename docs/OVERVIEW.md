# Top Pull Requests Documentation

This directory contains comprehensive documentation for the `@frontal/top-pull-requests` tool.

## Overview

The top-pull-requests tool surfaces the most important pull requests by analyzing waiting times, change sizes, review activity, and reviewer assignments to provide actionable insights for improving PR velocity and code review processes.

## Documentation Structure

### [`API.md`](./API.md)

Complete API reference documentation covering:
- Command line options
- GitHub API integration
- PR analysis metrics
- Reviewer mapping logic
- Slack payload generation

### [`../README.md`](../README.md)

Getting started guide with:
- Quick start instructions
- Usage examples
- GitHub Actions integration
- Configuration and customization

### [`../examples/`](../examples/)

Practical examples:
- GitHub Actions workflows
- Slack integration examples
- Customization patterns

## Key Concepts

### PR Prioritization

PRs are prioritized based on multiple factors:
- **Wait time**: PRs waiting longer need attention
- **Change size**: Large PRs require special handling
- **Review activity**: High comment activity indicates importance
- **Reviewer assignments**: Unassigned or overdue reviews

### Metrics Tracking

The tool tracks comprehensive metrics:
- **PR metrics**: Wait time, review time, change size, comments
- **Reviewer metrics**: Review count, approval rate, response time
- **Author metrics**: Open PRs, total changes, velocity

### Reviewer Mapping

Tracks reviewer assignments to identify:
- Workload and capacity
- Expertise areas
- Response times
- Review quality

## Common Use Cases

### 1. Daily PR Reports

Schedule daily reports for active repositories:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Every weekday at 9AM UTC
```

### 2. PR Triage Sessions

Generate reports for team triage sessions:

```bash
bun scripts/pull-requests.mjs ./output
```

### 3. Reviewer Reminders

Automate reviewer reminders for overdue PRs.

## Best Practices

1. **Regular monitoring**: Set up daily or multiple-times-daily reports
2. **Address wait times**: Review PRs waiting longer than threshold
3. **Break down large PRs**: Encourage smaller, focused changes
4. **Assign reviewers**: Ensure PRs have appropriate reviewers
5. **Track metrics**: Monitor trends over time

## Troubleshooting

### Common Issues

**"GITHUB_TOKEN not set"**
- Ensure token is configured in GitHub Actions secrets
- Use `GITHUB_TOKEN` environment variable

**"Rate limit exceeded"**
- Use authenticated requests with GitHub token
- Reduce number of PRs analyzed if needed

## Related Tools

- **top-issues**: Similar tool for issue tracking
- GitHub Pull Requests API: Provides the underlying data

## Quick Links

- [Main README](../README.md) - Getting started guide
- [API Reference](./API.md) - Complete API documentation
- [Examples](../examples/) - Usage examples and workflows
