import { compareNodeOut, nodeGetNext, type DGraphNode } from './utils'
import SplayTree from 'splaytree'
import { binarySearch } from './utils'

export interface TrieNode extends DGraphNode {
  final: boolean
  inDegree: number
}

export class TrieAutomaton {

  private _root!: TrieNode
  get root(){
    return this._root
  }
  private _states: TrieNode[] = []
  // get states(): Readonly<typeof this._states>{ // tsdown will lose type on private member
  get states() {
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
      setTrieTransition(state, char, found)
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
    // cutout(node)
    for (let i = 0; i < node.out.length; ++i){
      --node.out[i][1].inDegree
    }

    // remove from register
    if (alsoRegister) {
      this.removeFromRegister(node)
    }

    // put the node in pool
    this.nodePool.push(node)
    // swap current position node and last node
    const lastID = this.states.length - 1
    const swapnode = this._states[lastID]
    this._states[id] = swapnode
    swapnode.id = id
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
    // if (import.meta.env.DEV) {
    //   console.debug('[debug:dawg-search] Processing word: ' + word)
    // }
    let lastNode = this._root
    const chain = [lastNode]
    
    let i = 0
    let shouldClone = false
    for (; i < word.length; ++i) {
      const char = word.charAt(i)
      const child = nodeGetNext(lastNode, char)
      // if (import.meta.env.DEV) {
      //   console.debug(`[debug:dawg-search] - Processing char: `+char)
      // }
      if (child) {
        if (child.inDegree > 1) {
          shouldClone = true
        }
        if (shouldClone) {
          const cloned = this.cloneNode(child)
          setTrieTransition(lastNode, char, cloned)
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
          setTrieTransition(lastNode, char, newNode)
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

/**
 * Nodes are compared by the following precedences:
 * - not final node <-> is final node
 * - less out edges <-> more out edges
 * - for each edge, its character order, or the connected node order
 * - if all above are equal, the two nodes are considered equal. (so they can be merged)
 */
function compareNode(a: TrieNode, b: TrieNode) {
  if (a === b) return 0

  let diff = (a.final ? 1 : 0) - (b.final ? 1 : 0)
  if (diff !== 0) return diff

  diff = a.out.length - b.out.length
  if (diff !== 0) return diff

  for (let i = 0; i < a.out.length; ++i) {
    const [charA, nodeA] = a.out[i]
    const [charB, nodeB] = b.out[i]

    diff = charA.localeCompare(charB)
    if (diff !== 0) return diff

    // most case they should either point to the same node,
    // or obviously different so no need to recur a second time.
    return compareNode(nodeA, nodeB)
  }
  return 0
}

function setTrieTransition(node: TrieNode, char: string, next?: TrieNode){
  const idx = binarySearch(node.out, [char, undefined], compareNodeOut)

  const found = node.out[idx]?.[0] === char
  const oldNext = found ? node.out[idx]?.[1] as TrieNode : undefined

  if (oldNext === next) {
    return
  }

  if (found) {
    if (next) {
      // Replace existing transition
      node.out.splice(idx, 1, [char, next])
    } else {
      // Remove existing transition
      node.out.splice(idx, 1)
    }
  } else if (next) {
    // Add new transition
    node.out.splice(idx, 0, [char, next])
  }

  if (oldNext) {
    --oldNext.inDegree
  }
  if (next) {
    ++next.inDegree
  }
}
