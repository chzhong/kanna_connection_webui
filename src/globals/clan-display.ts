import type {
  AnalyticsCompositionInfo,
  ClanOperationsResponse,
  OperationAccountInfo,
} from "./apimodels";

type MonitorAccount = {
  user_id: number | null;
  platform?: number | null;
  viewer_id?: number | null;
  name?: string | null;
};

export const ACTIVE_MONITOR = "active";

export function platformName(platform: number | null | undefined) {
  return platform == null
    ? "未知服务器"
    : ["B服", "渠道服", "台服"][platform] || `服务器${platform}`;
}

export function monitorAccountKey(account: OperationAccountInfo) {
  return `${account.user_id}:${account.platform}`;
}

export function monitorAccountLabel(account: MonitorAccount) {
  const uid = account.viewer_id ? String(account.viewer_id) : "—";
  const shortUid = uid.length > 7 ? `${uid.slice(0, 3)}…${uid.slice(-4)}` : uid;
  return `${account.name || "未知昵称"} · ${platformName(account.platform)} · UID ${shortUid} · QQ ${account.user_id ?? "—"}`;
}

export function monitorSelection(
  operations: Pick<ClanOperationsResponse, "accounts" | "monitor">,
  preferred?: string
) {
  const { accounts, monitor } = operations;
  const matches = accounts.filter(
    (account) => account.user_id === monitor.operator_id &&
      (monitor.platform == null || account.platform === monitor.platform) &&
      (monitor.viewer_id == null || account.viewer_id == null || account.viewer_id === monitor.viewer_id)
  );
  const matching = matches.length === 1 ? matches[0] : null;
  const current: MonitorAccount | null = monitor.operator_id == null ? null : {
    user_id: monitor.operator_id,
    platform: monitor.platform ?? matching?.platform,
    viewer_id: monitor.viewer_id ?? matching?.viewer_id,
    name: monitor.operator_name && monitor.operator_name !== String(monitor.operator_id)
      ? monitor.operator_name
      : matching?.name,
  };

  if (monitor.running) {
    return { key: matching ? monitorAccountKey(matching) : ACTIVE_MONITOR, current, matching };
  }

  const account = accounts.find((item) => monitorAccountKey(item) === preferred)
    ?? matching ?? accounts[0];
  return { key: account ? monitorAccountKey(account) : "", current, matching };
}

export function compositionCharacters(composition: AnalyticsCompositionInfo) {
  return composition.characters?.length ? composition.characters : composition.units.map((raw) => ({
    unit_id: raw >= 100000 ? Math.trunc(raw / 100) : raw,
    name: "",
  }));
}
