import { describe, test, expect } from 'vitest'

describe('Simple Test Suite', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  test('should test array operations', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr).toContain(2)
  })

  test('should test object properties', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(42)
  })
})