import { expect, test } from 'vitest'
import { SuffixAutomaton, SuffixNode, nodeGetNext, prepareSearch, refineMatches } from '../src'

test('suffix automaton', ()=>{
  const sam = new SuffixAutomaton('abcbc')
  expect(nodeGetNext(sam.root, 'a')).toBeTruthy()
  const finals = sam.getFinals()
  const suffixes: string[] = []
  const queue: [SuffixNode, string][] = [[sam.root, '']]
  while (queue.length > 0) {
    const [node, str] = queue.pop()!
    if (finals.has(node.id)) {
      // console.log(node)
      suffixes.push(str)
    }
    for (const [char, nextNode] of node.out) {
      queue.push([nextNode, str+char])
    }
  }
  expect(finals).toMatchInlineSnapshot(`
    Set {
      6,
      7,
    }
  `)
  expect(suffixes).toMatchInlineSnapshot(`
    [
      "c",
      "cbc",
      "bc",
      "bcbc",
      "abcbc",
    ]
  `)
})

test('demo usage', ()=>{
  const text = '山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？'
  const words = ['山', '陋之', '何陋之有', '有', '苔痕上阶', '苔痕上阶绿']
  const { findWords } = prepareSearch(words)
  const result = refineMatches(findWords(text))
  expect(result.map(it=>text.slice(it.start, it.end))).toMatchInlineSnapshot(`
    [
      "山",
      "有",
      "有",
      "苔痕上阶绿",
      "有",
      "何陋之有",
    ]
  `)
})