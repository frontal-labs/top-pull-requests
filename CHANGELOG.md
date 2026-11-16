# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.0.2 (2026-11-16)

### Changes

- `analyzePRs` now fetches PR details concurrently with `Promise.all`
  instead of awaiting per PR inside a loop, reducing report generation
  time for repositories with many open pull requests.

### Fixes

- Fix Biome 2 lint errors: declare the `Bun` global in `biome.json`,
  disable `useNamingConvention` which conflicts with this codebase's
  naming, and use array destructuring instead of index access in
  `src/analysis.ts`.
- Apply `biome check --write` formatting and import sorting across the
  codebase.

