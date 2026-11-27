import { ref, watch } from "vue";
import { battleUnits, type BattleUnit } from "./report-format";

const key = "kcrr.battle-number-unit";

function readUnit(): BattleUnit {
  try {
    const saved = localStorage.getItem(key);
    return battleUnits.find((unit) => unit === saved) ?? "基本";
  } catch {
    return "基本";
  }
}

export const battleNumberUnit = ref(readUnit());
watch(battleNumberUnit, (unit) => {
  try {
    localStorage.setItem(key, unit);
  } catch {
    // The preference still works for the current page session.
  }
});
