import { describe, expect, it } from 'vitest';
import admin from '../api/admin.ts';
import collect from '../api/collect.ts';

// The two Vercel Functions are one-line re-exports of Dossier's handlers.
describe('api functions', () => {
  it('export Web-standard fetch handlers', () => {
    expect(typeof collect.fetch).toBe('function');
    expect(typeof admin.fetch).toBe('function');
  });

  it('serve the tracker script on GET /api/collect', async () => {
    const res = await collect.fetch(new Request('http://localhost/api/collect'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/javascript/);
  });
});
