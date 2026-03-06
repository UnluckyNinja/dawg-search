/**
 * SkipNode represents a node in the SkipList.
 */
interface SkipNode<K, V> {
  key: K | null
  value: V | null
  next: (SkipNode<K, V> | null)[]
  previous: (SkipNode<K,V> | null)[]
}

/**
 * SkipListIterator allows traversing the skip list starting from a specific node.
 */
export interface SkipListIterator<K, V> {
  readonly key: K
  value: V
  next(): SkipListIterator<K, V> | undefined
  previous(): SkipListIterator<K, V> | undefined
  /**
   * After removal, points to next node if any
   */
  remove(): SkipListIterator<K, V> | undefined
  clone(): SkipListIterator<K, V>
}

class SkipListIteratorImpl<K, V> implements SkipListIterator<K, V> {
  constructor(private node: SkipNode<K, V>, private head: SkipNode<K, V>) {}
  get key(): K { return this.node.key! }
  get value(): V { return this.node.value! }
  set value(v) {
    this.node.value = v
  }
  next(): SkipListIterator<K, V> | undefined {
    const n = this.node.next[0]
    if (n) {
      this.node = n
      return this
    }
    return undefined
  }
  previous(): SkipListIterator<K, V> | undefined {
    const n = this.node.previous[0]
    if (n && n !== this.head) {
      this.node = n
      return this
    }
    return undefined
  }
  remove(): SkipListIterator<K, V> | undefined {
    const next = this.node.next[0]
    for (let i = 0; i < this.node.previous.length; i++) {
      if (this.node.previous[i] === null ) break
      this.node.previous[i]!.next[i] = this.node.next[i]
      if (this.node.next[i] !== null) {
        this.node.next[i]!.previous[i] = this.node.previous[i]
      }
    }
    if (next) {
      this.node = next
      return this
    }
    return undefined
  }
  clone() {
    return new SkipListIteratorImpl(this.node, this.head)
  }
}

/**
 * SkipList implementation in TypeScript.
 * Provides O(log n) average time complexity for search, insert, and delete.
 */
export class SkipList<K, V> {
  private head: SkipNode<K, V>
  public readonly maxLevel: number
  private currentLevel: number
  public readonly p: number

  /**
   * @param compare A function to compare two keys. Returns < 0 if a < b, 0 if a == b, > 0 if a > b.
   * @param maxLevel Maximum height of the skip list. Defaults to 32.
   * @param p Probability for level promotion. Defaults to 0.25.
   */
  constructor(
    private compare: (a: K, b: K) => number,
    maxLevel = 32,
    p = 0.25
  ) {
    this.maxLevel = maxLevel
    this.p = p
    this.currentLevel = 0
    this.head = {
      key: null,
      value: null,
      next: new Array(maxLevel).fill(null),
      previous: new Array(maxLevel).fill(null)
    }
  }

  /**
   * Finds the first item that matches the custom comparison function.  
   * Multiple equality is OK but must be continuous to form a range
   * The compare function should return:
   * 
   * - < 0 - if the node's key is before the target range
   * - = 0 - if the node's key is within the target range
   * - \> 0 - if the node's key is after the target range
   * 
   * Returns an iterator starting at the leftmost matching item, or undefined if no match is found.
   */
  findFirst(searchCompare: (key: K) => number): SkipListIterator<K, V> | undefined {
    let curr: SkipNode<K,V> = this.head
    for (let i = this.currentLevel - 1; i >= 0; i--) {
      while (curr.next[i] && searchCompare(curr.next[i]!.key as K) < 0) {
        curr = curr.next[i]!
      }
    }
    const target = curr.next[0]
    if (target && target.key !== null && searchCompare(target.key as K) === 0) {
      return new SkipListIteratorImpl(target, this.head)
    }
    return undefined
  }
  /**
   * The same with findFirst, but find exact value and use existing compare function.
   * @see {@link findFirst}
   */
  findExact(key: K): SkipListIterator<K, V> | undefined {
    const searchCompare = (other: K)=>this.compare(other, key)
    return this.findFirst(searchCompare)
  }

  private randomLevel(): number {
    let lvl = 1
    while (Math.random() < this.p && lvl < this.maxLevel) {
      lvl++
    }
    return lvl
  }

  /**
   * Inserts or updates a key-value pair.
   */
  insert(key: K, value: V): SkipListIterator<K, V> {
    const update = new Array<SkipNode<K, V>>(this.maxLevel).fill(this.head)
    let curr: SkipNode<K,V> = this.head

    // Traverse levels from top to bottom
    for (let i = this.currentLevel - 1; i >= 0; i--) {
      while (curr.next[i] && this.compare(curr.next[i]!.key as K, key) < 0) {
        curr = curr.next[i]!
      }
      update[i] = curr
    }

    const target = curr.next[0]

    // If key exists, update value
    if (target && target.key !== null && this.compare(target.key as K, key) === 0) {
      target.value = value
      return new SkipListIteratorImpl(target, this.head)
    }

    // Otherwise, create a new node with a random level
    const lvl = this.randomLevel()
    if (lvl > this.currentLevel) {
      for (let i = this.currentLevel; i < lvl; i++) {
        update[i] = this.head
      }
      this.currentLevel = lvl
    }

    const newNode: SkipNode<K, V> = {
      key,
      value,
      next: new Array(lvl).fill(null),
      previous: new Array(lvl).fill(null),
    }

    for (let i = 0; i < lvl; i++) {
      const next = update[i].next[i]
      newNode.next[i] = next
      if (next) {
        next.previous[i] = newNode
      }
      update[i].next[i] = newNode
      newNode.previous[i] = update[i]
    }

    return new SkipListIteratorImpl(newNode, this.head)
  }

  /**
   * Finds the value associated with the given key.
   */
  search(key: K): V | undefined {
    let curr: SkipNode<K,V> = this.head
    for (let i = this.currentLevel - 1; i >= 0; i--) {
      while (curr.next[i] && this.compare(curr.next[i]!.key as K, key) < 0) {
        curr = curr.next[i]!
      }
    }
    const target = curr.next[0]
    if (target && target.key !== null && this.compare(target.key as K, key) === 0) {
      return target.value as V
    }
    return undefined
  }

  /**
   * Removes a key from the list. Returns value if the key was found and removed.
   */
  delete(key: K): V | undefined {
    const update = new Array<SkipNode<K, V> >(this.maxLevel).fill(this.head)
    let curr: SkipNode<K,V> = this.head

    for (let i = this.currentLevel - 1; i >= 0; i--) {
      while (curr.next[i] && this.compare(curr.next[i]!.key as K, key) < 0) {
        curr = curr.next[i]!
      }
      update[i] = curr
    }

    const target = curr.next[0]
    if (!target || target.key === null || this.compare(target.key as K, key) !== 0) {
      return undefined
    }

    const value = target.value as V

    // Update pointers at each level
    for (let i = 0; i < this.currentLevel; i++) {
      if (update[i].next[i] !== target) break
      update[i].next[i] = target.next[i]
    }

    // Update backwards pointers at each level
    for (let i = 0; i < this.currentLevel; i++) {
      if (!target.next[i]) break
      target.next[i]!.previous[i] = update[i] 
    }

    // Shrink currentLevel if necessary
    while (this.currentLevel > 0 && this.head.next[this.currentLevel - 1] === null) {
      this.currentLevel--
    }

    return value
  }

  /**
   * Iterates through the list in ascending order.
   */
  forEach(callback: (key: K, value: V) => void): void {
    let curr = this.head.next[0]
    while (curr) {
      callback(curr.key as K, curr.value as V)
      curr = curr.next[0]
    }
  }
}
