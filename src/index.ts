import { binarySearch } from './utils'

export * from './suffix'

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

export function nodeInsertOutEdge<T extends DGraphNode>(node: T, char: string, next: T){
  const idx = binarySearch(node.out, [char, undefined], compareNodeOut)
  if (node.out[idx]?.[0] === char) {
    throw new Error('Insert is called on existing value')
  }
  node.out.splice(idx, 0, [char, next])
}

/**
 * only works for single char link
 */
export function nodeReplaceOutEdge<T extends DGraphNode>(node: T, char: string, next: T){
  const idx = binarySearch(node.out, [char, undefined], compareNodeOut)
  if (node.out[idx]?.[0] !== char) {
    throw new Error('Replace is called on absent value')
  }
  node.out.splice(idx, 1, [char, next])
}

export function compareNodeOut(a: [string, unknown], b: [string, unknown]) {
  return a[0].localeCompare(b[0])
}