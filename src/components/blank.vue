<template>
  <div>BLANK</div>
  <DatePicker v-model="date" mode="single" />
  <DatePicker v-model="rangeDate" mode="range" :showThisWeek="true" :showThisMonth="true" />
</template>
<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import DatePicker from './DatePicker.vue'
const $filters = inject('$filters')
const date = ref()
const rangeDate = ref([])
watch(
  () => date.value,
  () => {
    console.log($filters.formatDateTime(date.value, 'YYYY-MM-DD'))
  },
  { immediate: true },
)
watch(
  () => rangeDate.value,
  () => {
    console.log(
      $filters.formatDateTime(rangeDate.value[0], 'YYYY-MM-DD') +
        ' to ' +
        $filters.formatDateTime(rangeDate.value[1], 'YYYY-MM-DD'),
    ) // 每当 rangeDate.value 发生变化时，都会执行这个函数
  },
  { immediate: true },
)
</script>

<style scoped>
div {
  width: 100%;
  color: red;
  font-size: 20px;
  text-align: center;
  line-height: 1.5;
  margin: 50px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f5f5f5;
  box-shadow: 0 0 5px #ccc;
  transition: all 0.3s ease;
}
</style>
