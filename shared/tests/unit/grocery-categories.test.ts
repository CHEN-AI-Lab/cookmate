import { describe, it, expect } from 'vitest';
import { isStaple, decomposeDishName, classifyIngredient, normalizeIngredientName } from '../../utils/grocery-categories';

describe('isStaple', () => {
  it('recognizes exact staple matches', () => {
    expect(isStaple('盐')).toBe(true);
  });

  it('recognizes derived forms (末/的/粉)', () => {
    expect(isStaple('盐末')).toBe(true);
  });

  it('returns false for non-staples', () => {
    expect(isStaple('西红柿')).toBe(false);
  });
});

describe('decomposeDishName', () => {
  it('returns the name itself when no mapping', () => {
    expect(decomposeDishName('神秘料理')).toEqual(['神秘料理']);
  });

  it('decomposes known dishes', () => {
    const result = decomposeDishName('番茄炒蛋饭');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('classifyIngredient', () => {
  it('classifies known Chinese ingredients', () => {
    const result = classifyIngredient('西红柿');
    expect(result).not.toBe('其他');
  });

  it('classifies known English ingredients', () => {
    const result = classifyIngredient('tomato');
    expect(result).not.toBe('其他');
  });

  it('falls back to 其他 for unknown', () => {
    expect(classifyIngredient('zzzqwerty')).toBe('其他');
  });
});

describe('normalizeIngredientName', () => {
  it('strips quantity suffixes', () => {
    expect(normalizeIngredientName('豆腐一块')).toBe('豆腐');
  });

  it('strips bracket weights', () => {
    expect(normalizeIngredientName('五花肉(300g)')).toBe('五花肉');
  });

  it('trims whitespace', () => {
    expect(normalizeIngredientName('  鸡蛋  ')).toBe('鸡蛋');
  });

  it('returns raw when nothing to strip', () => {
    expect(normalizeIngredientName('酱油')).toBe('酱油');
  });
});