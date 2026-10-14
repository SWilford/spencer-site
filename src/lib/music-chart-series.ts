type Daily = { day: string; count: number; milliseconds: number };
type Hour = { label: string; count: number; minutes: number };
export type MusicChartPoint = { day: string; period?: string; count: number; minutes: number; position: number };

export const hourLabel = (hour: number) => `${hour % 12 || 12} ${hour % 24 < 12 ? "AM" : "PM"}`;

export function musicChartSeries(daily: Daily[], cumulative: boolean, hours?: Hour[]): MusicChartPoint[] {
  const rows: MusicChartPoint[] = [];
  let count = 0, minutes = 0;
  if (hours && daily.length === 1) {
    const day = daily[0].day;
    if (cumulative) rows.push({ day, period: "Start of day · 12 AM ET", count: 0, minutes: 0, position: 0 });
    for (let hour = 0; hour < 24; hour++) {
      const value = hours.find(row => Number(row.label) === hour);
      count += value?.count ?? 0; minutes += value?.minutes ?? 0;
      rows.push({ day, period: `${hourLabel(hour)}–${hourLabel(hour + 1)} ET`, count: cumulative ? count : value?.count ?? 0,
        minutes: cumulative ? minutes : value?.minutes ?? 0, position: (hour + (cumulative ? 1 : .5)) / 24 });
    }
    return rows;
  }
  for (const row of daily) {
    count += row.count; minutes += row.milliseconds / 60000;
    const day = daily.length > 730 ? row.day.slice(0, 7) : row.day;
    const last = rows.at(-1);
    if (last?.day === day) {
      last.count = cumulative ? count : last.count + row.count;
      last.minutes = cumulative ? minutes : last.minutes + row.milliseconds / 60000;
    } else rows.push({ day, count: cumulative ? count : row.count, minutes: cumulative ? minutes : row.milliseconds / 60000, position: 0 });
  }
  return rows.map((row, index) => ({ ...row, position: index / Math.max(1, rows.length - 1) }));
}
