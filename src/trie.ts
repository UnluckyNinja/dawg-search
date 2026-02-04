import { nodeGetNext, nodeSetOutEdge, type DGraphNode } from '.'
import SplayTree from 'splaytree'

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
  private _states: TrieNode[] = []
  get states(): Readonly<typeof this._states>{
    return this._states
  }
  private nodePool: TrieNode[] = []
  private register!: SplayTree<TrieNode>

  constructor(words?: string[]){
    this.refill(words ?? [])
  }

  private init() {
    this._states.length = 0
    this.nodePool.length = 0
    this._root = this.addNode()
    this.register = new SplayTree<TrieNode>(compareNode)
  }

  refill(words: string[]) {
    this.init()
    for (let i = 0; i < words.length; ++i ) {
      this.addWord(words[i])
    }
  }

  /**
   * MARK: Internal funcs
   */

  private addNode(): TrieNode {
    let node: TrieNode
    if (this.nodePool.length > 0){
      node = this.nodePool.pop()!
      node.id = this._states.length
      node.final = false
      node.inDegree = 0
      node.out = []
      this._states.push(node)
    } else {
      node = {
        id: this._states.length,
        final: false,
        inDegree: 0,
        out: []
      }
      this._states.push(node)
    }
    return node
  }

  private cloneNode(node: TrieNode): TrieNode {
    const clone = this.addNode()
    clone.final = node.final
    clone.inDegree = 0
    clone.out = node.out.map(it=>it.slice() as typeof it )
    for (let i = 0; i < clone.out.length; ++i) {
      ++clone.out[i][1].inDegree
    }
    return clone
  }

  private removeFromRegister(node: TrieNode){
    this.register.remove(node)
  }

  /**
   * Will register child
   */
  private replaceOrRegister(state: TrieNode, char: string) {
    const child = nodeGetNext(state, char)
    if (!child) throw new Error(`State doesn't have a transition of "${char}"`);
    if (child.inDegree > 1) throw new Error(`There are more than one transition to the child by "${char}"`);
    
    const node = this.register.find(child)
    if (node) {
      const found = node.key
      nodeSetOutEdge(state, char, found)
      this.deleteNode(child, false)
      return found
    } else {
      this.register.add(child)
      return child
    }
  }

  /**
   * @returns false if the parameter is not presented in states, true otherwise.
   */
  private deleteNode(node: TrieNode, alsoRegister: boolean): boolean {
    // if (node.inDegree > 0) {
    //   throw new Error('To delete node, you should remove all transitions to this node first')
    // }
    const id = node.id
    if (!this._states[id] || this._states[id] !== node) return false

    // remove all transitions
    cutout(node)

    // remove from register
    if (alsoRegister) {
      this.removeFromRegister(node)
    }

    // put the node in pool
    this.nodePool.push(node)
    // swap current position node and last node
    const lastID = this.states.length - 1
    this._states[id] = this._states[lastID]
    this._states[id].id = id
    this._states.length = lastID
    return true
  }

  /**
   * Giving a word, from root node follow transition of each character:
   * - if there is a transition to a child node
   *   - if child and all parent nodes have only one in-edge
   *     - push it to an array and remove it from merge-able list, if it's in.
   *       (to avoid a chain of transitions megring with itself,
   *       where there might be a shorter word happening to be the prefix of it
   *       and ends with the same char)
   *   - if child node or any parent have more than one in-edge
   *     - clone child node (excluding all in-edges), separate current transition from old one
   *       and reroute to cloned node.
   * - if there isn't one transtion of that character
   *   - if it's removing, break and do nothing
   *   - if adding, create new node
   * After done:
   * - if removing, and didn't early break, mark last node as NOT final
   * - if adding, mark last node as final
   * Then try merging (and retracting for removing)
   */
  private processWord(word: string, remove: boolean) {
    let lastNode = this._root
    const chain = [lastNode]
    
    let i = 0
    let shouldClone = false
    for (; i < word.length; ++i) {
      const char = word.charAt(i)
      const child = nodeGetNext(lastNode, char)
      if (child) {
        if (child.inDegree > 1) {
          shouldClone = true
        }
        if (shouldClone) {
          const cloned = this.cloneNode(child)
          nodeSetOutEdge(lastNode, char, cloned)
          lastNode = cloned
        } else {
          this.removeFromRegister(child)
          lastNode = child
        }
      } else {
        if (remove) {
          break
        } else {
          const newNode = this.addNode()
          nodeSetOutEdge(lastNode, char, newNode)
          lastNode = newNode
        }
      }
      chain.push(lastNode)
    }
    // finalization
    if (remove) {
      if (i=== word.length) {
        lastNode.final = false
      }
    } else {
      lastNode.final = true
    }

    for (let i = chain.length - 2; i >= 0; --i) {
      this.replaceOrRegister(chain[i], word.charAt(i))
    }
  }

  /**
   * MARK: API
   */
  public addWord(word: string) {
    this.processWord(word, false)
  }
  public removeWord(word: string) {
    this.processWord(word, true)
  }
}

function match(prefix: string, start: TrieNode) {
  let lastNode = start
  for (let i = 0; i < prefix.length; ++i) {
    const char = prefix.charAt(i)
    const next = nodeGetNext(lastNode, char)
    if (!next) {
      return {
        matched: prefix.slice(0, i),
        node: lastNode,
      }
    }
    lastNode = next
  }
  return {
    matched: prefix,
    node: lastNode,
  }
}

/**
 * Nodes are compared by the following precedences:
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

function cutout(node: TrieNode) {
  // remove all transitions
  for (let i = 0; i < node.out.length; ++i){
    --node.out[i][1].inDegree
  }
}