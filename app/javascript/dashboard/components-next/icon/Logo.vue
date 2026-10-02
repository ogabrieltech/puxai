<script setup>
import { useAttrs } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const attrs = useAttrs();
const globalConfig = useMapGetter('globalConfig/get');
</script>

<template>
  <img
    v-if="globalConfig.logoThumbnail"
    v-bind="attrs"
    :src="globalConfig.logoThumbnail"
  />
  <svg
    v-else
    v-once
    v-bind="attrs"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="16" height="16" rx="4.5" fill="#7C3AED" />
    <path
      d="M4.5 4.125H8.71875C11.0312 4.125 12.3438 5.4375 12.3438 7.3125C12.3438 9.1875 11.0312 10.5 8.71875 10.5H6.84375V12.25H4.5V4.125ZM6.84375 6.15625V8.46875H8.59375C9.53125 8.46875 10.0625 8.09375 10.0625 7.3125C10.0625 6.53125 9.53125 6.15625 8.59375 6.15625H6.84375Z"
      fill="white"
    />
    <circle cx="12.6" cy="3.4" r="1.15" fill="#A78BFA" />
  </svg>
</template>
