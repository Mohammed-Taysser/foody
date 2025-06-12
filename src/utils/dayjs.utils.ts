import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

const dayjsTZ = dayjs;

export default dayjsTZ;
