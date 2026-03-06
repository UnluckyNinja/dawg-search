import { SkipList, type SkipListIterator } from './skiplist'

export class TrieAutomaton {

  private _root!: number
  private _end!: number
  get root() {
    return this._root
  }
  get end() {
    return this._end
  }
  /**
   * from stable ID to internal ID
   */
  private indirectIndex!: number[]
  /**
   * from internal ID to stable ID
   */
  private backIndex!: number[]
  /**
   * Track internal ID size
   */
  private internalSize!: number
  /**
   * uses internal ID
   */
  // private finals!: boolean[]
  /**
   * For branching when add/remove word
   * uses internal ID
   */
  private indegrees!: number[]
  /**
   * For comparing nodes
   * uses internal ID
   */
  private outdegrees!: number[]
  /**
   * uses stable ID.
   * generics order: from, char of edge, to
   */ 
  private edges!: SkipList<[number, string], number>
  /**
   * uses stable ID.
   * generics order: to, from, edgeCount 
   */
  private backLinks!: SkipList<[number, number], number>

  private processedWords = new Set<string>()

  constructor(words?: string[]){
    this.refill(words ?? [])
  }

  private init() {
    this._root = 0
    this._end = 1
    this.indirectIndex = [0, 1]
    this.internalSize = 2
    this.backIndex = [0, 1]
    // this.finals = [false, true]
    this.indegrees = [0, 0]
    this.edges = new SkipList((a,b)=>{
      let fromDiff = a[0] - b[0]
      if (fromDiff !== 0){
        return fromDiff
      }
      return a[1].localeCompare(b[1])
    })
    this.backLinks = new SkipList((a,b)=>{
      return (a[0] - b[0]) !== 0 ? a[0] - b[0] : a[1] - b[1]
    })
  }

  // getState(i: number) {
  //   if (i >= this.internalSize) {
  //     throw new Error('Index is out of bounds.')
  //   }
  //   return {
  //     id: i,
  //     final: this.finals[i],
  //     inDegree: this.indegrees[i],
  //   }
  // }

  /*
   * MARK: Internal funcs
   */

  private compareEdge(a: string, b: string) {
    return a.localeCompare(b)
  }

  /**
   * Nodes are compared by the following precedences:
   * - not final node <-> is final node
   * - for each edge, the connected node order, or its character order
   * - if all above are equal, the two nodes are considered equal. (so they can be merged)
   */
  compareNode(a: number, b: number) {
    if (a === b) return 0

    // let finalDiff = (this.finals[a] ? 1 : 0) - (this.finals[b] ? 1 : 0)
    // if (finalDiff !== 0) return finalDiff

    let edgeItorA = this.edges.findFirst((key)=>{
      return key[0] - a
    })
    let edgeItorB = this.edges.findFirst((key)=>{
      return key[0] - b
    })

    while (edgeItorA?.key[0] === a && edgeItorB?.key[0] === b) {
      const toA = edgeItorA.value
      const toB = edgeItorB.value
      const toDiff = toA - toB
      if (toDiff !== 0) {
        return toDiff
      }
      const charA = edgeItorA.key[1]
      const charB = edgeItorB.key[1]
      const charDiff = this.compareEdge(charA, charB)
      if (charDiff !== 0) {
        return charDiff
      }
      edgeItorA = edgeItorA.next()
      edgeItorB = edgeItorB.next()
    }
    if (edgeItorA?.key[0] === a) {
      return 1
    } else if (edgeItorB?.key[0] === b) {
      return -1
    }

    return 0
  }

  private stableToInternal(stableID: number) {
    return this.indirectIndex[stableID]
  }
  private internalToStable(internalID: number) {
    return this.backIndex[internalID]
  }
  // private getFinal(stableID: number) {
  //   return this.finals[this.stableToInternal(stableID)]
  // }
  // private setFinal(stableID: number, value: boolean) {
  //   this.finals[this.stableToInternal(stableID)] = value
  // }
  public isFinal(stableID: number) {
    return this.getTransition(stableID, '') === this._end
  }
  private getIndegree(stableID: number) {
    if (this.indegrees[this.stableToInternal(stableID)] === undefined) debugger
    return this.indegrees[this.stableToInternal(stableID)]
  }
  private setIndegree(stableID: number, value: number) {
    if (this.indegrees[this.stableToInternal(stableID)] === undefined) debugger
    this.indegrees[this.stableToInternal(stableID)] = value
  }
  private increaseIndegree(stableID: number, amount = 1) {
    if (this.indegrees[this.stableToInternal(stableID)] === undefined) debugger
    this.indegrees[this.stableToInternal(stableID)] += amount
  }
  private decreaseIndegree(stableID: number, amount = 1) {
    if (this.indegrees[this.stableToInternal(stableID)] === undefined) debugger
    this.indegrees[this.stableToInternal(stableID)] -= amount
  }
  private getBackLink(edgeToStableID: number, edgeFromStableID: number): SkipListIterator<[number, number], number> | undefined
  private getBackLink(edgeToStableID: number, edgeFromStableID: number, createNew: true): SkipListIterator<[number, number], number>
  private getBackLink(edgeToStableID: number, edgeFromStableID: number, createNew = false) {
    let backItor = this.backLinks.findExact([edgeToStableID, edgeFromStableID])
    if (!backItor && createNew) {
      backItor = this.backLinks.insert([edgeToStableID, edgeFromStableID], 0)
    }
    return backItor
  }
  private addBackLink(edgeToStableID: number, edgeFromStableID: number, amount = 1) {
    const backItor = this.backLinks.findExact([edgeToStableID, edgeFromStableID])
    if (backItor) {
      backItor.value += amount
    } else {
      this.backLinks.insert([edgeToStableID, edgeFromStableID], amount)
    }
  }
  /**
   * if amount < 0, delete backlink
   */
  private removeBackLink(edgeToStableID: number, edgeFromStableID: number, amount = 1): boolean {
    const backItor = this.backLinks.findExact([edgeToStableID, edgeFromStableID])
    if (!backItor) {
      return false
    }
    if (amount > backItor.value) {
      throw new Error(`Trying to remove back link `
        + `[${edgeToStableID}, ${edgeFromStableID}] to negative `
        + `(was ${backItor.value}, trying to remove ${amount})`)
    }
    if (amount < 0) {
      this.backLinks.delete([edgeToStableID, edgeFromStableID])
      return true
    }
    backItor.value -= amount
    if (backItor.value === 0) {
      this.backLinks.delete([edgeToStableID, edgeFromStableID])
    }
    return true
  }
  public getTransition(stableID: number, char: string) {
    return this.edges.search([stableID, char])
  }
  /**
   * each invocation to this will result in mutilple calls of at least O(logN) cost,
   * special case should be specialized to increase performance
   */
  private setTransition(stableID: number, char: string, targetStableID?: number) {
    // first remove old back link and decrease indegree if any
    // then update edge
    // then add new back link and increase indegree if any
    const edgeItor = this.edges.findExact([stableID, char])
    // remove old target related stuff
    if (edgeItor) {
      const oldTarget = edgeItor.value
      if (oldTarget === targetStableID) return

      const backItor = this.backLinks.findExact([oldTarget, stableID])
      // itor must be truthy beacause edge exists
      backItor!.value -= 1
      if (backItor!.value === 0) {
        this.backLinks.delete([oldTarget, stableID])
      }
      this.decreaseIndegree(oldTarget)
    }
    // remove old edge
    if (targetStableID === undefined) {
      if (edgeItor) {
        this.edges.delete([stableID, char])
      }
      return
    }
    // update new edge
    if (edgeItor) {
      edgeItor.value = targetStableID
    } else {
      this.edges.insert([stableID, char], targetStableID)
    }
    // set new target related stuff
    this.increaseIndegree(targetStableID)
    const backItor = this.backLinks.findExact([targetStableID, stableID])
    if (backItor) {
      backItor.value += 1
    } else {
      this.backLinks.insert([targetStableID, stableID], 1)
    }
  }

  /*
   * MARK: - Node Processing
   */

  private addNode(): number {
    let internalID: number = this.internalSize
    ++this.internalSize
    if (this.internalSize > this.indirectIndex.length) {
      this.indirectIndex.push(internalID)
      this.backIndex.push(internalID)
    }
    // this.finals.push(false)
    this.indegrees.push(0)
    return this.backIndex[internalID]
  }

  private cloneNode(otherStableID: number): number {
    const clonedStableID = this.addNode()
    // this.setFinal(clonedStableID, this.getFinal(otherStableID))
    this.setIndegree(clonedStableID, 0)

    // copy out edges
    const out:[string, number][] = []
    let edgeItor = this.edges.findFirst((key)=>key[0]-otherStableID)
    while (edgeItor?.key[0] === otherStableID) {
      const edge = edgeItor.key[1]
      const target = edgeItor.value
      out.push([edge, target])
      edgeItor = edgeItor.next()
    }
    for (const [edge, target] of out) {
      // @TODO potential performance optimzation
      // As cloned nodes are completed new,
      // there is no old edges and backlinks,
      // and all cloned edges are in the same order and adjacent,
      // so we can save all search calls.
      //
      // In other words, implement batch insert in skiplist
      this.setTransition(clonedStableID, edge, target)
    }
    return clonedStableID
  }

  private tryMergeNode(toBeMergedID: number, redirectToID: number): boolean {
    if (toBeMergedID === redirectToID) return false
    if (this.compareNode(toBeMergedID, redirectToID) !== 0) {
      return false
    }

    // redirecct in edges
    let backItor = this.backLinks.findFirst((key)=>key[0]-toBeMergedID)
    while(backItor?.key[0] === toBeMergedID) {
      const ancestorID = backItor.key[1]
      let edgeItor = this.edges.findFirst((key)=> key[0]-ancestorID)
      const redirectBackItor = this.getBackLink(redirectToID, ancestorID, true)
      while (edgeItor?.key[0] === ancestorID) {
        if (edgeItor.value === toBeMergedID) {
          edgeItor.value = redirectToID
          this.decreaseIndegree(toBeMergedID)
          this.increaseIndegree(redirectToID)
          redirectBackItor.value += 1
        }
        edgeItor = edgeItor.next()
      }
      backItor = backItor.remove()
    }

    if (this.getIndegree(toBeMergedID) !== 0) {
      throw new Error("Indegree doesn't match after redirection, code is not correct., expect: 0, got: "+this.getIndegree(toBeMergedID))
    }

    this.deleteNode(toBeMergedID)

    return true
  }

  private tryMergeTail(stableIDs: number[]) {
    let tail = this._end
    outter:
    for (let i = stableIDs.length - 1; i >= 0; --i) {
      const currentStableID = stableIDs[i]

      // collect candidates first in case merging messed up iterator
      let itor = this.backLinks.findFirst((key)=>key[0] - tail)
      const candidates = []
      while (itor?.key[0] === this._end) {
        if (itor.key[1] !== currentStableID) {
          candidates.push(itor.key[1])
        }
        itor = itor.next()
      }
      for (const candidate of candidates) {
        const toBeMergedID = currentStableID < candidate ? candidate : currentStableID
        const redirectToID = currentStableID < candidate ? currentStableID : candidate
        if (this.tryMergeNode(toBeMergedID, redirectToID)) {
          tail = redirectToID
          continue outter
        }
      }
      break
    }
  }

  /**
   * edges related should be taken care in other methods.
   * @returns false if the parameter is not presented in states, true otherwise.
   */
  private deleteNode(toDeleteStableID: number, alsoEdges = true): boolean {
    if (toDeleteStableID >= this.internalSize) return false
    if (this.getIndegree(toDeleteStableID) > 0) {
      throw new Error('To delete node, you should remove all transitions to this node first')
    }

    if (alsoEdges) {
      if (this.getIndegree(toDeleteStableID) > 0) {
        // delete in edges
        let backItor = this.backLinks.findFirst((key)=>key[0]-toDeleteStableID)
        while(backItor?.key[0] === toDeleteStableID) {
          const ancestorID = backItor.key[1]
          let edgeItor = this.edges.findFirst((key)=> key[0]-ancestorID)
          while (edgeItor?.key[0] === ancestorID) {
            if (edgeItor.value === toDeleteStableID) {
              this.decreaseIndegree(toDeleteStableID)
              edgeItor = edgeItor.remove()
            } else {
              edgeItor = edgeItor.next()
            }
          }
          backItor = backItor.remove()
        }
        if (this.getIndegree(toDeleteStableID) !== 0) {
          throw new Error("Indegree doesn't match after deletion, code is not correct.")
        }
      }
      // remove edges and target backlinks
      let edgeItor = this.edges.findFirst((key)=>key[0]-toDeleteStableID)
      while (edgeItor?.key[0] === toDeleteStableID) {
        this.removeBackLink(edgeItor.value, toDeleteStableID)
        this.decreaseIndegree(edgeItor.value)
        edgeItor = edgeItor.remove()
      }
    }

    const tailInternalID = this.internalSize - 1
    const tailStableID = this.internalToStable(tailInternalID)
    const toDeleteInternalID = this.stableToInternal(toDeleteStableID)

    // this.setFinal(toDeleteStableID, this.getFinal(tailStableID))
    this.setIndegree(toDeleteStableID, this.getIndegree(tailStableID))
    // this.finals.pop()
    this.indegrees.pop()
    this.internalSize -= 1
    
    this.backIndex[tailInternalID] = toDeleteStableID
    this.indirectIndex[tailStableID] = toDeleteInternalID
    this.backIndex[toDeleteInternalID] = tailStableID
    this.indirectIndex[toDeleteStableID] = tailInternalID

    // assumes edges and backlinks are taken care in other methods

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

  /*
   * MARK: API
   */

  public addWord(word: string) {
    // fail fast check
    if (!word) return
    const processed = this.processedWords.has(word)
    if (processed) {
      return
    }
    this.processedWords.add(word)
    const nodesToMerge = [this._root]
    let newBranch = false
    for (let i = 0; i < word.length; i++) {
      const lastNode = nodesToMerge.at(-1)!
      const edgeChar = word.charAt(i)
      let next = undefined
      if (!newBranch){
        next = this.getTransition(lastNode, edgeChar)
      }
      
      if (!next) {
        newBranch = true
        next = this.addNode()
        this.setTransition(lastNode, edgeChar, next)
      } else if (this.getIndegree(next) > 1) {
        next = this.cloneNode(next)
        this.setTransition(lastNode, edgeChar, next)
      }
      nodesToMerge.push(next)
    }
    this.setTransition(nodesToMerge.at(-1)!, '', this._end)
    this.tryMergeTail(nodesToMerge)
  }
  // public removeWord(word: string) {
  //   // fail fast check
  //   if (!word) return
  //   const processed = this.processedWords.has(word)
  //   if (!processed) {
  //     return
  //   }
  //   this.processedWords.delete(word)

    
  // }
  refill(words: string[]) {
    this.init()
    for (let i = 0; i < words.length; ++i ) {
      this.addWord(words[i])
    }
  }

}
