import { describe, it, expect } from 'vitest'

// Import the grocery categories module
import { CATEGORIES, getCategoryByName } from '../../lib/grocery-categories'

describe('CATEGORIES', () => {
  it('has predefined categories', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true)
    expect(CATEGORIES.length).toBeGreaterThan(0)
  })

  it('each category has a name and items', () => {
    for (const cat of CATEGORIES) {
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('items')
      expect(Array.isArray(cat.items)).toBe(true)
    }
  })
})

describe('getCategoryByName', () => {
  it('returns a category by name', () => {
    if (CATEGORIES.length > 0) {
      const first = CATEGORIES[0]
      const found = getCategoryByName(first.name)
      expect(found).toEqual(first)
    }
  })

  it('returns undefined for unknown name', () => {
    expect(getCategoryByName('non_existent_category')).toBeUndefined()
  })
})
