const reportClock = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const reportNumber = new Intl.NumberFormat("zh-CN");
const battleDayOffset = 5 * 60 * 60;
export const battleUnits = ["亿", "万", "m", "k", "基本"] as const;
export type BattleUnit = (typeof battleUnits)[number];
const unitSteps = { 亿: 1_000_000, 万: 10_000, m: 1_000_000, k: 1_000 };

export function formatReportTimestamp(timestamp: number) {
  const date = new Date(timestamp * 1000);
  if (!Number.isFinite(date.getTime())) return { date: "—", time: "—" };

  const parts = Object.fromEntries(
    reportClock.formatToParts(date).map(({ type, value }) => [type, value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

export function getBattleDay(timestamp: number) {
  // Shifting back five hours makes the calendar date match the in-game day.
  return formatReportTimestamp(timestamp - battleDayOffset).date;
}

export function formatReportNumber(value: number, unit: BattleUnit = "基本") {
  if (!Number.isFinite(value)) return "—";
  if (unit === "基本" || !Number.isSafeInteger(value)) return reportNumber.format(value);

  // Battle values are integers. Compare the remainder exactly, including ties.
  const amount = BigInt(Math.abs(value));
  const step = BigInt(unitSteps[unit]);
  let rounded = amount / step;
  const twiceRemainder = (amount % step) * 2n;
  if (twiceRemainder > step || (twiceRemainder === step && rounded % 2n !== 0n)) {
    rounded += 1n;
  }
  const sign = value < 0 && rounded !== 0n ? "-" : "";
  if (unit === "亿") {
    return `${sign}${rounded / 100n}.${String(rounded % 100n).padStart(2, "0")} 亿`;
  }
  return `${sign}${reportNumber.format(rounded)} ${unit}`;
}
