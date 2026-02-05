import { binarySearch } from './utils'

export * from './suffix'
export * from './trie'

export interface DGraphNode {
  id: number
  out: [string, this][]
}

export function nodeGetNext<T extends DGraphNode>(node: T, char: string) {
  const idx = binarySearch(node.out, [char, undefined], compareNodeOut)
  if (node.out[idx]?.[0] === char) {
    return node.out[idx][1]
  } else {
    return undefined
  }
}

/**
 * only works for single char link
 * @param next if undefined, delete edge
 */
export function nodeSetOutEdge<T extends DGraphNode>(node: T, char: string, next?: T){
  const idx = binarySearch(node.out, [char, undefined], compareNodeOut)
  let replace = false
  if (node.out[idx]?.[0] === char) {
    replace = true
  }

  if (replace) {
    if (!next) {
      node.out.splice(idx, 1)
    } else {
      node.out.splice(idx, 1, [char, next])
    }
  } else {
    if (!next) {
      return
    } else {
      node.out.splice(idx, 0, [char, next])
    }
  }
}

export function compareNodeOut(a: [string, unknown], b: [string, unknown]) {
  return a[0].localeCompare(b[0])
}