import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const PH_TIMEZONE = 'Asia/Manila';

/**
 * Convert any date to Philippine Time
 * @param {Date|string|dayjs.Dayjs} date - The date to convert
 * @returns {dayjs.Dayjs} - Date in Philippine Time
 */
export const toPHTime = (date) => {
  if (!date) return null;
  return dayjs(date).tz(PH_TIMEZONE);
};

/**
 * Format a date to Philippine Time string
 * @param {Date|string|dayjs.Dayjs} date - The date to format
 * @param {string} format - The format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} - Formatted date string in Philippine Time
 */
export const formatPHTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  return toPHTime(date).format(format);
};

/**
 * Get current time in Philippine Time
 * @returns {dayjs.Dayjs} - Current date/time in Philippine Time
 */
export const nowPH = () => {
  return dayjs().tz(PH_TIMEZONE);
};

/**
 * Parse a date string as Philippine Time
 * @param {string} dateString - The date string to parse
 * @returns {dayjs.Dayjs} - Parsed date in Philippine Time
 */
export const parsePHTime = (dateString) => {
  return dayjs.tz(dateString, PH_TIMEZONE);
};

export default {
  toPHTime,
  formatPHTime,
  nowPH,
  parsePHTime,
  PH_TIMEZONE
};
