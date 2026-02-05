<script setup lang="ts">
import { provide, ref } from 'vue';
import VJsonNode from './Node.vue';
import { jsonViewerKey } from './injection';

const props = defineProps<{
  data: any;
  expandAll?: boolean;
}>();

// Track expanded nodes
const expandedNodes = ref<Set<string>>(new Set());

// Function to toggle a node's expanded state
function toggleNode(path: string) {
  if (expandedNodes.value.has(path)) {
    expandedNodes.value.delete(path);
  } else {
    expandedNodes.value.add(path);
  }
}

// Function to check if a node is expanded
function isExpanded(path: string): boolean {
  return expandedNodes.value.has(path);
}

// Provide these functions and state to child components
provide(jsonViewerKey, {
  withinJsonViewer: true,
  toggleNode,
  isExpanded,
  expandAll: props.expandAll || false
});
</script>

<template>
  <div class="json-viewer">
    <VJsonNode :value="data" :path="'root'" :property-name="undefined" />
  </div>
</template>

<style scoped>
.json-viewer {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
}
</style>