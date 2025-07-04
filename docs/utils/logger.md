# `logger` - Advanced Winston Logger with Daily Rotation

A robust and flexible logging utility built on [winston](https://github.com/winstonjs/winston) with support for:

- Daily rotated log files
- Console output with color and stack traces
- Custom log levels for `error`, `warn`, `http`, `app`
- Separate handling of exceptions and promise rejections

## ✨ Features

- 🔁 Daily rotating logs (stored in `logs/`)
- 🎨 Colorized, formatted console output
- 📂 Filtered log files by severity (optional)
- 💥 Handles exceptions and unhandled rejections
- 🔍 Includes stack traces when available

## Usage

```ts
import { logger } from '@/utils/logger';

logger.info('Application started');
logger.error(new Error('Something went wrong'));
```

## API

`logger`

An instance of `winston.Logger` with the following configuration:

| Transport Type      | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `Console`           | Logs to terminal with color and timestamp                                   |
| `logs/error-*.log`  | Rotated daily logs for `error` level                                        |
| `logs/warn-*.log`   | Rotated daily logs only for `warn` level                                    |
| `logs/http-*.log`   | Rotated daily logs only for `http` level                                    |
| `logs/app-*.log`    | Rotated daily logs for all logs at `info` level and above (except filtered) |
| `logs/exceptions-*` | Catches and logs unhandled exceptions                                       |
| `logs/rejections-*` | Catches and logs unhandled promise rejections                               |

## Helpers

### `createRotatingLogTransport`

```ts
function createRotatingLogTransport(fileName: string, level = 'info', exact = false);
```

Creates a new daily-rotated log file transport with the following options:

- `fileName`: Log file prefix (`logs/<fileName>-%DATE%.log`)
- `level`: Log level threshold (default: `'info'`)
- `exact`: If `true`, logs only messages that match the level exactly (useful for `warn`, `http`)

**Log Rotation Config**:

- `datePattern`: `'YYYY-MM-DD'`
- `maxSize`: `'20m'`
- `maxFiles`: `'14d'`
- `zippedArchive`: `true`

## Log Format

### Console Output (via `customConsoleFormat`)

```log
2025-06-14 12:34:56 [info] [MyLabel] : Some log message or error stack
```

### File Output

JSON format with structured fields including timestamp, message, level, and optionally stack trace.
