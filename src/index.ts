import { SuffixAutomaton } from './suffix'
import { TrieAutomaton, type TrieNode } from './trie'
import { nodeGetNext } from './utils'

export * from './suffix'
export * from './trie'
export * from './utils'

interface Result {
  start: number,
  end: number
}

export function prepareSearch(words: string[]) {
  const trie = new TrieAutomaton(words)
  function _findWords(text: string){
    return findWords(text, trie)
  }
  return {
    findWords: _findWords,
  }
}

export function findWords(text: string, trie: TrieAutomaton) {
  const sam = new SuffixAutomaton(text)
  const finals = sam.getFinals()
  const result: Result[] = []

  const queue = [{
    matchedLength: 0,
    matchingLength: 0,
    final: false,
    samNode: sam.root,
    trieNode: trie.root as TrieNode | null,
  }]

  function pushToQueue(oldState: typeof queue[number], options: Record<string, any> = {}) {
    const {
      matched = false,
      matching = true,
      final = false,
      nextSAM = null,
      nextTrie = null
    } = options
    queue.push({
      // update **matched** with **matching** length on condition
      matchedLength: matched ? oldState.matchingLength + 1 : oldState.matchedLength,
      matchingLength: matching ? oldState.matchingLength + 1 : oldState.matchingLength,
      final: final,
      samNode: nextSAM,
      trieNode: nextTrie,
    })
  }

  // traverse suffix automaton and match chars with trie automaton to find matches.
  outter:
  while (queue.length > 0) {
    const state = queue.pop()!
    if (finals.has(state.samNode.id)) {
      if (state.matchedLength > 0) {
        result.push({
          start: text.length - state.matchingLength,
          end: text.length - state.matchingLength + state.matchedLength,
        })
      }
    }
    // if no need to check next (already mismatched), just propagate
    if (!state.trieNode) {
      for (const [_, nextSAM] of state.samNode.out) {
        pushToQueue(state, {
          nextSAM,
        })
      }
      continue outter
    }

    // else check
    for (const [char, nextSAM] of state.samNode.out) {
      const nextTrie = nodeGetNext(state.trieNode, char)
      if (!nextTrie) { // mismatch
        if (state.matchedLength === 0) {
          continue // no matched word and mismatched, just drop
        }
        pushToQueue(state, {
          nextTrie: null,
          nextSAM,
        })
        continue
      }
      if (nextTrie.final) {
        pushToQueue(state, {
          matched: true,
          nextTrie,
          nextSAM,
        })
      } else {
        pushToQueue(state, {
          nextTrie,
          nextSAM,
        })
      }
    }
  }

  return result
}

export function refineMatches(result: Result[], inPlace = true){
  let outputArray = result
  if (!inPlace) {
    outputArray = result.slice()
  }
  if (outputArray.length <= 1) {
    return outputArray
  }
  outputArray.sort((a,b)=>{
    // sort array in reverse order to easily remove on iteration
    // in reverse view: start in asc order, then end in desc order
    if (a.start !== b.start) {
      return b.start - a.start
    }
    return a.end - b.end
  })
  for (let i = outputArray.length-1; i >= 1; --i) {
    const cur = outputArray[i]
    const next = outputArray[i-1]
    if (next.start < cur.end) {
      outputArray.splice(i-1, 1)
    }
  }
  return outputArray.reverse()
}