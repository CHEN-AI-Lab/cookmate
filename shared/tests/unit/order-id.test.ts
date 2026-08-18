import { describe, it, expect } from 'vitest';
import { generateOrderId } from '../../utils/order-id';

describe('generateOrderId', () => {
  it('prefixes with CK + channel prefix', () => {
    expect(generateOrderId('alipay')).toMatch(/^CKAL\d{8}[0-9A-F]{8}$/);
    expect(generateOrderId('creem')).toMatch(/^CKCR\d{8}[0-9A-F]{8}$/);
    expect(generateOrderId('stripe')).toMatch(/^CKST\d{8}[0-9A-F]{8}$/);
  });

  it('uses XX prefix for unknown channels', () => {
    expect(generateOrderId('unknown')).toMatch(/^CKXX\d{8}[0-9A-F]{8}$/);
  });

  it('contains today\'s date', () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    expect(generateOrderId('stripe')).toContain(`${y}${m}${day}`);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId('stripe')));
    expect(ids.size).toBe(100);
  });
});