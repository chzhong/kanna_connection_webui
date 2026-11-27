<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios, { AxiosError, type AxiosResponse } from "axios";
import FootInfo from "@/components/FootInfo.vue";
import SideMenu from "@/components/SideMenu.vue";
import BossPanel from "@/components/BossPanel.vue";
import BattleUnitSelect from "@/components/BattleUnitSelect.vue";
import NoticeDialog from "@/components/NoticeDialog.vue";
import DailyNotice from "@/components/DailyNotice.vue";
import HeaderMenu from "@/components/HeaderMenu.vue";
import type { DashboardInfo } from "@/globals/apimodels";
import { show_notice } from "@/globals/until";
import { get_dashboard_api, get_dashboard_renew_api } from "@/globals/api";
import { battleNumberUnit } from "@/globals/battle-unit-preference";
import { formatReportNumber } from "@/globals/report-format";

var data = ref<DashboardInfo>({
  user_id: "1791800364",
  name: "桥本环奈",
  priority: 0,
  clan_name: "环奈连结",
  stage: "暂无信息",
  dao: 0,
  day_num: 0,
  yesterday_dao: 0,
  rank: 114514,
  state: "关闭",
  boss: [],
  report: [],
});

const monitorName = computed(() => {
  const qq = String(data.value.name ?? "");
  return data.value.monitor_name?.trim() || (/^[1-9]\d*$/.test(qq) ? qq : "—");
});

const route = useRoute();
const router = useRouter();
const group_id = route.params.group_id as string;
const notice_type = ref(0);
const dialog_visible = ref(false);
const cancel = ref(false);
const notice_option = [
  { type: 0, label1: "预约BOSS", label2: "取消预约 ", color: "primary" },
  { type: 1, label1: "  失误挂树 ", label2: " 取消挂树", color: "danger" },
  { type: 2, label1: "申请BOSS", label2: "取消申请 ", color: "success" },
  { type: 5, label1: "    记录SL  ", label2: "  取消SL  ", color: "warning" },
];
function notice(type: number, _cancel: boolean = false) {
  cancel.value = _cancel;
  dialog_visible.value = true;
  notice_type.value = type;
}
axios
  .get(get_dashboard_api(group_id), { withCredentials: true })
  .then((response: AxiosResponse<DashboardInfo>) => {
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
const eventSource = ref<EventSource>(
  new EventSource(get_dashboard_renew_api(group_id), {
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
      <SideMenu :qq_id="data.user_id" :group_id="group_id"> </SideMenu>
    </el-aside>
    <el-main class="dash-broad-main">
      <HeaderMenu :priority="data.priority"></HeaderMenu>
      <el-scrollbar class="info-scrollbar">
        <el-container>
          <el-main>
            <div class="boss-unit-toolbar"><span>血量单位</span><BattleUnitSelect /></div>
            <BossPanel
              banner-color="yellow"
              :img-url="`https://redive.estertion.win/icon/unit/${current_boss.id}.webp`"
              :subscribe="current_boss.subscribe"
              :fighter="current_boss.fighter"
              :tree="current_boss.tree"
              :apply="current_boss.apply"
              :percentage="
                current_boss.max_hp
                  ? (current_boss.current_hp / current_boss.max_hp) * 100
                  : 100
              "
              v-for="current_boss in data.boss"
              :key="current_boss.id"
            >
              <template #title> {{ current_boss.name }} </template>
              <template #subtitle v-if="current_boss.max_hp">
                <span class="boss-hp-values" aria-label="当前血量 / 最大血量" :title="`${formatReportNumber(current_boss.current_hp)} / ${formatReportNumber(current_boss.max_hp)}`">
                  <span class="boss-hp-current">{{ formatReportNumber(current_boss.current_hp, battleNumberUnit) }}</span>
                  <span class="boss-hp-divider">/</span>
                  <span class="boss-hp-max">{{ formatReportNumber(current_boss.max_hp, battleNumberUnit) }}</span>
                </span>
              </template>
              <template #subtitle v-else> 血量未知 </template>
              <template #banner> {{ current_boss.lap }}周目 </template>
            </BossPanel>
          </el-main>
          <el-aside class="dash-broad-side">
            <el-card class="clanbattle-info">
              <div class="card-header">{{ data.clan_name }}</div>
              <div class="lap-progress">
                <el-progress
                  type="dashboard"
                  :percentage="data.dao ? (data.dao / 90) * 100 : 100"
                  :width="170"
                  :stroke-width="13"
                >
                  <span class="percentage-label">今日出刀</span>
                  <span class="percentage-value">{{ data.dao }} / 90</span>
                </el-progress>
              </div>
              <dl class="monitor-status">
                <dt>监控状态</dt><dd>{{ data.state }}</dd>
                <dt>监控人</dt><dd>{{ monitorName }}</dd>
                <dt>当前排名</dt><dd>{{ data.rank }}</dd>
                <dt>当前进度</dt><dd>{{ data.stage }}</dd>
              </dl>
              <el-divider />
              <div v-for="notice_data in notice_option" :key="notice_data.type">
                <el-row>
                  <el-col :span="24">
                    <el-button-group>
                      <el-button
                        :type="notice_data.color"
                        @click="notice(notice_data.type)"
                        style="width: 96px"
                        >{{ notice_data.label1 }}</el-button
                      >
                      <el-button
                        :type="notice_data.color"
                        @click="notice(notice_data.type, true)"
                        style="width: 96px"
                        >{{ notice_data.label2 }}</el-button
                      >
                    </el-button-group>
                  </el-col>
                </el-row>
                <el-divider />
              </div>
            </el-card>
          </el-aside>
        </el-container>
        <DailyNotice :data="data"></DailyNotice>
      </el-scrollbar>
    </el-main>
    <NoticeDialog
      v-model:dialog-visible="dialog_visible"
      :type="notice_type"
      :group="group_id"
      :cancel="cancel"
    ></NoticeDialog>
    <FootInfo></FootInfo>
  </el-container>
</template>

<style lang="scss" scoped>
.dash-broad-main {
  padding: 0;
  background-color: #80808013;
  .clanbattle-info {
    width: 300px;
    text-align: center;
    min-height: 695px;
    .card-header {
      background-image: url("../assets/img/banner.png");
      background-position: center;
      background-repeat: no-repeat;
      color: white;
      height: 50px;
    }
    .lap-progress {
      .percentage-value {
        display: block;
        margin-top: 10px;
        font-size: 30px;
      }
      .percentage-label {
        font-family: sans-serif;
        display: block;
        margin-top: 10px;
        font-size: 20px;
      }
    }
  }
}
.boss-unit-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #56657c;
  font-size: 13px;
}
.boss-hp-values {
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 6px;
  width: min(100%, 24rem);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.boss-hp-current { text-align: right; }
.boss-hp-divider { color: #71829a; }
.boss-hp-max { text-align: left; }
.monitor-status {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px 1.1rem;
  width: min(100%, 210px);
  margin: 12px auto 0;
  font-size: 14px;
  dt {
    position: relative;
    text-align: right;
    &::after { position: absolute; left: 100%; content: "："; }
  }
  dd {
    margin: 0;
    text-align: left;
    overflow-wrap: anywhere;
  }
}
.info-scrollbar {
  height: calc(100vh - 73.33px);
}
.dash-broad-side {
  padding: 20px;
  width: 350px;
  justify-content: center;
}
</style>
