import { describe, expect, it } from 'vitest';
import { applyInternalParam, shouldIgnore, trackerEndpoint } from '../src/tracking.ts';

const prod = { prod: true, deployEnv: 'production', internal: false };

describe('shouldIgnore', () => {
  it('tracks production builds on the production deployment', () => {
    expect(shouldIgnore(prod)).toBe(false);
  });

  it('tracks production builds made outside Vercel', () => {
    expect(shouldIgnore({ ...prod, deployEnv: '' })).toBe(false);
  });

  it('ignores dev builds', () => {
    expect(shouldIgnore({ ...prod, prod: false })).toBe(true);
  });

  it('ignores Vercel preview and development deployments', () => {
    expect(shouldIgnore({ ...prod, deployEnv: 'preview' })).toBe(true);
    expect(shouldIgnore({ ...prod, deployEnv: 'development' })).toBe(true);
  });

  it('ignores browsers opted out with ?internal=1', () => {
    expect(shouldIgnore({ ...prod, internal: true })).toBe(true);
  });

  it('ignores everything when VITE_TRACKER_ENDPOINT is off', () => {
    for (const off of ['off', 'OFF', 'false', 'disabled', ' off ']) {
      expect(shouldIgnore({ ...prod, trackerEndpoint: off })).toBe(true);
    }
  });
});

describe('trackerEndpoint', () => {
  it('defaults to /api/collect', () => {
    expect(trackerEndpoint(undefined)).toBe('/api/collect');
    expect(trackerEndpoint('  ')).toBe('/api/collect');
  });

  it('passes a custom endpoint through', () => {
    expect(trackerEndpoint('https://stats.example.com/api/collect')).toBe('https://stats.example.com/api/collect');
  });

  it('returns null when disabled', () => {
    expect(trackerEndpoint('off')).toBeNull();
  });
});

describe('applyInternalParam', () => {
  const storage = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };

  it('opts in, persists, and opts back out', () => {
    const s = storage();
    expect(applyInternalParam('', s)).toBe(false);
    expect(applyInternalParam('?internal=1', s)).toBe(true);
    expect(applyInternalParam('?to=someone', s)).toBe(true);
    expect(applyInternalParam('?internal=0', s)).toBe(false);
    expect(applyInternalParam('?internal=true', s)).toBe(true);
    expect(applyInternalParam('?internal=false', s)).toBe(false);
  });
});
