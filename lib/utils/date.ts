import {
  addDays,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
  subWeeks
} from "date-fns";
import { sv } from "date-fns/locale";

export function toISODate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseISODate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

export function formatSwedishDate(value: string | Date, dateFormat = "d MMM yyyy") {
  const date = typeof value === "string" ? parseISODate(value) : value;
  return format(date, dateFormat, { locale: sv });
}

export function getDefaultSunday(referenceDate = new Date()) {
  const sunday = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return toISODate(sunday);
}

export function getLastWeekDate(referenceDate = new Date()) {
  return subWeeks(referenceDate, 1);
}

export function getISOWeekDays(referenceDate = new Date()) {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function filenameDateRange(startDate: string, endDate: string) {
  const safeStart = format(parseISODate(startDate), "yyyyMMdd");
  const safeEnd = format(parseISODate(endDate), "yyyyMMdd");
  return `${safeStart}-${safeEnd}`;
}

export function weekdayLabel(date: Date) {
  return format(date, "EEE", { locale: sv });
}
