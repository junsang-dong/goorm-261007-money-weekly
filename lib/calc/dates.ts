export function seoulToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function compactDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

export function isoDate(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

export function addDays(compact: string, delta: number): string {
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

export function isWeekend(compact: string): boolean {
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function formatAsOf(isoOrCompact: string): string {
  const compact = isoOrCompact.replaceAll("-", "");
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];
  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")} (${weekday})`;
}

export function previousWeekdays(start: string, count: number): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (dates.length < count) {
    if (!isWeekend(cursor)) dates.push(cursor);
    cursor = addDays(cursor, -1);
    if (dates.length > count + 30) break;
  }
  return dates;
}
