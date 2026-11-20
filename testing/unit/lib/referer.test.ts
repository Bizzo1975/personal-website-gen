/**
 * @jest-environment node
 */
import { isSameOriginReferer } from '@/lib/security/referer';

describe('isSameOriginReferer (W13 CSRF check)', () => {
  const host = 'www.willworkforlunch.com';

  it('accepts a same-host referer', () => {
    expect(isSameOriginReferer('https://www.willworkforlunch.com/admin/posts', host)).toBe(true);
  });

  it('rejects a foreign referer that only contains the host in its URL', () => {
    expect(isSameOriginReferer('https://evil.example/?www.willworkforlunch.com', host)).toBe(false);
    expect(isSameOriginReferer('https://www.willworkforlunch.com.evil.example/', host)).toBe(false);
  });

  it('rejects a different subdomain of the same site', () => {
    expect(isSameOriginReferer('https://me.willworkforlunch.com/', host)).toBe(false);
  });

  it('rejects missing or malformed referers', () => {
    expect(isSameOriginReferer(null, host)).toBe(false);
    expect(isSameOriginReferer('not a url', host)).toBe(false);
    expect(isSameOriginReferer('https://www.willworkforlunch.com/', null)).toBe(false);
  });

  it('accepts localhost referers only when the host is localhost', () => {
    expect(isSameOriginReferer('http://127.0.0.1:3106/admin', 'localhost:3106')).toBe(true);
    expect(isSameOriginReferer('http://localhost:3000/', host)).toBe(false);
  });
});
