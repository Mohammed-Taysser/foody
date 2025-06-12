# Timezone-aware `dayjs` Utility

This project uses a custom wrapper around `dayjs` to ensure all date-time operations respect a consistent timezone defined in your environment.

Here a list of [timezones](../../public/timezones.json)

## Features

- Uses `dayjs` with timezone support
- Default timezone is set via `.env` file using `VITE_TIMEZONE`
- Falls back to user timezone if env not set
- Fully compatible with native `dayjs` API

## Setup

1. **Install required dependencies** (already included if you're using the project):

```bash
npm install dayjs
```

1. **Add to your `.env` file** (root of your project):

```env
VITE_TIMEZONE=America/New_York
```

1. **Usage example**:

```ts
// Import the wrapper
import dayjsTZ from '@/utils/dayjsTZ';

// Use just like dayjs
const now = dayjsTZ();
console.log(now.format()); // Output in America/New_York timezone

const specific = dayjsTZ('2025-06-01T12:00:00Z');
console.log(specific.format()); // Parsed in fixed timezone
```

## Example Timezones to Try

| Timezone ID        | Description                |
| ------------------ | -------------------------- |
| `UTC`              | Coordinated Universal Time |
| `Asia/Tokyo`       | Japan Standard Time        |
| `Europe/London`    | GMT / BST                  |
| `America/New_York` | Eastern Time (US)          |
| `Asia/Dubai`       | Gulf Standard Time         |
| `Australia/Sydney` | Australian Eastern Time    |

> You can find the full list of [timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) or from the `moment-timezone` data if needed.
