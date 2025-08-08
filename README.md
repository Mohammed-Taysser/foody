# Foody

[prettier]: https://github.com/prettier/prettier

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat&logo=prettier)][prettier] [![codecov](https://codecov.io/gh/Mohammed-Taysser/foody/graph/badge.svg?token=H8K42DI9OZ)](https://codecov.io/gh/Mohammed-Taysser/foody) [![CI](https://github.com/Mohammed-Taysser/foody/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohammed-Taysser/foody/actions/workflows/ci.yml) [![Build](https://github.com/Mohammed-Taysser/foody/actions/workflows/build.yml/badge.svg)](https://github.com/Mohammed-Taysser/foody/actions/workflows/build.yml) [![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

## Overview

| Layer                    | Tech / Library                                       | Why?                                                                        |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| **Runtime**              | Node.js (v18+)                                       | Mature ecosystem, great async support                                       |
| **Web Framework**        | Express JS                                           | Lightweight, unopinionated; pairs well with TypeScript                      |
| **Language**             | TypeScript                                           | Early type-safety avoids runtime bugs                                       |
| **Database**             | PostgreSQL                                           | Relational integrity for orders/inventory                                   |
| **ORM/Query**            | Prisma                                               | Auto-generated types, migrations, great DX                                  |
| **Authentication**       | JWT + Passport.js                                    | Flexible, supports sessions or stateless APIs                               |
| **Real-Time**            | Socket.IO                                            | Push live order/kitchen updates                                             |
| **Caching/Queue**        | Redis + Bull                                         | Fast cache (menus, sessions) and background jobs (emails)                   |
| **File Uploads**         | Multer                                               | Handles images (menu photos)                                                |
| **API Docs**             | Swagger (swagger-jsdoc + swagger-ui-express)         | Interactive, keeps backend/contracts in sync                                |
| **Logging & Monitoring** | Winston; Sentry                                      | Structured logs + real-time error tracking                                  |
| **Testing**              | Jest + Supertest                                     | Unit + integration tests for API routes                                     |
| **Front-End**            | React (or Next.js) + TypeScript                      | Component-based, SSR option (Next.js), strong TS support                    |
|                          | React Query (for data fetching) + Context or Zustand | Avoid Redux; React Query handles server state, Context/Zustand for UI state |
|                          | Tailwind CSS                                         | Utility-first, fast to build responsive UIs                                 |
| **DevOps**               | Docker + Docker Compose                              | Consistent environments                                                     |
|                          | Nginx (reverse proxy) + PM2 (process manager)        | Production-ready                                                            |
|                          | GitHub Actions                                       | Automated tests & deploy                                                    |

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

### 1. IDE Configuration

- Install extensions: TypeScript, ESLint, Prettier, etc.
- Set up workspace folders
- Configure linting and formatting

### 2. Development Workflow

1. Install dependencies: `pnpm install`
2. Set up environment variables: `cp .env.example .env`
3. Start development server: `pnpm run dev`

### 3. Local Development Workflow

- Create feature branch:

  ```bash
  git checkout -b feature/your-feature
  ```

- Make changes and commit:

  ```bash
  git add .
  git commit -m "feat: add new feature"
  ```

- Push changes:

  ```bash
  git push origin feature/your-feature
  ```

- Create pull request

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

## Maintenance

### 1. Regular Tasks

- Monitor system health
- Check error logs
- Backup database
- Update dependencies
- Rotate logs

### 2. Backup Procedures

- Create a backup of the database
- Upload backup to cloud storage
- Delete old backups
- Create cron job to run backups daily
- Create backup of media files

### 3. Update Procedures

1. Backup current version
2. Pull latest changes
3. Update dependencies
4. Run migrations
5. Restart services
6. Verify functionality

### Compression

```bash
tar -czf foody.tar.gz foody
```

### Backup a PostgreSQL Database

Using `pg_dump` (recommended for single databases)

```bash
pg_dump -U your_username -d your_database > backup.sql
```

- `-U`: Your PostgreSQL username
- `-d`: Database name
- `>`: Redirects the output to a file

Example:

```bash
pg_dump -U postgres -d mydb > mydb_backup.sql
```

> You’ll be prompted for a password unless you use `.pgpass` or environment variables.

### Restore a PostgreSQL Database

Using `psql` to restore from `.sql` file

Make sure the database exists first:

```bash
createdb -U your_username your_database
```

Then restore:

```bash
psql -U your_username -d your_database < backup.sql
```

Example:

```bash
psql -U postgres -d mydb < mydb_backup.sql
```

#### For Binary Backups (Custom Format)

Using `pg_dump` with custom format

```bash
pg_dump -U your_username -F c -d your_database -f backup.dump
```

- `-F c`: Custom format
- `-f`: Output file name

Restore Custom Format using `pg_restore`

Create the database if needed:

```bash
createdb -U your_username your_database
```

Then:

```bash
pg_restore -U your_username -d your_database backup.dump
```

> If you have multiple databases, you can use `pg_dumpall` and `pg_restoreall` instead.

## Application SSL Configuration

```ts
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/fullchain.pem'),
};

const server = https.createServer(options, app);
```

## Troubleshooting Guide

### Database Connection Issues

```bash
# Check postgres status
sudo systemctl status postgresql

# Check postgres logs
sudo journalctl -u postgresql.service

# Test database connection
psql -U your_username -d your_database
```

### API Issues

```bash
# Check API logs
tail -f /logs/app.log

# Test API endpoints
curl -X GET http://localhost:3000/api/users
```

#### Redis Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping

# Monitor Redis
redis-cli monitor
```

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

## Support

For additional support:

- Check the documentation
- Review error logs
- Contact support team
- Open GitHub issues
