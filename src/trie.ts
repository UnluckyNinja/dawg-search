import { nodeGetNext, nodeInsertOutEdge, nodeReplaceOutEdge, type DGraphNode } from '.'

export interface TrieNode extends DGraphNode {
  id: number
  final: boolean
  inDegree: number
  out: [string, this][]
}

export class TrieAutomaton {

  private _root!: TrieNode
  get root(){
    return this._root
  }
  private _states: (TrieNode | null)[] = []
  get states(): Readonly<typeof this._states>{
    return this._states
  }
  public addWord(word: string) {

  }
  public removeWord(word: string) {

  }
  public getNode(prefix: string) {

  }
}

/**
 * Nodes are compared by the following precedence:
 * - not final node <-> is final node
 * - less out edges <-> more out edges
 * - for each edge, its character order, or the connected node order
 * - if all above are equal, the two nodes are considered equal. (so they can be merged)
 */
function compareNode(a: TrieNode, b: TrieNode) {
  if (a.final !== b.final) {
    if (b.final) {
      return -1
    } else {
      return 1
    }
  }
  let outDiff = a.out.length - b.out.length
  if (outDiff !== 0) {
    return outDiff
  }

  for (let i = 0; i < a.out.length; ++i) {
    const charA = a.out[i][0]
    const charB = b.out[i][0]
    const kDiff = charA.localeCompare(charB)
    if (kDiff !== 0) {
      return kDiff
    }

    const nodeA = nodeGetNext(a, charA)!
    const nodeB = nodeGetNext(a, charA)!

    if (nodeA !== nodeB) {
      return nodeA.id - nodeB.id
    }
  }
  return 0
}