# CLAUDE.md — grokify

Organization-wide guidelines for Claude Code across all grokify repositories.

## Definition of Done

All PRs must satisfy before merge:

| Category | Criteria |
|----------|----------|
| **Code** | Implementation complete, follows existing patterns in the repo |
| **Tests** | Unit tests for new functions; integration tests if behavior crosses packages |
| **Lint** | `golangci-lint run` (Go) or `npm run lint` (TS) passes with no issues |
| **Docs** | README/MkDocs updated if user-visible behavior changes |
| **Changelog** | Entry added, or commit follows conventional commits for auto-generation |
| **Pre-push** | No local `replace` directives in go.mod, no references to untracked files |

## Standard Stack

- **Go version**: 1.25+
- **Linting**: golangci-lint
- **Formatting**: gofmt
- **Commit style**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Merge strategy**: Rebase-merge or merge commit only — squash merge is disabled to preserve conventional commit history
- **Changelog**: [structured-changelog](https://github.com/grokify/structured-changelog) where applicable

## Error Handling (Go)

Follow the priority order in the global CLAUDE.md:
1. Panic (invariant violation)
2. t.Fatal (in tests)
3. Return error
4. Log via slog
5. Report to human

Never silently discard errors with `_`.

## Repository Patterns

- **Library-first**: Reusable packages with thin CLI adapters
- **Specs before implementation**: `docs/specs/{PRD.md,TRD.md,PLAN.md}` for new projects
- **Coverage badge**: Run `gocoverbadge` and update README if coverage changes

## Excluded from Auto-Read

Never read files that may contain secrets:
- `.envrc`, `.env`, `.env.*`
- `credentials.json`, `secrets.json`, `*.pem`, `*.key`
