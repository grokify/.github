# .github

Shared GitHub configurations and reusable workflows for grokify repositories.

## Reusable Workflows

Call these workflows from any grokify repository using thin wrappers.

### Go

#### Go CI (`go-ci.yaml`)

Multi-platform testing across Go versions.

```yaml
jobs:
  ci:
    uses: grokify/.github/.github/workflows/go-ci.yaml@main
```

**Inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `go-versions` | `'["1.25.x", "1.24.x"]'` | JSON array of Go versions |
| `platforms` | `'["ubuntu-latest", "macos-latest", "windows-latest"]'` | JSON array of platforms |
| `test-flags` | `'-v -covermode=count'` | Flags for `go test` |

#### Go Lint (`go-lint.yaml`)

Runs golangci-lint.

```yaml
jobs:
  lint:
    uses: grokify/.github/.github/workflows/go-lint.yaml@main
```

**Inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `go-version` | `'1.x'` | Go version for linting |
| `golangci-lint-version` | `'latest'` | golangci-lint version |
| `timeout` | `'3m'` | Lint timeout |
| `args` | `'--verbose'` | Additional arguments |

#### Go CodeQL (`go-codeql.yaml`)

Static analysis security testing.

```yaml
jobs:
  codeql:
    uses: grokify/.github/.github/workflows/go-codeql.yaml@main
```

**Inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `go-version` | `'1.24.x'` | Go version for analysis |
| `queries` | `'security-extended,security-and-quality'` | CodeQL query suites |

### TypeScript

#### TypeScript CI (`ts-ci.yaml`)

Multi-version Node.js testing.

```yaml
jobs:
  ci:
    uses: grokify/.github/.github/workflows/ts-ci.yaml@main
```

**Inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `node-versions` | `'["20.x", "22.x"]'` | JSON array of Node.js versions |
| `platforms` | `'["ubuntu-latest"]'` | JSON array of platforms |
| `working-directory` | `'.'` | Directory containing package.json |
| `test-script` | `'test'` | npm script for testing |

#### TypeScript Lint (`ts-lint.yaml`)

Runs ESLint via npm script.

```yaml
jobs:
  lint:
    uses: grokify/.github/.github/workflows/ts-lint.yaml@main
```

**Inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `node-version` | `'22.x'` | Node.js version for linting |
| `working-directory` | `'.'` | Directory containing package.json |
| `lint-script` | `'lint'` | npm script for linting |

## Workflow Templates

Templates available when creating new workflows in grokify repos:

| Template | Description |
|----------|-------------|
| `go-ci` | Go CI pipeline |
| `go-lint` | Go linting with golangci-lint |
| `go-codeql` | Go CodeQL security analysis |
| `ts-ci` | TypeScript CI pipeline |
| `ts-lint` | TypeScript linting with ESLint |

## Recipes

### Go Repository (Recommended)

Create three workflow files for comprehensive CI:

```yaml
# .github/workflows/go-ci.yaml
name: Go CI
permissions:
  contents: read
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  ci:
    uses: grokify/.github/.github/workflows/go-ci.yaml@main
```

```yaml
# .github/workflows/go-lint.yaml
name: Go Lint
permissions:
  contents: read
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  lint:
    uses: grokify/.github/.github/workflows/go-lint.yaml@main
```

```yaml
# .github/workflows/go-codeql.yaml
name: Go CodeQL
permissions:
  actions: read
  contents: read
  security-events: write
on:
  push:
    branches: [main]
  schedule:
    - cron: '30 1 * * 0'
  workflow_dispatch:

jobs:
  codeql:
    uses: grokify/.github/.github/workflows/go-codeql.yaml@main
```

### TypeScript Repository (Recommended)

```yaml
# .github/workflows/ts-ci.yaml
name: TypeScript CI
permissions:
  contents: read
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  ci:
    uses: grokify/.github/.github/workflows/ts-ci.yaml@main
```

```yaml
# .github/workflows/ts-lint.yaml
name: TypeScript Lint
permissions:
  contents: read
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  lint:
    uses: grokify/.github/.github/workflows/ts-lint.yaml@main
```

### Multi-Language Repository (Go + TypeScript)

For repos with both Go and TypeScript, create separate workflow files with path filters:

```yaml
# .github/workflows/go-ci.yaml
name: Go CI
permissions:
  contents: read
on:
  push:
    branches: [main]
    paths: ['**.go', 'go.mod', 'go.sum', '.github/workflows/go-ci.yaml']
  pull_request:
    branches: [main]
    paths: ['**.go', 'go.mod', 'go.sum', '.github/workflows/go-ci.yaml']
  workflow_dispatch:

jobs:
  ci:
    uses: grokify/.github/.github/workflows/go-ci.yaml@main
```

```yaml
# .github/workflows/ts-ci.yaml
name: TypeScript CI
permissions:
  contents: read
on:
  push:
    branches: [main]
    paths: ['ts/**', '.github/workflows/ts-ci.yaml']
  pull_request:
    branches: [main]
    paths: ['ts/**', '.github/workflows/ts-ci.yaml']
  workflow_dispatch:

jobs:
  ci:
    uses: grokify/.github/.github/workflows/ts-ci.yaml@main
    with:
      working-directory: 'ts'
```

See [grokify/echartify](https://github.com/grokify/echartify) for a complete example.

## Best Practices

### Permissions

Always specify minimal permissions for security:

```yaml
permissions:
  contents: read
```

For CodeQL, additional permissions are required:

```yaml
permissions:
  actions: read
  contents: read
  security-events: write
```

### Branch Targeting

Target specific branches to avoid running CI on feature branches pushed to forks:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### Manual Dispatch

Include `workflow_dispatch` to allow manual workflow runs from the GitHub Actions UI:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
```

## Versioning

Workflows are referenced using Git refs:

| Reference | Example | Stability |
|-----------|---------|-----------|
| Branch | `@main` | Always latest, may have breaking changes |
| Tag | `@v1.0.0` | Pinned to specific version |
| Major tag | `@v1` | Latest within major version (recommended for stability) |

**Current recommendation:** Use `@main` while workflows are actively developed. Once stable, we will tag releases and recommend `@v1` for production use.

## Naming Convention

Workflow files follow the pattern `<language>-<action>.yaml`:

| Pattern | Examples |
|---------|----------|
| `go-*.yaml` | `go-ci.yaml`, `go-lint.yaml`, `go-codeql.yaml` |
| `ts-*.yaml` | `ts-ci.yaml`, `ts-lint.yaml` |

This enables tooling like [pipelineconductor](https://github.com/grokify/pipelineconductor) to detect repo languages by workflow files.

## Community Health Files

Default files applied to all grokify repositories:

- `CODE_OF_CONDUCT.md` - Contributor Covenant
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security policy

## Configuration Files

### golangci.yaml

Copy `workflow-templates/golangci.yaml` to your repo root as `.golangci.yaml` for recommended linter settings.
