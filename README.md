# Foody

[prettier]: https://github.com/prettier/prettier

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat&logo=prettier)][prettier] [![codecov](https://codecov.io/gh/Mohammed-Taysser/foody/graph/badge.svg?token=H8K42DI9OZ)](https://codecov.io/gh/Mohammed-Taysser/foody) [![CI](https://github.com/Mohammed-Taysser/foody/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohammed-Taysser/foody/actions/workflows/ci.yml) [![Build](https://github.com/Mohammed-Taysser/foody/actions/workflows/build.yml/badge.svg)](https://github.com/Mohammed-Taysser/foody/actions/workflows/build.yml)

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

## Deployment

### Environment Variables

## Development Guide

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Start development server: `npm run dev`

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write unit tests for new features
- Update documentation for API changes

### Git Workflow

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Create pull request

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
