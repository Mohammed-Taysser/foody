import dayjsTZ, { extendedDayjs } from '@/utils/dayjs.utils';

jest.mock('@/apps/config', () => ({
  __esModule: true,
  default: {
    DEFAULT_TIMEZONE: 'Asia/Dubai',
  },
}));

describe('dayjs.utils', () => {
  it('should return a date with correct UTC offset for Asia/Dubai', () => {
    const now = dayjsTZ();
    // Asia/Dubai is UTC+4
    expect(now.utcOffset()).toBe(240); // 60 * 4
  });

  it('should apply timezone conversion to a passed date', () => {
    const input = '2025-01-01T00:00:00Z'; // UTC
    const tzDate = dayjsTZ(input);
    // Converted to Dubai time: UTC+4 => 04:00:00
    expect(tzDate.format('HH:mm')).toBe('04:00');
  });

  it('should expose extended dayjs instance with plugins like isoWeek', () => {
    const week = extendedDayjs('2025-01-01').isoWeek();
    expect(typeof week).toBe('number');
  });
});
