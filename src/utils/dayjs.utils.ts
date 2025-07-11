import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';

import CONFIG from '@/apps/config';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

const appTimezone: string = CONFIG.DEFAULT_TIMEZONE ?? dayjs.tz.guess() ?? 'UTC';

dayjs.tz.setDefault(appTimezone);

const dayjsTZ = (date?: dayjs.ConfigType) => dayjs(date).tz(appTimezone);

const extendedDayjs = dayjs;

export default dayjsTZ;
export { extendedDayjs };
