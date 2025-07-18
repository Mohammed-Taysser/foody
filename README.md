# Foody

[prettier]: https://github.com/prettier/prettier

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat&logo=prettier)][prettier] [![codecov](https://codecov.io/gh/Mohammed-Taysser/foody/graph/badge.svg?token=H8K42DI9OZ)](https://codecov.io/gh/Mohammed-Taysser/foody) [![CI](https://github.com/Mohammed-Taysser/foody/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohammed-Taysser/foody/actions/workflows/ci.yml) [![Build](https://github.com/Mohammed-Taysser/foody/actions/workflows/build.yml/badge.svg)](https://github.com/Mohammed-Taysser/foody/actions/workflows/build.yml) [![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

## Overview

## Key Features

## Architecture

## Technology Stack

## Testing

### Test Structure

- Unit Tests
- Integration Tests
- End-to-End Tests

### Test Coverage Requirements

- Statements: 80%
- Branches: 75%
- Functions: 85%
- Lines: 80%

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/services/campaign.service.test.ts

# Run tests in watch mode
npm run test:watch
```

### Best Practices

#### 1. Test Organization

- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow the Arrange-Act-Assert pattern

#### 2. Test Isolation

- Each test should be independent
- Clean up test data after each test
- Use fresh database instances
- Reset state between tests using `beforeEach`
- Clean up after tests using `afterEach`
- Mock external dependencies

#### 3. Meaningful Assertions

- Test specific behaviors
- Use descriptive test names
- Include edge cases
- Test boundary conditions
- Test error scenarios
- Test performance limits

#### 4. Async Testing

- Use `async/await` for asynchronous tests
- Test both success and failure paths
- Handle timeouts appropriately

#### 5. Mocking

- Mock at the right level
- Provide realistic mock implementations
- Reset mocks between tests

### Setup and Teardown

```ts
describe('Test Suite', () => {
  let service: AnalyticsService;

  beforeAll(() => {
    // One-time setup
  });

  beforeEach(() => {
    service = new AnalyticsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // One-time cleanup
  });
});
```

## Deployment

### Environment Variables

## Development Guide

## Setup Guide

### Prerequisites

Before setting up the Foody Platform, ensure you have the following prerequisites installed:

### Required Software

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher, optional for caching)
- Git

### Installation Steps

1. Clone the repository: `git clone https://github.com/Mohammed-Taysser/foody.git`
2. Navigate to the project directory: `cd foody`
3. Install dependencies: `pnpm install`
4. Setup environment variables: `cp .env.example .env`
5. Start the development server: `pnpm run dev`

## Why Add Refresh Tokens?

| Access Token                | Refresh Token                  |
| --------------------------- | ------------------------------ |
| Short-lived (e.g. 15 min)   | Long-lived (e.g. 7 days)       |
| Sent on every request       | Sent once to get new access    |
| Stored in memory or headers | Stored in **HTTP-only cookie** |
| Expires quickly             | Can rotate / revoke            |

## DOCS

### Why Swagger?

| Feature                | Benefit                              |
| ---------------------- | ------------------------------------ |
| 📖 Auto-generated docs | Based on code comments or decorators |
| ⚙️ Dev-friendly UI     | Try endpoints directly               |
| 🤝 Team sharing        | Share Postman-style docs via `/docs` |
| 🔐 Auth support        | Can test with bearer tokens          |

## Resources

- [Swagger Documentation](https://swagger.io/docs/specification/v3_0/about/)
- [Swagger Editor](https://editor.swagger.io/)
- [DB Diagram](https://dbdiagram.io)
- [DB Docs](https://dbdocs.io/)
- [Project DB Docs](https://dbdocs.io/mohammed-taysser/Foody)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io)
- [Testing Best Practices](https://jestjs.io/docs/jest-object#jestspyonobject-methodname)
- [NPM dotenv-flow](https://www.npmjs.com/package/dotenv-flow)
