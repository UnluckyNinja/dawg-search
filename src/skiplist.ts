/**
 * SkipNode represents a node in the SkipList.
 */
interface SkipNode<K, V> {
  key: K | null
  value: V | null
  next: (SkipNode<K, V> | null)[]
}

/**
 * SkipList implementation in TypeScript.
 * Provides O(log n) average time complexity for search, insert, and delete.
 */
export class SkipList<K, V> {
  private head: SkipNode<K, V>
  private maxLevel: number
  private currentLevel: number
  private p: number

  /**
   * @param compare A function to compare two keys. Returns < 0 if a < b, 0 if a == b, > 0 if a > b.
   * @param maxLevel Maximum height of the skip list. Defaults to 16.
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
    this.head = { key: null, value: null, next: new Array(maxLevel).fill(null) }
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
  insert(key: K, value: V): void {
    const update = new Array<SkipNode<K, V>>(this.maxLevel).fill(this.head)
    let curr = this.head

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
      return
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
      next: new Array(lvl).fill(null)
    }

    for (let i = 0; i < lvl; i++) {
      newNode.next[i] = update[i].next[i]
      update[i].next[i] = newNode
    }
  }

  /**
   * Finds the value associated with the given key.
   */
  search(key: K): V | undefined {
    let curr = this.head
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
   * Removes a key from the list. Returns true if the key was found and removed.
   */
  delete(key: K): boolean {
    const update = new Array<SkipNode<K, V>>(this.maxLevel).fill(this.head)
    let curr = this.head

    for (let i = this.currentLevel - 1; i >= 0; i--) {
      while (curr.next[i] && this.compare(curr.next[i]!.key as K, key) < 0) {
        curr = curr.next[i]!
      }
      update[i] = curr
    }

    const target = curr.next[0]
    if (!target || target.key === null || this.compare(target.key as K, key) !== 0) {
      return false
    }

    // Update pointers at each level
    for (let i = 0; i < this.currentLevel; i++) {
      if (update[i].next[i] !== target) break
      update[i].next[i] = target.next[i]
    }

    // Shrink currentLevel if necessary
    while (this.currentLevel > 0 && this.head.next[this.currentLevel - 1] === null) {
      this.currentLevel--
    }

    return true
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
