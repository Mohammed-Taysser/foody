import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';

import CONFIG from '@/apps/config';
import { DateRangeInput } from '@/validations/base.validation';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const appTimezone: string = CONFIG.DEFAULT_TIMEZONE ?? dayjs.tz.guess() ?? 'UTC';

dayjs.tz.setDefault(appTimezone);

const dayjsTZ = (date?: dayjs.ConfigType) => dayjs(date).tz(appTimezone);

const extendedDayjs = dayjs;

function buildDateRangeFilter(dateRange?: DateRangeInput) {
  if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) {
    return undefined;
  }

  const filter: Pick<Prisma.DateTimeNullableFilter, 'gte' | 'lte'> = {};

  if (dateRange.startDate) {
    const start = extendedDayjs(dateRange.startDate).startOf('day').toDate();
    filter.gte = start;
  }

  if (dateRange.endDate) {
    const end = extendedDayjs(dateRange.endDate).endOf('day').toDate();
    filter.lte = end;
  }

  return filter;
}

export default dayjsTZ;
export { buildDateRangeFilter, extendedDayjs };
