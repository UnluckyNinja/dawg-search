import { describe, it, expect } from 'vitest'
import { SkipList } from './skiplist'

describe('SkipList', () => {
  const compareNumber = (a: number, b: number) => a - b

  it('should insert and search values correctly', () => {
    const sl = new SkipList<number, string>(compareNumber)
    sl.insert(1, 'one')
    sl.insert(3, 'three')
    sl.insert(2, 'two')

    expect(sl.search(1)).toBe('one')
    expect(sl.search(2)).toBe('two')
    expect(sl.search(3)).toBe('three')
    expect(sl.search(4)).toBeUndefined()
  })

  it('should update value for existing key', () => {
    const sl = new SkipList<number, string>(compareNumber)
    sl.insert(1, 'one')
    sl.insert(1, 'uno')

    expect(sl.search(1)).toBe('uno')
  })

  it('should delete keys correctly', () => {
    const sl = new SkipList<number, string>(compareNumber)
    sl.insert(1, 'one')
    sl.insert(2, 'two')

    expect(sl.delete(1)).toBe('one')
    expect(sl.search(1)).toBeUndefined()
    expect(sl.search(2)).toBe('two')

    expect(sl.delete(3)).toBe(undefined)
  })

  it('should handle deletion of all keys and shrink level', () => {
    const sl = new SkipList<number, string>(compareNumber)
    sl.insert(1, 'one')
    sl.insert(100, 'hundred')

    sl.delete(1)
    sl.delete(100)

    expect(sl.search(1)).toBeUndefined()
    expect(sl.search(100)).toBeUndefined()
  })

  it('should iterate in ascending order using forEach', () => {
    const sl = new SkipList<number, number>(compareNumber)
    const input = [5, 1, 8, 3, 2]
    input.forEach(n => sl.insert(n, n * 10))

    const result: number[] = []
    sl.forEach((key) => {
      result.push(key)
    })

    expect(result).toEqual([1, 2, 3, 5, 8])
  })

  it('should work with string keys', () => {
    const compareString = (a: string, b: string) => a.localeCompare(b)
    const sl = new SkipList<string, number>(compareString)

    sl.insert('apple', 1)
    sl.insert('banana', 2)
    sl.insert('cherry', 3)

    expect(sl.search('banana')).toBe(2)
    expect(sl.search('date')).toBeUndefined()
    
    sl.delete('banana')
    expect(sl.search('banana')).toBeUndefined()
  })

  it('should handle empty list operations', () => {
    const sl = new SkipList<number, string>(compareNumber)
    expect(sl.search(1)).toBeUndefined()
    expect(sl.delete(1)).toBe(undefined)
    
    let count = 0
    sl.forEach(() => count++)
    expect(count).toBe(0)
  })

  it('should find the first matching element using a custom comparator', () => {
    const sl = new SkipList<number, string>(compareNumber)
    sl.insert(10, '10')
    sl.insert(20, '20-1')
    sl.insert(20, '20-2')
    sl.insert(21, '21')
    sl.insert(22, '22')
    sl.insert(30, '30')

    // Find the first key that is >= 20
    const it = sl.findFirst((k) => {
      if (k < 20) return -1
      if (k >= 20 && k < 30) return 0
      return 1
    })

    expect(it).toBeDefined()
    expect(it?.key).toBe(20)
    expect(it?.value).toBe('20-2') // The last one inserted for key 20

    // Test iteration from there
    const next = it?.next()
    expect(next?.key).toBe(21)
    expect(next?.value).toBe('21')
    
    const next2 = next?.next()
    expect(next2?.key).toBe(22)

  })

  it('iterator functions', () => {

    const sl = new SkipList<number, string>(compareNumber)
    sl.insert(10, '10')
    sl.insert(20, '20-1')
    sl.insert(20, '20-2')
    sl.insert(21, '21')
    sl.insert(22, '22')
    sl.insert(30, '30')

    // edge case
    const head = sl.findFirst((k) => {
      return k-10
    })
    expect(head).toBeDefined()
    expect(head?.key).toBe(10)
    expect(head?.value).toBe('10')
    const tail = sl.findFirst((k) => {
      return k-30
    })
    expect(tail).toBeDefined()
    expect(tail?.key).toBe(30)
    expect(tail?.value).toBe('30')
    const nil = sl.findFirst((k) => {
      return k-25
    })
    expect(nil).toBeUndefined()
    const nilhead = sl.findFirst((k) => {
      return k-0
    })
    expect(nilhead).toBeUndefined()

    // test Iterator remove
    const itor = sl.findFirst((k) => {
      return k-21
    })
    itor?.remove()
    const otherItor = sl.findFirst((k)=>{
      return k-20
    })
    expect(otherItor?.next()?.key).toBe(22)
  })

  it('should return the leftmost item when multiple items satisfy the condition', () => {
    const sl = new SkipList<string, number>((a, b) => a.localeCompare(b))
    sl.insert('apple', 1)
    sl.insert('apply', 2)
    sl.insert('ball', 3)
    sl.insert('bat', 4)
    sl.insert('cat', 5)

    // Find first word starting with 'ba'
    const it = sl.findFirst((k) => {
      if (k < 'ba') return -1
      if (k.startsWith('ba')) return 0
      return 1
    })

    expect(it?.key).toBe('ball')
    expect(it?.value).toBe(3)
    
    const next = it?.next()
    expect(next?.key).toBe('bat')
    expect(next?.value).toBe(4)
    
    const next2 = next?.next()
    expect(next2?.key).toBe('cat')
  })
})
