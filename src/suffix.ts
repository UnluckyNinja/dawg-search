import { nodeGetNext, nodeInsertOutEdge, nodeReplaceOutEdge, type DGraphNode } from '.'

export interface SuffixNode extends DGraphNode {
  id: number
  len: number
  link: this | null
  out: [string, this][]
}

/**
 * Reference: https://oi-wiki.org/string/sam/
 */
export class SuffixAutomaton {
  private _root: SuffixNode
  get root(){
    return this._root
  }
  private _last: SuffixNode
  get last(){
    return this._last
  }
  private states: SuffixNode[] = []
  constructor(text: string) {
    this._root = this.addNode()
    this._last = this._root
    for (const char of text) {
      this.extend(char)
    }
  }
  private addNode(): SuffixNode{
    const node = {
      id: this.states.length,
      len: 0,
      link: null,
      out: []
    }
    this.states.push(node)
    return node
  }
  private cloneNode(node: SuffixNode): SuffixNode {
    const clone = this.addNode()
    clone.len = node.len
    clone.link = node.link
    clone.out = [...node.out]
    return clone
  }
  extend(char: string) {
    const cur = this.addNode()
    cur.len = this._last.len + 1
    let p: SuffixNode | null = this._last
    while (p && (nodeGetNext(p, char) === undefined)) {
      nodeInsertOutEdge(p, char, cur)
      p = p.link
    }
    if (!p) {
      cur.link = this._root
    } else {
      let q = nodeGetNext(p, char)
      if (q === undefined) throw new Error(`p:${p.id}->${char} is undefined}`)
      if (p.len + 1 === q.len) {
        cur.link = q
      } else {
        const clone = this.cloneNode(q)
        clone.len = p.len + 1
        while(p && nodeGetNext(p, char) === q) {
          nodeReplaceOutEdge(p, char, clone)
          p = p.link
        }
        q.link = (cur.link = clone)
      }
    }
    this._last = cur
  }

  getFinals() {
    const map = new Map<number, boolean>()
    let node = this._last
    while (node.link) {
      map.set(node.id, true)
      node = node.link
    }
    return map
  }
}



export function walkSAM<V>(func: (node: SuffixNode, value: V, queue: [SuffixNode, V][])=>[SuffixNode, V][], initialValue: [SuffixNode, V]) {
  let queue: [SuffixNode, V][] = [initialValue]
  while (queue.length > 0) {
    const [node, value] = queue.shift()!
    queue = func(node, value, queue)
  }
}
