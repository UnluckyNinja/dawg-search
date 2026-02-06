<script setup lang="ts">
import { RouterLink } from 'vue-router';

</script>

<template>
  <div class="flex justify-center divide-x-2 *:px-2 mb-8 text-xl">
    <div>
      <RouterLink to="/trie-viewer">Test Trie (DAFSA)</RouterLink>
    </div>
    <div>
      <RouterLink to="/suffix-viewer">Test Suffix</RouterLink>
    </div>
  </div>
  <div>
    <RouterView></RouterView>
  </div>
</template>

<style scoped></style>
