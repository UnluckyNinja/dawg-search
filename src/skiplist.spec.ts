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

    expect(sl.delete(1)).toBe(true)
    expect(sl.search(1)).toBeUndefined()
    expect(sl.search(2)).toBe('two')

    expect(sl.delete(3)).toBe(false)
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
    expect(sl.delete(1)).toBe(false)
    
    let count = 0
    sl.forEach(() => count++)
    expect(count).toBe(0)
  })
})
