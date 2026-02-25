<script lang="ts" setup>
const props = defineProps<{
  edges: {
    source: { x: number, y: number},
    target: { x: number, y: number},
    char: string,
  }[],
  nodes: {
    index: number,
    x: number,
    y: number,
    data:{
      final: boolean
    },
  }[]
}>()
</script>

<template>
  
    <div>
      <svg viewBox="-100 -100 400 400" class="w-100 h-100 bg-gray-200">
        <defs>
          <!-- A marker to be used as an arrowhead -->
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="25"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="black"/>
          </marker>
        </defs>
        <g>
          <line v-for="edge, i in edges" :key="i"
            :x1="edge.source.x"
            :y1="edge.source.y"
            :x2="edge.target.x"
            :y2="edge.target.y"
            stroke="black"
            marker-end="url(#arrow)"
            />
        </g>
        <g v-for="node in nodes" :key="node.index" :transform="`translate(${node.x}, ${node.y})`">
          <circle r="10" stroke="black" :fill="node.index === 0 ? 'lightgreen' : node.data.final ? 'violet' :'#FEFEFE'" />
          <text text-anchor="middle" dominant-baseline="central" font-size="10">{{ node.index }}</text>
        </g>
        <g>
          <text v-for="edge, i in edges" :key="i"
            :x="(edge.source.x+edge.target.x)/2"
            :y="(edge.source.y+edge.target.y)/2"
            font-size="12"
            text-anchor="middle"
            fill="#A50432"
            dy="-2"
            >{{ edge.char }}</text>
        </g>
      </svg>
    </div>
</template>

<style scoped>

</style>