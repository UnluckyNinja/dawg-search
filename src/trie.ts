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
   * For branching when add/remove word
   * uses internal ID
   */
  private indegrees!: number[]
  /**
   * uses internal ID.
   * [from].<char of edge, to>
   */ 
  private edgeMaps!: (Map<string, number> | null)[]
  /**
   * uses internal ID.
   * [to].<from, edgeCount> 
   */
  private backLinks!: (Map<number, number> | null)[]

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
    this.edgeMaps = [null, null]
    this.backLinks = [null, null]
  }

  /*
   * MARK: Internal funcs
   */

  private stableToInternal(stableID: number) {
    return this.indirectIndex[stableID]
  }
  private internalToStable(internalID: number) {
    return this.backIndex[internalID]
  }
  public isFinal(stableID: number) {
    return this.getTransition(stableID, '') === this._end
  }
  private getIndegree(stableID: number) {
    return this.indegrees[this.stableToInternal(stableID)]
  }
  private setIndegree(stableID: number, value: number) {
    this.indegrees[this.stableToInternal(stableID)] = value
  }
  private increaseIndegree(stableID: number, amount = 1) {
    this.indegrees[this.stableToInternal(stableID)] += amount
  }
  private decreaseIndegree(stableID: number, amount = 1) {
    this.indegrees[this.stableToInternal(stableID)] -= amount
  }

  private getEdgeMap(stableID: number) {
    const internalID = this.stableToInternal(stableID)
    let edgeMap = this.edgeMaps[internalID]
    if (!edgeMap) {
      edgeMap = new Map()
      this.edgeMaps[internalID] = edgeMap
    }
    return edgeMap
  }
  // private addEdge(stableID: number, char: string, targetStableID: number) {
  //   const edgeMap = this.getEdgeMap(stableID)
  //   edgeMap.set(char, targetStableID)
  // }

  // private deleteEdge(stableID: number, char: string) {
  //   const edgeMap = this.getEdgeMap(stableID)
  //   if (edgeMap.size <= 0) {
  //     throw new Error(`deleteEdge called on empty edgeMap for id ${stableID}, char ${char}`)
  //   }
  //   edgeMap.delete(char)
  // }
  private getBackLinkMap(edgeToStableID: number) {
    const internalID = this.stableToInternal(edgeToStableID)
    let backlinkMap = this.backLinks[internalID]
    if (!backlinkMap) {
      backlinkMap = new Map()
      this.backLinks[internalID] = backlinkMap
    }
    return backlinkMap
  }
  // private setBackLink(edgeToStableID: number, edgeFromStableID: number, value: number) {
  //   const backlinkMap = this.getBackLinkMap(edgeToStableID)
  //   if (value < 0) {
  //     throw new Error(`Trying to set backlink to ${edgeToStableID} from ${edgeFromStableID},`
  //       + ` but value is under zero : ${value}.`)
  //   }
  //   backlinkMap.set(edgeFromStableID, value)
  // }
  private addBackLink(edgeToStableID: number, edgeFromStableID: number, amount = 1) {
    const backlinkMap = this.getBackLinkMap(edgeToStableID)
    const value = backlinkMap.get(edgeFromStableID)
    if (!value) {
      backlinkMap.set(edgeFromStableID, amount)
    } else {
      backlinkMap.set(edgeFromStableID, value+amount)
    }
  }
  private removeBackLink(edgeToStableID: number, edgeFromStableID: number, amount = 1) {
    const backlinkMap = this.getBackLinkMap(edgeToStableID)
    const value = backlinkMap.get(edgeFromStableID)
    if (!value || value - amount < 0) {
      throw new Error(`Trying to remove backlink to ${edgeToStableID} from ${edgeFromStableID} by ${amount},`
        + ` but old value is ${value}.`)
    }
    if (value-amount === 0) {
      backlinkMap.delete(edgeFromStableID)
    } else {
      backlinkMap.set(edgeFromStableID, value-amount)
    }
  }

  public hasTransition(stableID: number, char: string) {
    return this.edgeMaps[this.stableToInternal(stableID)]?.has(char) || false
  }
  public getTransition(stableID: number, char: string) {
    return this.edgeMaps[this.stableToInternal(stableID)]?.get(char)
  }

  private setTransition(stableID: number, char: string, targetStableID?: number) {
    // first remove old back link and decrease indegree if any
    // then update edge
    // then add new back link and increase indegree if any
    const edgeMap = this.getEdgeMap(stableID)
    const found = edgeMap.has(char)
    // remove old target related stuff
    if (found) {
      const oldTarget = edgeMap.get(char)!
      if (oldTarget === targetStableID) return

      this.removeBackLink(oldTarget, stableID, 1)
      this.decreaseIndegree(oldTarget)

    }
    // remove old edge
    if (targetStableID === undefined) {
      if (found) {
        edgeMap.delete(char)
      }
      return
    }
    // update new edge
    edgeMap.set(char, targetStableID)
    // set new target related stuff
    this.increaseIndegree(targetStableID)
    this.addBackLink(targetStableID, stableID)
  }

  /*
   * MARK: - Node Processing
   */

  /**
   * This implementation no need to concern about order
   */
  isNodeEqual(a: number, b: number) {
    if (a === b) return 0

    // let finalDiff = (this.finals[a] ? 1 : 0) - (this.finals[b] ? 1 : 0)
    // if (finalDiff !== 0) return finalDiff

    const edgeMapA = this.getEdgeMap(a)
    const edgeMapB = this.getEdgeMap(b)

    if (edgeMapA.size !== edgeMapB.size) {
      return false
    }
    const itorA = edgeMapA.entries()
    let entryA = itorA.next()
    while (!entryA.done) {
      const [charA, otherA] = entryA.value
      if (!edgeMapB.has(charA)) {
        return false
      }
      if (edgeMapB.get(charA) !== otherA) {
        return false
      }
      entryA = itorA.next()
    }

    return true
  }

  private addNode(): number {
    let internalID: number = this.internalSize
    this.internalSize += 1
    if (this.internalSize > this.indirectIndex.length) {
      this.indirectIndex.push(internalID)
      this.backIndex.push(internalID)
    }
    // this.finals.push(false)
    this.indegrees.push(0)
    this.edgeMaps.push(null)
    this.backLinks.push(null)

    return this.backIndex[internalID]
  }

  private cloneNode(otherStableID: number): number {
    const clonedStableID = this.addNode()

    // copy out edges
    const edgeMap = this.getEdgeMap(otherStableID)
    for (const [edge, target] of edgeMap.entries()) {
      this.setTransition(clonedStableID, edge, target)
    }

    return clonedStableID
  }

  private tryMergeNode(toBeMergedID: number, redirectToID: number): boolean {
    if (toBeMergedID === redirectToID) return false
    if (!this.isNodeEqual(toBeMergedID, redirectToID)) {
      return false
    }

    // redirecct in edges
    let backlinkMap = this.getBackLinkMap(toBeMergedID)
    for (const ancestorID of backlinkMap.keys()) {
      const edgeMap = this.getEdgeMap(ancestorID)
      for (const [char, other] of edgeMap.entries()) {
        if (other === toBeMergedID) {
          edgeMap.set(char, redirectToID)
          this.addBackLink(redirectToID, ancestorID)
          this.decreaseIndegree(toBeMergedID)
          this.increaseIndegree(redirectToID)
        }
      }
      backlinkMap.delete(ancestorID)
    }

    if (this.getIndegree(toBeMergedID) !== 0) {
      throw new Error("Indegree doesn't match after redirection, code is not correct., expect: 0, got: "+this.getIndegree(toBeMergedID))
    }

    this.deleteNode(toBeMergedID)

    return true
  }

  private tryMergeAdd(stableIDs: number[], tail = this._end) {
    outter:
    for (let i = stableIDs.length - 1; i >= 0; --i) {
      const currentStableID = stableIDs[i]
      if (currentStableID === this._root) break

      const backlinkMap = this.getBackLinkMap(tail)

      for (const candidate of backlinkMap.keys()) {
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

  private tryMergeRemove(stableIDs: number[]) {
    const last = stableIDs.at(-1)
    if (!last || last === this._root) return

    /* 
      At first, we don't know which successor has backlink that is equal to current
      So we loop every successor node of the last node in input
      If any node mathches, we can stop this loop
     */

    const unequals = new Set()
    const edgeMap = this.getEdgeMap(last)
    let foundEqual = false
    outter:
    for (let tail of edgeMap.values()) {

      middle:
      for (let i = stableIDs.length - 1; i >= 0; --i) {
        const currentStableID = stableIDs[i]
        if (currentStableID === this._root) break
        const backlinkMap = this.getBackLinkMap(tail)

        for (const candidate of backlinkMap.keys()) {
          if (!foundEqual && unequals.has(candidate)) {
            continue
          }
          const toBeMergedID = currentStableID < candidate ? candidate : currentStableID
          const redirectToID = currentStableID < candidate ? currentStableID : candidate
          if (this.tryMergeNode(toBeMergedID, redirectToID)) {
            tail = redirectToID
            foundEqual = true
            continue middle
          } else if (!foundEqual) {
            unequals.add(candidate)
          }
        }
        break
      }

      if (foundEqual) {
        break outter
      }
    }

  }

  /**
   * edges related should be taken care in other methods.
   * @returns false if the parameter is not presented in states, true otherwise.
   */
  private deleteNode(toDeleteStableID: number, alsoEdges = true): boolean {
    if (toDeleteStableID >= this.internalSize) return false

    if (alsoEdges) {
      if (this.getIndegree(toDeleteStableID) > 0) {
        // delete in edges
        let backlinkMap = this.getBackLinkMap(toDeleteStableID)
        for (const ancestorID of backlinkMap.keys()) {
          const edgeMap = this.getEdgeMap(ancestorID)
          for (const [char, other] of edgeMap.entries()) {
            if (other === toDeleteStableID) {
              edgeMap.delete(char)
              this.decreaseIndegree(toDeleteStableID)
              this.removeBackLink(toDeleteStableID, ancestorID)
            }
          }
          backlinkMap.delete(ancestorID)
        }

        if (this.getIndegree(toDeleteStableID) !== 0) {
          throw new Error("Indegree doesn't match after deletion, code is incorrect.")
        }
      }
      // remove edges and target backlinks
      let edgeMap = this.getEdgeMap(toDeleteStableID)
      for (const [char, other] of edgeMap.entries()) {
        this.removeBackLink(other, toDeleteStableID)
        this.decreaseIndegree(other)
        edgeMap.delete(char)
      }
    }

    const tailInternalID = this.internalSize - 1
    const tailStableID = this.internalToStable(tailInternalID)
    const toDeleteInternalID = this.stableToInternal(toDeleteStableID)

    this.setIndegree(toDeleteStableID, this.getIndegree(tailStableID))
    this.indegrees.pop()
    this.edgeMaps[toDeleteInternalID] = this.edgeMaps[tailInternalID]
    this.edgeMaps.pop()
    this.backLinks[toDeleteInternalID] = this.backLinks[tailInternalID]
    this.backLinks.pop()
    this.internalSize -= 1
    
    this.backIndex[tailInternalID] = toDeleteStableID
    this.indirectIndex[tailStableID] = toDeleteInternalID
    this.backIndex[toDeleteInternalID] = tailStableID
    this.indirectIndex[toDeleteStableID] = tailInternalID

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

    // follow transitions until indegree > 1
    // then start cloning transitions until no such edge
    // then create new nodes 
    // merge last nodes upwards
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
    this.tryMergeAdd(nodesToMerge)
  }
  public removeWord(word: string) {
    // fail fast check
    if (!word) return
    const processed = this.processedWords.has(word)
    if (!processed) {
      return
    }
    this.processedWords.delete(word)
    /*
      Follow and clone are the same as adding a word,
      except the transition should always exists.
      Then, for the last node (final state), remove the edge to end node.
      And check for deletion (nodes that have no path to the end node),
      send the rest to check for merging.
     */
    const nodesToMerge = [this._root]
    for (let i = 0; i < word.length; i++) {
      const lastNode = nodesToMerge.at(-1)!
      const edgeChar = word.charAt(i)
      let next = this.getTransition(lastNode, edgeChar)

      if (!next) {
        throw new Error(`When removing existing word found no such transition: ${lastNode} "${edgeChar}"`)
      }
      
      if (this.getIndegree(next) > 1) {
        next = this.cloneNode(next)
        this.setTransition(lastNode, edgeChar, next)
      }
      nodesToMerge.push(next)
    }

    this.setTransition(nodesToMerge.at(-1)!, '')
    let lastNode = nodesToMerge.at(-1)
    while (lastNode && lastNode !== this._root && this.getEdgeMap(lastNode).size === 0) {
      this.deleteNode(lastNode)
      nodesToMerge.pop()
      lastNode = nodesToMerge.at(-1)
    }
    if (nodesToMerge.length > 1) {
      this.tryMergeRemove(nodesToMerge)
    }
  }
  refill(words: string[]) {
    this.init()
    for (let i = 0; i < words.length; ++i ) {
      this.addWord(words[i])
    }
  }

}
