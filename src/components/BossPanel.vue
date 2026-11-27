<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  imgUrl: {
    type: String,
  },
  fighter: {
    type: Number,
  },
  subscribe: {
    type: Number,
  },
  apply: {
    type: Number,
  },
  tree: {
    type: Number,
  },
  percentage: {
    type: Number,
  },
  isCurrentLap: Boolean,
});
function boss_percentage(percentage: any): string {
  if (!percentage) {
    return "无法挑战";
  }
  if (percentage < 0.01) {
    return "血皮";
  }
  return percentage.toFixed(2) + "%";
}

const dynamic_tags = computed(() => [
  {
    name: "挑战",
    type: "warning",
    value: props.fighter ?? 0,
  },
  {
    name: "预约",
    type: "primary",
    value: props.subscribe ?? 0,
  },
  {
    name: "申请",
    type: "success",
    value: props.apply ?? 0,
  },
  {
    name: "挂树",
    type: "danger",
    value: props.tree ?? 0,
  },
] as const);
</script>

<template>
  <el-card class="boss-card">
    <div class="boss-info">
      <div class="boss-content">
        <div class="boss-summary">
          <div class="boss-detail">
            <div class="boss-heading">
              <span class="boss-name"><slot name="title"></slot></span>
              <span
                class="stage-letter"
                :class="{ 'stage-letter--current': isCurrentLap }"
                :title="isCurrentLap ? '公会当前周目' : undefined"
              >
                <slot name="banner"></slot>
              </span>
            </div>
            <div class="boss-notices">
              <el-badge
                v-for="tag in dynamic_tags"
                :key="tag.type"
                :value="tag.value || ''"
                :hidden="tag.value === 0"
                :type="tag.type"
              >
                <el-tag :type="tag.type === 'primary' ? '' : tag.type" size="small" round>
                  {{ tag.name }}
                </el-tag>
              </el-badge>
            </div>
          </div>
          <div class="boss-hp"><slot name="subtitle"></slot></div>
        </div>
        <el-progress
          :percentage="percentage"
          :show-text="true"
          :format="boss_percentage"
          :text-inside="true"
          :stroke-width="15"
          status="exception"
          class="boss-hp-percentage"
        >
        </el-progress>
      </div>
      <div class="boss-avatar">
        <el-image class="boss-img" :src="props.imgUrl" alt="avatar" />
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.boss-card {
  min-height: 130px;
  margin-bottom: 11px;
  .boss-info {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(56px, 18%, 100px);
    align-items: center;
    gap: 1rem;
    margin: -8px;
    .boss-summary,
    .boss-heading,
    .boss-notices {
      display: flex;
      flex-wrap: wrap;
    }
    .boss-summary {
      align-items: center;
      gap: 10px 16px;
    }
    .boss-detail {
      flex: 0 1 208px;
      min-width: 0;
      text-align: left;
    }
    .boss-heading {
      align-items: center;
      gap: 4px 8px;
    }
    .boss-notices {
      justify-content: flex-start;
      gap: 8px 14px;
      margin-top: 0.5rem;
    }
    .boss-name {
      font-size: 1.125rem;
    }
    .boss-hp {
      flex: 1 1 238px;
      min-width: 0;
      text-align: center;
      font-size: 1rem;
      font-weight: bold;
    }
    .boss-hp-percentage {
      margin-top: 0.75rem;
    }
    .stage-letter {
      padding: 0.25rem;
      border-radius: 0.375rem;
      background-color: blue;
      color: #fff;
      font-size: 0.7rem;
      &--current {
        background-color: #c92b32;
      }
    }
    .boss-avatar {
      display: flex;
      justify-content: center;
      .boss-img {
        border-width: 1px;
        border-style: solid;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border-color: #fff;
        border-radius: 0.375rem;
        width: 100%;
        aspect-ratio: 1;
      }
    }
  }
}
</style>
