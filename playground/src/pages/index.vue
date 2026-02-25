<script lang="ts" setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { TrieAutomaton, findWords, refineMatches } from 'dawg-search'

const searchTextInput = ref('山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？')
const wordsInput = ref('山\n陋之\n何陋之有\n有\n苔痕上阶\n苔痕上阶绿')

const words = computed(()=>{
  return wordsInput.value.split(/\r?\n/).map(it=>it.trim())
})

import JSONViewer from '../components/JSONViewer/Viewer.vue'

let trie = new TrieAutomaton(words.value)

const result = shallowRef<ReturnType<typeof findWords>>()

watch([searchTextInput, words], ([newText, newWords])=>{
  trie = new TrieAutomaton(newWords)

  result.value = refineMatches(findWords(newText, trie))
}, {immediate: true})

const matchedText = computed(()=>{
  if (!result.value) {
    return []
  }
  return result.value.map(it=>searchTextInput.value.slice(it.start, it.end))
})

</script>

<template>
  <div class="gap-2 flex flex-col w-80dvw max-w-200">
    <textarea class="w-full h-40 outline" v-model="searchTextInput" />
    <textarea class="w-full h-40 outline" v-model="wordsInput" />
    <JSONViewer class="text-left" :data="result"></JSONViewer>
    <JSONViewer class="text-left" :data="matchedText"></JSONViewer>
  </div>
</template>

<style scoped>

</style>