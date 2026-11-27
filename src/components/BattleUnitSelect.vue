<script setup lang="ts">
import { battleNumberUnit } from "@/globals/battle-unit-preference";
import { battleUnits } from "@/globals/report-format";
</script>

<template>
  <el-select v-model="battleNumberUnit" class="battle-unit" size="small" aria-label="会战数值单位">
    <el-option v-for="unit in battleUnits" :key="unit" :label="unit" :value="unit" />
  </el-select>
</template>

<style scoped>
.battle-unit {
  width: 90px;
}
</style>
