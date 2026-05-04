import { format, startOfWeek } from 'date-fns';

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function getCurrentMonday(): string {
  return startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
}
