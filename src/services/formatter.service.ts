import dayjsTZ, { extendedDayjs } from '@/utils/dayjs.utils';

class FormatterService {
  formatNumber(value: number, decimalPlaces: number = 2): string {
    return value.toFixed(decimalPlaces);
  }

  formatDate(date: Date, format = 'YYYY-MM-DD'): string {
    return dayjsTZ(date).format(format);
  }

  formatTime(date: Date, format = 'HH:mm:ss'): string {
    return dayjsTZ(date).format(format);
  }

  formatDateTime(date: Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjsTZ(date).format(format);
  }

  formatCurrency(amount: number, currencyCode = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }

  formatRelativeTime(date: Date): string {
    return dayjsTZ(date).fromNow();
  }

  formatPercentage(value: number, decimalPlaces: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
    }).format(value);
  }

  formatCompactNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  }

  formatDuration(ms: number): string {
    const d = extendedDayjs.duration(ms);
    return `${d.hours()}h ${d.minutes()}m ${d.seconds()}s`;
  }
}

const formatterService = new FormatterService();

export default formatterService;
