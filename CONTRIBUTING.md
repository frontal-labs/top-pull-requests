# Contributing to Frontal Tools

Thanks for your interest in contributing!
These repositories are part of **Frontal**, a set of tools focused on turning developer activity into clear, actionable signals.

We welcome contributions that improve correctness, performance, clarity, and developer experience.

---

## Scope of These Repositories

These tools focus on **signal extraction and prioritization** from GitHub data, including:

- Surfacing high-impact **issues** using community engagement signals
- Identifying critical **pull requests** using workflow and review metadata

All contributions should align with this goal:

> **Turn noisy metadata into useful signal.**

---

## Ways to Contribute

You can help in many ways:

- Fix bugs or edge cases
- Improve signal quality, heuristics, or ranking logic
- Add new metrics or analysis signals
- Improve test coverage
- Improve documentation or examples
- Optimize performance or reliability

If you’re unsure whether an idea fits, open an issue first — we’re happy to discuss.

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/repo-name.git
   cd repo-name

	3.	Install dependencies

bun install

or

npm install


	4.	Create a branch

git checkout -b your-feature-name



⸻

Development Guidelines

Code Quality
	•	Keep changes small and focused
	•	Prefer readability over cleverness
	•	Avoid premature optimization unless justified
	•	Handle edge cases explicitly

Signals & Heuristics

When modifying or adding signals:
	•	Clearly document why the signal exists
	•	Explain what problem it solves
	•	Avoid opaque “magic numbers” without justification
	•	Prefer composable, inspectable logic

Good signals are:
	•	Deterministic
	•	Explainable
	•	Cheap to compute
	•	Easy to evolve

⸻

Testing
	•	Add or update tests for any behavioral change
	•	Ensure all tests pass before submitting
	•	New signals should include basic test coverage

bun test


⸻

Commit Messages

Follow conventional, descriptive commits:
	•	feat: add review wait-time signal
	•	fix: handle missing reaction data
	•	docs: clarify signal weighting
	•	refactor: simplify ranking pipeline

⸻

Pull Requests

Before opening a PR:
	•	Ensure the branch is up to date with main
	•	Run tests and linters
	•	Add clear descriptions of what changed and why

PR descriptions should include:
	•	Motivation / problem
	•	Summary of changes
	•	Any trade-offs or follow-ups

⸻

Reporting Issues

When opening an issue, please include:
	•	Clear description of the problem
	•	Expected vs actual behavior
	•	Reproduction steps (if applicable)
	•	Relevant logs or data samples

Feature requests should explain:
	•	The signal or insight you want
	•	Why it’s valuable
	•	How it might be computed

Thanks for helping make Frontal better
If you have questions, open an issue or start a discussion.
