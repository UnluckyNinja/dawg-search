<script lang="ts" setup>
import { computed, markRaw, ref, shallowRef, watch, type Ref } from 'vue'
import { SuffixAutomaton, type SuffixNode } from 'dawg-search'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'

import JSONViewer from '../components/JSONViewer/Viewer.vue'

const input = ref(`ababcd`)

const suffix = shallowRef(new SuffixAutomaton(input.value))
const nodes = ref<any>([])
const edges = ref<any>([])
const simulation = forceSimulation()
watch(input, (newInput) => {
  suffix.value = new SuffixAutomaton(newInput)
  nodes.value = suffix.value.states.map(it=>{
    return {
      index: it.id,
      x: it.id*10,
      y: 0,
      data: markRaw(it),
    }
  })

  edges.value = suffix.value.states.flatMap(it=>{
    return it.out.map(transition=>{
      const source = it.id
      const target = transition[1].id
      return {
        source,
        target,
        char: transition[0],
        depth: (target-source)*10,
      }
    })
  }).sort((a,b)=>{
    if (a.source !== b.source) {
      return a.source - b.source
    }
    if (a.target !== b.target) {
      return a.target - b.target
    }
    if (a.char !== b.char) {
      return a.char.localeCompare(b.char)
    }
    throw new Error(`Identical transition from ${a.source} to ${a.target} with ${a.char}`)
  }).reduce((lastValue, currentItem, i)=>{
    if (lastValue.length === 0) {
      lastValue.push(currentItem)
      return lastValue
    }
    const last = lastValue[lastValue.length - 1]
    if (
      last.source !== currentItem.source
      || last.target !== currentItem.target
    ) {
      lastValue.push(currentItem)
      return lastValue
    }
    console.log('==== '+ i + ' ====')
    console.log(JSON.stringify(lastValue, null, 2))
    console.log(JSON.stringify(currentItem, null, 2))
    // edges with the same start and end but different char
    last.char += ',' + currentItem.char
    return lastValue
  }, [] as any)
  simulation.restart().nodes(nodes.value)
    .force('collide', forceCollide().radius(11))
    .force("center", forceCenter(200 / 2, 200 / 2))
    .force('charge', forceManyBody().strength(-100))
    .force('link', forceLink(edges.value))
    .alpha(1);
}, {immediate: true})
</script>

<template>
  <div class="gap-2 flex flex-col">
    <div>
      Debug only, for better visualization, check 
      <a class="text-blue underline" href="https://kg86.github.io/visds/dist/vis_dawg.html">this website</a>
    </div>
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
    <div>
      <textarea class="w-40 h-20 outline" v-model="input" />
    </div>
    <div>
      <div class="text-left">
        Nodes:
        <JSONViewer :data="nodes.map((it:any)=>it.data)"></JSONViewer>
      </div>
      <div class="text-left">
        Edges:
        <JSONViewer :data="edges"></JSONViewer>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>