# Troubleshooting Guide

This guide covers common troubleshooting scenarios for the Foody Node.js project. If you encounter issues not listed here, please check logs, error messages, and ensure your environment matches the project requirements.

## Table of Contents

- [Troubleshooting Guide](#troubleshooting-guide)
  - [Table of Contents](#table-of-contents)
  - [General Troubleshooting](#general-troubleshooting)
    - [1. Server Fails to Start](#1-server-fails-to-start)
    - [2. Environment Variable Validation Errors](#2-environment-variable-validation-errors)
    - [7. Logging and Debugging](#7-logging-and-debugging)
  - [Database \& Migrations](#database--migrations)
    - [3. Database Connection or Migration Issues](#3-database-connection-or-migration-issues)
  - [API \& Network](#api--network)
    - [4. API Returns 400, 401, 403, 404, or 409 Errors](#4-api-returns-400-401-403-404-or-409-errors)
    - [8. CORS or Network Issues](#8-cors-or-network-issues)
  - [File Handling](#file-handling)
    - [5. File Upload Issues](#5-file-upload-issues)
  - [Testing](#testing)
    - [6. Test Failures](#6-test-failures)
  - [Documentation](#documentation)
    - [9. Swagger Docs Not Loading](#9-swagger-docs-not-loading)
  - [Reference](#reference)
    - [10. Common Error Messages](#10-common-error-messages)
  - [Getting More Help](#getting-more-help)
    - [11. Still Stuck?](#11-still-stuck)

## General Troubleshooting

### 1. Server Fails to Start

**Symptoms:**

- Terminal shows "Port XXXX is already in use."
- Server process exits immediately.

**Resolution:**

- The server checks if the configured port is available ([src/server.ts](src/server.ts)). If not, it prompts to use the next port.
- Free the port or allow the server to use a different one.
- Ensure your `.env` file has a valid `PORT` value.

### 2. Environment Variable Validation Errors

**Symptoms:**

- Startup error: "❌ Environment variable validation failed"
- Lists missing or invalid environment variables.

**Resolution:**

- Check your `.env` file against `.env.example`.
- Ensure all required variables are set and valid ([src/config/config.ts](src/config/config.ts)).
- Restart the server after fixing the `.env` file.

### 7. Logging and Debugging

**Symptoms:**

- Need more information about errors or server state.

**Resolution:**

- Logs are managed by Winston ([src/utils/winston-logger.utils.ts](src/utils/winston-logger.utils.ts)).
- In development, error responses include stack traces.
- Check log files in the `logs/` directory if enabled.

## Database & Migrations

### 3. Database Connection or Migration Issues

**Symptoms:**

- Errors related to Prisma or database connection.
- Migration failures.

**Resolution:**

- Ensure your database is running and accessible.
- Check `DATABASE_URL` in `.env`.
- Run migrations:

  ```bash
  npx prisma migrate deploy
  ```

- For seeding:

  ```bash
  ts-node src/scripts/seed.ts
  ```

## API & Network

### 4. API Returns 400, 401, 403, 404, or 409 Errors

**Symptoms:**

- API responds with error codes and messages.

**Common Causes & Fixes:**

- **400 Bad Request:**
  - Invalid request data (see Zod validation in middleware).
  - Check request body/params match API schema.
- **401 Unauthorized:**
  - Missing or invalid authentication token.
  - Ensure you include a valid `Authorization: Bearer <token>` header.
- **403 Forbidden:**
  - Insufficient permissions or wrong user role.
  - Check your user role and permissions.
- **404 Not Found:**
  - Resource does not exist (e.g., wrong ID).
  - Double-check resource IDs.
- **409 Conflict:**
  - Duplicate data or related resource missing (e.g., email already exists, restaurant/category does not exist).
  - Ensure referenced resources exist and data is unique.

### 8. CORS or Network Issues

**Symptoms:**

- Browser blocks requests due to CORS.
- Cannot access server from network.

**Resolution:**

- Update `ALLOWED_ORIGINS` in `.env` to include your frontend URL.
- Ensure firewall or network settings allow access to the server port.

## File Handling

### 5. File Upload Issues

**Symptoms:**

- Image upload fails or image not saved.

**Resolution:**

- Ensure the `public/uploads` directory exists and is writable.
- Check that requests use `multipart/form-data` when uploading files.

## Testing

### 6. Test Failures

**Symptoms:**

- Jest or integration tests fail.

**Resolution:**

- Ensure test database is configured and migrations are up to date.
- Check for missing environment variables in test environment.
- Review test output for specific error messages.

## Documentation

### 9. Swagger Docs Not Loading

**Symptoms:**

- `/docs` endpoint does not load or shows errors.

**Resolution:**

- Ensure `docs/swagger.yaml` exists and is valid.
- Check server logs for YAML parsing errors.

## Reference

### 10. Common Error Messages

| Error Code | Meaning               | Typical Cause                 |
| ---------- | --------------------- | ----------------------------- |
| 400        | Bad Request           | Invalid input data            |
| 401        | Unauthorized          | Missing/invalid token         |
| 403        | Forbidden             | Insufficient permissions      |
| 404        | Not Found             | Resource does not exist       |
| 409        | Conflict              | Duplicate or conflicting data |
| 500        | Internal Server Error | Unhandled exception           |

## Getting More Help

### 11. Still Stuck?

- Check the logs and stack traces.
- Review the [README.md](README.md) for setup instructions.
- Search for the error message in the codebase.
- If using Docker, ensure containers are running and healthy.
- Ask for help with error details
