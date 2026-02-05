<script setup lang="ts">
import { computed, inject, onMounted } from 'vue';
import { jsonViewerKey } from './injection';

const props = defineProps<{
  value: any;
  path: string;
  propertyName?: string | number;
}>();

// Inject the context from the parent VJsonViewer
const jsonViewerProvider = inject(jsonViewerKey, {
  withinJsonViewer: false,
  toggleNode: () => {},
  isExpanded: () => false,
  expandAll: false
});

// Ensure that the component is used within VJsonViewer
if (!jsonViewerProvider.withinJsonViewer) {
  throw new Error('VJsonNode must be used within a VJsonViewer component');
}

// Helper to get the type of value
const valueType = computed(() => {
  if (Array.isArray(props.value)) return 'array';
  if (props.value === null) return 'null';
  return typeof props.value;
});

// Check if the value is expandable (object or array)
const isExpandable = computed(() => {
  return ['object', 'array'].includes(valueType.value) && props.value !== null;
});

// Check if the node is expanded
const isExpanded = computed(() => {
  return jsonViewerProvider.isExpanded(props.path) || jsonViewerProvider.expandAll;
});

// Format primitive values for display
const formattedValue = computed(() => {
  if (props.value === null) return 'null';
  if (props.value === undefined) return 'undefined';
  if (typeof props.value === 'string') return `"${props.value}"`;
  return String(props.value);
});

// For objects and arrays, get their entries for display
const entries = computed(() => {
  if (!isExpandable.value) return [];
  
  if (Array.isArray(props.value)) {
    return props.value.map((item, index) => ({
      propertyName: index,
      value: item,
      path: `${props.path}.${index}`
    }));
  } else {
    return Object.entries(props.value).map(([key, value]) => ({
      propertyName: key,
      value,
      path: `${props.path}.${key}`
    }));
  }
});

// Preview of collapsed objects/arrays
const preview = computed(() => {
  if (!isExpandable.value) return '';
  
  if (Array.isArray(props.value)) {
    return `Array(${props.value.length})`;
  } else {
    const keys = Object.keys(props.value);
    return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
  }
});

// Toggle node expansion
function toggleExpansion() {
  if (isExpandable.value) {
    jsonViewerProvider.toggleNode(props.path);
  }
}

// Auto-expand if expandAll is true
onMounted(() => {
  if (jsonViewerProvider.expandAll && isExpandable.value) {
    jsonViewerProvider.toggleNode(props.path);
  }
});
</script>

<template>
  <div class="json-node" :class="{ 'json-node-expanded': isExpanded }">
    <!-- Display property name if it exists -->
    <span v-if="propertyName !== undefined" class="json-key">{{ propertyName }}:</span>
    
    <!-- Handle expandable nodes (objects and arrays) -->
    <template v-if="isExpandable">
      <span class="json-toggle" @click="toggleExpansion">
        {{ isExpanded ? '▼' : '►' }}
      </span>
      
      <span class="json-preview" @click="toggleExpansion">
        {{ valueType === 'array' ? '[' : '{' }}
        <span v-if="!isExpanded">{{ preview }}</span>
      </span>
      
      <!-- Expanded view of objects and arrays -->
      <div v-if="isExpanded" class="json-children">
        <div v-for="entry in entries" :key="entry.path" class="json-child">
          <!-- Recursively render child nodes -->
          <Node 
            :value="entry.value" 
            :path="entry.path" 
            :property-name="entry.propertyName" 
          />
        </div>
      </div>
      
      <span class="json-bracket">{{ valueType === 'array' ? ']' : '}' }}</span>
    </template>
    
    <!-- Handle primitive values -->
    <span v-else class="json-value" :class="`json-${valueType}`">
      {{ formattedValue }}
    </span>
  </div>
</template>

<style scoped>
.json-node {
  line-height: 1.5;
  position: relative;
}

.json-key {
  color: #881391;
  margin-right: 0.5rem;
}

.json-toggle {
  cursor: pointer;
  font-size: 0.8rem;
  margin-right: 0.25rem;
  user-select: none;
}

.json-preview {
  cursor: pointer;
  color: #666;
}

.json-children {
  padding-left: 1.5rem;
  border-left: 1px dotted #ccc;
  margin-left: 0.25rem;
}

.json-value {
  white-space: pre-wrap;
}

.json-string {
  color: #c41a16;
}

.json-number {
  color: #1a1aa6;
}

.json-boolean {
  color: #0b6125;
}

.json-null {
  color: #808080;
}

.json-undefined {
  color: #808080;
}

.json-bracket {
  color: #666;
}
</style>