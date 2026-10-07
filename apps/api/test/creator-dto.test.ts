import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

const FORBIDDEN_KEYS = [
  'creatorShareBps',
  'grossPaise',
  'platformSharePaise',
  'gross',
  'platform',
];

function scanForForbiddenKeys(obj: any, path: string = ''): string[] {
  const violations: string[] = [];
  if (!obj || typeof obj !== 'object') return violations;

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      violations.push(...scanForForbiddenKeys(item, `${path}[${idx}]`));
    });
    return violations;
  }

  for (const key of Object.keys(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_KEYS.includes(key)) {
      violations.push(`Forbidden key "${key}" found at path "${currentPath}"`);
    }
    violations.push(...scanForForbiddenKeys(obj[key], currentPath));
  }

  return violations;
}

describe('Creator API Security Scanner (Addendum B1)', () => {
  it('GET /api/creator/earnings contains no forbidden financial leakage fields', async () => {
    const res = await request(app).get('/api/creator/earnings');
    expect(res.status).toBe(200);
    const violations = scanForForbiddenKeys(res.body);
    expect(violations).toEqual([]);
  });

  it('GET /api/creator/payouts contains no forbidden financial leakage fields', async () => {
    const res = await request(app).get('/api/creator/payouts');
    expect(res.status).toBe(200);
    const violations = scanForForbiddenKeys(res.body);
    expect(violations).toEqual([]);
  });

  it('GET /api/creator/supporters contains no forbidden financial leakage fields or contribution amounts', async () => {
    const res = await request(app).get('/api/creator/supporters');
    expect(res.status).toBe(200);
    const violations = scanForForbiddenKeys(res.body);
    expect(violations).toEqual([]);
    
    // Check that amount / paise is not in supporter item
    if (res.body.supporters && res.body.supporters.length > 0) {
      expect(res.body.supporters[0].amountInr).toBeUndefined();
      expect(res.body.supporters[0].amountPaise).toBeUndefined();
    }
  });
});
