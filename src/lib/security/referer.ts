/**
 * CSRF referer check for state-changing API requests.
 *
 * The referer's host must equal the request host exactly. The previous check used
 * `referer.includes(host)`, which accepted foreign pages whose URL merely contained
 * this host (e.g. https://evil.example/?www.willworkforlunch.com).
 * On a localhost dev server, a localhost or 127.0.0.1 referer on any port is accepted.
 */
export function isSameOriginReferer(referer: string | null, host: string | null): boolean {
  if (!referer || !host) return false;
  let refererHost: string;
  try {
    refererHost = new URL(referer).host;
  } catch {
    return false;
  }
  if (refererHost === host) return true;
  const isLocal = (name: string) => name === 'localhost' || name === '127.0.0.1';
  return isLocal(host.split(':')[0]) && isLocal(refererHost.split(':')[0]);
}
