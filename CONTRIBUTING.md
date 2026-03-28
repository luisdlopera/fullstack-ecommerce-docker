# Contributing Guide

## Development Setup

1. Install dependencies:
   - npm install
2. Copy environment template:
   - cp .env.template .env
3. Start database and apps:
   - npm run dev:stack

## Branching

Use short-lived branches from main:
- feat/<scope>-<summary>
- fix/<scope>-<summary>
- chore/<scope>-<summary>
- docs/<scope>-<summary>

## Commit Convention

Use Conventional Commits:
- feat: new feature
- fix: bug fix
- docs: documentation only
- chore: maintenance/configuration
- refactor: internal code improvements
- ci: CI workflow changes

Examples:
- feat(front): add product filters sidebar toggles
- fix(back): inject PrismaService in orders repository
- ci: add monorepo quality pipeline

## Pull Request Checklist

Before opening a PR:
- npm run lint
- npm run build
- npm run test -w back -- --runInBand
- npm run test -w front

PR should include:
- clear summary and scope
- related issue reference when applicable
- screenshots for UI changes
- migration notes if database behavior changed

## Code Style

- Follow ESLint and Prettier configuration in each workspace.
- Keep changes scoped and avoid unrelated formatting edits.
- Add tests for behavior changes when possible.
