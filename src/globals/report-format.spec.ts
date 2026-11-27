import { describe, expect, it } from "vitest";
import { formatReportNumber, formatReportTimestamp, getBattleDay } from "./report-format";

const unix = (date: string) => Date.parse(date) / 1000;

describe("report formatting", () => {
  it("pads the date and time in Beijing time", () => {
    expect(formatReportTimestamp(unix("2026-11-27T01:23:04Z"))).toEqual({
      date: "2026-11-27",
      time: "09:23:04",
    });
    expect(formatReportTimestamp(unix("2026-12-01T16:00:00Z")).time).toBe("00:00:00");
  });

  it("uses the full YYYY-MM-DD battle day at the 05:00 boundary", () => {
    expect(getBattleDay(unix("2026-12-01T04:59:59+08:00"))).toBe("2026-11-30");
    expect(getBattleDay(unix("2026-12-01T05:00:00+08:00"))).toBe("2026-12-01");
  });

  it("groups digits without shortening damage or score", () => {
    expect(formatReportNumber(403966991)).toBe("403,966,991");
    expect(formatReportNumber(2259543505)).toBe("2,259,543,505");
    expect(formatReportNumber(0)).toBe("0");
    expect(formatReportNumber(NaN)).toBe("—");
  });

  it("rounds 亿 to two decimals, with exact ties going to even", () => {
    expect(formatReportNumber(400_499_999, "亿")).toBe("4.00 亿");
    expect(formatReportNumber(400_500_000, "亿")).toBe("4.00 亿");
    expect(formatReportNumber(400_500_001, "亿")).toBe("4.01 亿");
    expect(formatReportNumber(401_500_000, "亿")).toBe("4.02 亿");
    expect(formatReportNumber(1, "亿")).toBe("0.00 亿");
  });

  it("rounds 万, m, and k to grouped integers, using the same tie rule", () => {
    expect(formatReportNumber(12_345_000, "万")).toBe("1,234 万");
    expect(formatReportNumber(12_355_000, "万")).toBe("1,236 万");
    expect(formatReportNumber(1_234_500_000, "m")).toBe("1,234 m");
    expect(formatReportNumber(1_235_500_000, "m")).toBe("1,236 m");
    expect(formatReportNumber(1_234_500, "k")).toBe("1,234 k");
    expect(formatReportNumber(1_235_500, "k")).toBe("1,236 k");
  });
});
