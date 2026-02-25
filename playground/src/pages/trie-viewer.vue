<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import { TrieAutomaton, type TrieNode } from 'dawg-search'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'

import JSONViewer from '../components/JSONViewer/Viewer.vue'
import GraphViewer from '../components/GraphViewer.vue'

const input = ref(`\
back
deck\
`)

const words = computed(() => {
  return input.value.split(/\r?\n/)
})

interface Node {
  index: number
  x: number
  y: number
  data: TrieNode
}
interface Edge {
  source: Node
  target: Node
  char: string
  distance: number
}
const trie = new TrieAutomaton()
const nodes = ref<Node[]>([])
const edges = ref<any>([])
const simulation = forceSimulation()
watch(words, (words) => {
  trie.refill(words)
  nodes.value = trie.states.map(it=>{
    return {
      index: it.id,
      x: it.id*10,
      y: 0,
      data: markRaw(it),
    }
  })

  edges.value = trie.states.flatMap(it=>{
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
    .force('charge', forceManyBody().strength(-200))
    .force('link', forceLink<Node, Edge>(edges.value).id(d=>d.index))
    .alpha(1);
}, {immediate: true})

</script>

<template>
  <div class="gap-2 flex flex-col">
    <GraphViewer :nodes="nodes" :edges="edges" />
    <div>
      <textarea class="w-40 h-20 outline" v-model="input" />
    </div>
    <div>
      <div class="text-left">
        Nodes:
        <JSONViewer :data="nodes.map(it=>it.data)"></JSONViewer>
      </div>
      <div class="text-left">
        Edges:
        <JSONViewer :data="edges"></JSONViewer>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
