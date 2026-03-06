import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test, describe, expect } from 'vitest'
import { prepareSearch, refineMatches } from '../src/index'

describe('buildup trie automaton ', ()=>{
  const dict = readFileSync(fileURLToPath(new URL('./sample/words.txt', import.meta.url))).toString()
  const words = dict.split(/\r?\n/)
  test('large dict', ()=>{
    const { findWords } = prepareSearch(words)
    const text = 'アイクラ団軍スクラ黒渦団軍票クラ魚拓額縁G1クラ魚拓クラ'
    const result = refineMatches(findWords(text))
    expect(result.map(it=>text.slice(it.start, it.end))).toMatchInlineSnapshot(`
      [
        "イクラ",
        "黒渦団軍票",
        "魚拓額縁G1",
      ]
    `)
  })
  const sorted = words.slice().sort((a,b)=>a.localeCompare(b))
  test('sorted dict', ()=>{
    prepareSearch(sorted)
  })
})