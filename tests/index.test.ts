import { expect, test } from 'vitest'
import { SuffixAutomaton, nodeGetNext, walkSAM } from '../src'

test('suffix automaton', ()=>{
  const sam = new SuffixAutomaton('abcbc')
  expect(nodeGetNext(sam.root, 'a')).toBeTruthy()
  const finals = sam.getFinals()
  const suffixes: string[] = []
  walkSAM((node, str, queue)=>{
    if (finals.has(node.id)) {
      // console.log(node)
      suffixes.push(str)
    }
    for (const [char, nextNode] of node.out) {
      queue.push([nextNode, str+char])
    }
    return queue
  }, [sam.root, ''])
  expect(finals).toMatchInlineSnapshot(`
    Set {
      6,
      7,
    }
  `)
  expect(suffixes).toMatchInlineSnapshot(`
    [
      "c",
      "bc",
      "cbc",
      "bcbc",
      "abcbc",
    ]
  `)
})