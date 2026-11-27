import { describe, expect, it } from "vitest";
import { ACTIVE_MONITOR, compositionCharacters, monitorAccountLabel, monitorSelection } from "./clan-display";
import type { MonitorStateInfo, OperationAccountInfo } from "./apimodels";

const accounts: OperationAccountInfo[] = [
  { user_id: 12345, platform: 0, viewer_id: 987654321, name: "主号", owner_name: "主号", allow_others: 1 },
  { user_id: 12345, platform: 1, viewer_id: 123456789, name: "小号", owner_name: "小号", allow_others: 1 },
];

const monitor: MonitorStateInfo = {
  running: true, operator_id: 12345, operator_name: "新昵称", platform: 1, viewer_id: 123456789,
  loop_num: 1, last_check: 1, error_count: 0, rank: 0, stage: "",
};

describe("monitor Selection", () => {
  it("uses the running account's platform and live nickname, even if another option was preferred", () => {
    const selected = monitorSelection({ accounts, monitor }, "12345:0");
    expect(selected.key).toBe("12345:1");
    expect(monitorAccountLabel(selected.current!)).toBe("新昵称 · 渠道服 · UID 123…6789 · QQ 12345");
  });

  it("keeps an active account visible without making it a candidate for starting a monitor", () => {
    expect(monitorSelection({ accounts: [accounts[0]], monitor }).key).toBe(ACTIVE_MONITOR);
    const unbound = { ...monitor, viewer_id: 123456790 };
    expect(monitorSelection({ accounts, monitor: unbound }).key).toBe(ACTIVE_MONITOR);
  });

  it("does not guess the platform when an older server returns only an ambiguous QQ", () => {
    const legacy = { ...monitor, platform: undefined, viewer_id: undefined, operator_name: "12345" };
    expect(monitorSelection({ accounts, monitor: legacy }).key).toBe(ACTIVE_MONITOR);
    expect(monitorSelection({ accounts: accounts.slice(1), monitor: legacy }).key).toBe("12345:1");
  });

  it("defaults to the last monitor or first valid account when stopped", () => {
    const stopped = { ...monitor, running: false };
    expect(monitorSelection({ accounts, monitor: stopped }).key).toBe("12345:1");
    expect(monitorSelection({ accounts, monitor: stopped }, "12345:0").key).toBe("12345:0");
    expect(monitorSelection({ accounts, monitor: { ...stopped, operator_id: null } }, "not-in-group").key).toBe("12345:0");
  });
});

describe("compositionCharacters", () => {
  const raw = { units: [133101, 1223], uses: 38, damage: 1000 };

  it("uses the server's roster mapping", () => {
    const characters = [{ unit_id: 1331, name: "测试角色" }];
    expect(compositionCharacters({ ...raw, characters })).toEqual(characters);
  });

  it("keeps IDs as integers even with an older server", () => {
    expect(compositionCharacters(raw)).toEqual([
      { unit_id: 1331, name: "" }, { unit_id: 1223, name: "" },
    ]);
  });
});
