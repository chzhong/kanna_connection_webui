<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FootInfo from "@/components/FootInfo.vue";
import SideMenu from "@/components/SideMenu.vue";
import BattleUnitSelect from "@/components/BattleUnitSelect.vue";
import axios, { AxiosError, type AxiosResponse } from "axios";
import {
  get_report_api,
  correct_dao_api,
  get_report_renew_api,
} from "@/globals/api";
import { show_notice } from "@/globals/until";
import type { ReportInfo, MeReport, DaoDetial } from "@/globals/apimodels";
import { formatReportNumber, formatReportTimestamp, getBattleDay } from "@/globals/report-format";
import { battleNumberUnit } from "@/globals/battle-unit-preference";
import { Edit } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const group_id = route.params.group_id as string;
const report_api = get_report_api(group_id);
const dialog_visible = ref(false);
const dao_type = ref("完整刀");
const dao_id = ref(0);

var data = ref<ReportInfo>({
  user_id: "1791800364",
  priority: 0,
  all: [],
  detail: [],
  me: [],
});

type ReportTab = "all" | "detail" | "me";
const table_type = ref<ReportTab>("all");
const table_data = computed(() => data.value[table_type.value]);
const show_edit = computed(() => table_type.value === "me" ||
  (table_type.value === "detail" && data.value.can_correct_all === true));
const date_filter = computed(() => {
  const rows = table_type.value === "me" ? data.value.me : data.value.detail;
  const days = new Set(rows.map((row) => getBattleDay(row.date)));
  days.delete("—");
  return [...days].sort().reverse().map((day) => ({ text: day, value: day }));
});
const name_filter = computed(() => {
  const rows = table_type.value === "all" ? data.value.all : data.value.detail;
  return [...new Set(rows.map((row) => row.name))].map((name) => ({
    text: name,
    value: name,
  }));
});

axios
  .get(report_api, { withCredentials: true })
  .then((response: AxiosResponse<ReportInfo>) => {
    data.value = response.data;
  })
  .catch((error: Error | AxiosError) => api_error_handle(error));

const api_error_handle = (error: Error | AxiosError) => {
  // 错误处理
  if (axios.isAxiosError(error)) {
    // 服务器响应错误
    if (error.response) {
      show_notice(
        "服务器错误: " + error.response.status + error.response.data.detail
      );
      if (error.response.status == 401) {
        router.push("/login");
      }
    } else {
      // 无法接收服务器响应
      show_notice("服务器错误并且无返回" + error.request || error.message);
    }
  } else {
    // 其他类型的错误
    show_notice("其他错误" + error.message);
  }
};
function close() {
  dialog_visible.value = false;
}

function confirm(type: string) {
  const id = dao_id.value;
  close();
  axios
    .post(
      correct_dao_api,
      { type: type, dao_id: id, group_id: group_id },
      { withCredentials: true }
    )
    .then((response: AxiosResponse<string>) => {
      show_notice(response.data, "success");
      for (const row of [...data.value.me, ...data.value.detail]) {
        if (row.dao_id === id) row.type = type;
      }
    })
    .catch((error: Error | AxiosError) => api_error_handle(error));
}

function correct_dao(id: number, type: string) {
  dao_type.value = type;
  dialog_visible.value = true;
  dao_id.value = id;
}

function type_color(type: string) {
  if (type === "尾刀") return "danger";
  if (type === "补偿" || type === "补偿刀") return "warning";
  return "info";
}
const filter_boss = (value: number, row: DaoDetial | MeReport) => {
  return row.boss == value;
};

const filter_date = (value: string, row: DaoDetial | MeReport) =>
  getBattleDay(row.date) === value;

const filter_name = (value: string, row: DaoDetial) => {
  return row.name == value;
};

const eventSource = ref<EventSource>(
  new EventSource(get_report_renew_api(group_id), {
    withCredentials: true,
  })
);

const initEventSource = () => {
  eventSource.value.onmessage = function (event: MessageEvent) {
    data.value = JSON.parse(event.data);
  };

  eventSource.value.onerror = function (error: Event) {
    show_notice("实时连接暂时中断，正在自动重连");
  };
};

// 在组件卸载时关闭 EventSource
onUnmounted(() => {
  if (eventSource.value) {
    eventSource.value.close();
  }
});

initEventSource();
</script>

<template>
  <el-container>
    <el-aside width="250px">
      <SideMenu :qq_id="data.user_id" :group_id="group_id"></SideMenu>
    </el-aside>
    <el-main class="report-main">
      <HeaderMenu :priority="data.priority"></HeaderMenu>
      <el-scrollbar class="report-scrollbar">
        <el-card class="report-panel" shadow="never" :body-style="{ padding: '0' }">
          <template #header>
            <h1 class="report-title">会战战报</h1>
            <el-tabs v-model="table_type" class="report-tabs">
              <el-tab-pane label="公会总表" name="all" />
              <el-tab-pane label="出刀详情" name="detail" />
              <el-tab-pane label="我的战报" name="me" />
            </el-tabs>
            <div class="report-meta">
              <span>共 {{ table_data.length }} {{ table_type === 'all' ? '名成员' : '条记录' }}</span>
              <span v-if="table_type !== 'all'">北京时间 · 05:00 换日</span>
            </div>
          </template>

          <el-table
            :data="table_data"
            class="report-table"
            table-layout="fixed"
            :empty-text="table_type === 'all' ? '暂无公会战报' : '暂无出刀记录'"
          >
            <el-table-column
              label="排名"
              type="index"
              width="60"
              align="center"
              v-if="table_type === 'all'"
            />
            <el-table-column
              label="结算时间"
              v-if="table_type !== 'all'"
              min-width="156"
              sortable
              prop="date"
              sort-by="date"
              :filters="date_filter"
              :filter-method="filter_date"
            >
              <template #default="scope">
                <div class="report-timestamp">
                  <span class="report-clock">{{ formatReportTimestamp(scope.row.date).time }}</span>
                  <span class="report-date">{{ formatReportTimestamp(scope.row.date).date }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              label="昵称"
              v-if="table_type !== 'me'"
              min-width="142"
              show-overflow-tooltip
              :filters="name_filter"
              :filter-method="filter_name"
            >
              <template #default="scope">
                <span class="report-player">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="出刀数" v-if="table_type !== 'detail'" min-width="90" align="right">
              <template #default="scope">
                <span>{{ scope.row.dao }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="目标"
              v-if="table_type !== 'all'"
              min-width="150"
              :filters="[
                { text: '1 王', value: 1 },
                { text: '2 王', value: 2 },
                { text: '3 王', value: 3 },
                { text: '4 王', value: 4 },
                { text: '5 王', value: 5 },
              ]"
              :filter-method="filter_boss"
            >
              <template #default="scope">
                <span class="report-target">{{ scope.row.lap }} 周目<span aria-hidden="true"> · </span>{{ scope.row.boss }} 王</span>
              </template>
            </el-table-column>
            <el-table-column
              label="伤害"
              :sortable="table_type === 'all'"
              prop="damage"
              align="right"
              min-width="158"
              show-overflow-tooltip
            >
              <template #header>
                <span class="report-unit-heading">
                  <span>伤害</span>
                  <span @click.stop><BattleUnitSelect /></span>
                </span>
              </template>
              <template #default="scope">
                <span class="report-damage" :title="battleNumberUnit === '基本' ? undefined : formatReportNumber(scope.row.damage)">{{ formatReportNumber(scope.row.damage, battleNumberUnit) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="分数"
              :sortable="table_type === 'all'"
              prop="score"
              align="right"
              min-width="142"
              show-overflow-tooltip
            >
              <template #default="scope">
                <span class="report-score" :title="battleNumberUnit === '基本' ? undefined : formatReportNumber(scope.row.score)">{{ formatReportNumber(scope.row.score, battleNumberUnit) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="伤害占比" v-if="table_type === 'all'" min-width="106" align="right">
              <template #default="scope">
                <span class="report-score">{{ scope.row.damage_rate }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分数占比" v-if="table_type === 'all'" min-width="106" align="right">
              <template #default="scope">
                <span class="report-score">{{ scope.row.score_rate }}</span>
              </template>
            </el-table-column>
            <el-table-column label="刀型" v-if="table_type !== 'all'" min-width="88" align="center">
              <template #default="scope">
                <el-tag class="report-knife-tag" :type="type_color(scope.row.type)" size="small" effect="light">{{
                  scope.row.type === "补偿" ? "补偿刀" : scope.row.type || "—"
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="编号" v-if="table_type !== 'all'" min-width="92" align="right">
              <template #default="scope">
                <span class="report-id">{{ scope.row.dao_id }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" v-if="show_edit" min-width="72" align="center">
              <template #default="scope">
                <el-button
                  type="primary"
                  :icon="Edit"
                  size="small"
                  circle
                  aria-label="修改刀型"
                  @click="correct_dao(scope.row.dao_id, scope.row.type)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-scrollbar>
    </el-main>
    <FootInfo></FootInfo>
  </el-container>
  <el-dialog v-model="dialog_visible" title="修改类型">
    <p>当前类型：{{ dao_type }}</p>
    <el-select v-model="dao_type">
      <el-option label="完整刀" value="完整刀" />
      <el-option label="补偿" value="补偿" />
      <el-option label="尾刀" value="尾刀" />
    </el-select>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirm(dao_type)"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.report-main {
  padding: 0;
  min-width: 0;
  background-color: #f4f7fb;
}
.report-scrollbar {
  padding: clamp(12px, 2vw, 26px);
  height: calc(100vh - 120px);
}
.report-panel {
  border-radius: 12px;
  border-color: #e1e7f0;
  :deep(.el-card__header) { padding: 20px 20px 10px; }
}
.report-title {
  margin: 0;
  color: #17243a;
  font-size: 22px;
  line-height: 1.4;
}
.report-tabs {
  margin-top: 10px;
  :deep(.el-tabs__header) { margin: 0 0 10px; }
  :deep(.el-tabs__content) { display: none; }
}
.report-meta {
  display: flex;
  gap: 12px 24px;
  flex-wrap: wrap;
  color: #56657c;
  font-size: 13px;
}
.report-table {
  width: 100%;
  --el-table-header-bg-color: #f6f8fc;
  --el-table-row-hover-bg-color: #f1f6fe;
  --el-table-border-color: #e7ecf3;
  --el-table-header-text-color: #435268;
  --el-table-text-color: #27354a;
  :deep(.el-table__cell) { padding: 9px 0; }
  :deep(.el-table__cell .cell) { padding: 0 16px; }
}
.report-timestamp {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
  white-space: nowrap;
}
.report-clock, .report-player, .report-damage { font-weight: 600; }
.report-date, .report-id, .report-score { color: #56657c; }
.report-date, .report-id { font-size: 12px; }
.report-timestamp, .report-damage, .report-score, .report-id {
  font-variant-numeric: tabular-nums;
}
.report-damage, .report-score, .report-target { white-space: nowrap; }
.report-unit-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.report-knife-tag { width: 58px; }
.report-target > span {
  color: #71829a;
  padding: 0 2px;
}
</style>
