<template>
  <div id="dash">
    <SideBar />
    <div><router-view /></div>
  </div>
</template>
<script setup>
import SideBar from '@/components/SideBar.vue'
</script>
<style>
#dash {
  display: flex;
  flex-direction: row;
  flex: auto;
}
#dash > div {
  display: flex;
  flex: 50;
}
</style>
