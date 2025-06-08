# Workflows

this docs for github workflows

## Build Workflow

`.github/workflows/build.yml`

This workflow is triggered on pushes to the `main` or `dev` branches. It is responsible for **building the Node.js project** using `pnpm` after ensuring the correct Node.js version is installed and dependencies are locked.

### Trigger

This workflow runs when code is pushed to the `main` or `dev` branches.

```yaml
on:
  push:
    branches: [main, dev]
```

### Jobs

#### build

**Purpose**: Set up the environment, install dependencies, and build the project.

```yaml
jobs:
  build:
    name: Build Project
    runs-on: ubuntu-latest
```

Runs the job in a clean Ubuntu environment.

### Steps Breakdown

| Step                    | Description                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `actions/checkout@v3`   | Checks out the repository code.                                                                          |
| `setup-node@v3`         | Sets up **Node.js v18** environment.                                                                     |
| `Install pnpm globally` | Installs `pnpm` package manager using npm.                                                               |
| `Install dependencies`  | Installs project dependencies using `pnpm`, ensuring the lockfile is respected with `--frozen-lockfile`. |
| `Build`                 | Executes the build script defined in your `package.json` (i.e., `pnpm run build`).                       |

### Requirements

- `Node.js v18` must be supported by the project.
- `pnpm` must be used as the package manager.
- A valid build script must exist in `package.json`.

Example:

```json
"scripts": {
  "build": "your-build-command"
}
```

### Outcome

After this workflow runs:

- The code is fully built and ready for deployment or testing.
- No artifacts are uploaded yet (handled in another workflow if needed).

## Continuous Integration (CI)

`.github/workflows/ci.yaml`

This workflow ensures code quality and correctness by running:

- Dependency installation and caching
- Linting with `ESLint`
- Automated testing with `code coverage`
- Database integration using a `PostgreSQL` service

### Trigger

It runs on:

- Push to `main` or `dev` branches
- Pull requests targeting `main` or `dev`

```yaml
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]
```

### Jobs

#### `setup`: Setup & Dependency Installation

| Step                             | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `actions/checkout@v3`            | Checks out your repository code.                                         |
| `setup-node@v3`                  | Sets up **Node.js v18**.                                                 |
| `Install pnpm globally`          | Installs `pnpm` using npm.                                               |
| `actions/cache@v3`               | Caches the `~/.pnpm-store/v3` directory to speed up subsequent installs. |
| `pnpm install --frozen-lockfile` | Installs dependencies respecting the lockfile.                           |

**Output**: `cache-hit` – whether the pnpm store cache was used.

#### `lint`: Lint Codebase

Depends on: `setup`

| Step                                           | Description                           |
| ---------------------------------------------- | ------------------------------------- |
| Repeats setup steps (checkout, Node.js, pnpm). |                                       |
| `pnpm run lint`                                | Runs your lint script (e.g., ESLint). |

Make sure your `package.json` includes:

```json
"scripts": {
  "lint": "your-lint-command"
}
```

#### `test`: Test with Coverage

- Depends on: `setup`
- Uses **PostgreSQL 15** as a test service

| Step                        | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `postgres` service          | Sets up a local PostgreSQL container with credentials.     |
| Set env variables           | Defines `NODE_ENV`, `DATABASE_URL`, JWT secrets, etc.      |
| `pnpm run prisma:deploy`    | Runs database schema migrations.                           |
| `pnpm run test:coverage`    | Runs tests with coverage.                                  |
| `codecov/codecov-action@v3` | Uploads coverage results to [Codecov](https://codecov.io). |

Make sure your `package.json` includes:

```json
"scripts": {
  "test:coverage": "your-test-runner --coverage"
}
```

### Requirements

- Node.js 18 support
- PostgreSQL-compatible schema
- `pnpm` as the package manager
- Codecov account & token (`CODECOV_TOKEN` in GitHub secrets)
- ESLint config and lint script
- `prisma:deploy` script if using Prisma (or replace with your own migration command)

### Outcome

This workflow validates every push/PR by:

- Ensuring dependencies install cleanly
- Enforcing coding standards
- Testing code behavior and DB interaction
- Reporting test coverage to Codecov

## Security Scan Workflow (CodeQL)

`.github/workflows/codeql-scan.yml`

This workflow performs `static security analysis` on your codebase using GitHub’s CodeQL. It helps detect vulnerabilities and security issues early by scanning your TypeScript code on every push or pull request.

### Trigger

The workflow runs on:

- Push events to the `main` and `dev` branches
- Pull requests targeting `main` or `dev`

```yaml
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]
```

### Jobs

`analyze`: CodeQL Analysis

| Step                                   | Description                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `actions/checkout@v3`                  | Checks out the repository code for scanning.                                        |
| `github/codeql-action/init@v2`         | Initializes the CodeQL tool with the specified languages (`typescript`).            |
| `github/codeql-action/autobuild@v2`    | Automatically builds the project to prepare it for analysis.                        |
| `github/codeql-action/analyze@v2`      | Runs the CodeQL analysis on the codebase.                                           |
| `github/codeql-action/upload-sarif@v2` | Uploads the analysis results (SARIF format) to GitHub Security tab for easy review. |

### Configuration

- **Languages scanned**: TypeScript (easily extendable by adding other languages to the matrix)
- **Branches covered**: Main and development branches ensure scanning during active development and production-ready code.
- **Results**: Uploaded to the GitHub Security tab for centralized visibility.

### Requirements

- Ensure your project builds correctly with the autobuild step.
- GitHub repository must have GitHub Code Scanning enabled.
- You can customize queries or add additional CodeQL packs via the init step if desired.

### Outcome

- Automated, continuous security scanning integrated into your CI/CD pipeline.
- Early detection of potential security vulnerabilities in your TypeScript code.
- Results are directly visible and actionable inside GitHub’s Security tab.
