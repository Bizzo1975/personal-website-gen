/**
 * Kecktech SSO for NextAuth v4 apps (OPS-BE SSO-3).
 *
 * Adds an OpenID Connect provider ("kecktech") backed by Authelia at
 * https://auth.kecktech.net. Only members of the allowed LLDAP groups
 * (default kecktech_admins) may sign in; they are linked to this app's
 * existing admin user (KECKTECH_SSO_LINK_EMAIL, or the first admin by id),
 * so data ownership and the role check are unchanged.
 *
 * Env: KECKTECH_SSO_CLIENT_ID, KECKTECH_SSO_CLIENT_SECRET (required to enable)
 *      KECKTECH_SSO_ISSUER (default https://auth.kecktech.net)
 *      KECKTECH_SSO_GROUPS (default kecktech_admins)
 *      KECKTECH_SSO_LINK_EMAIL (optional)
 */
type Row = { id: number | string; email: string; role: string; name?: string | null };
type QueryFn = (sql: string, params?: unknown[]) => Promise<{ rows: Row[] }>;

export const KECKTECH_PROVIDER_ID = "kecktech";

export function kecktechSsoEnabled(): boolean {
  return Boolean(process.env.KECKTECH_SSO_CLIENT_ID && process.env.KECKTECH_SSO_CLIENT_SECRET);
}

export function kecktechSsoProviders(): any[] {
  if (!kecktechSsoEnabled()) return [];
  const issuer = (process.env.KECKTECH_SSO_ISSUER || "https://auth.kecktech.net").replace(/\/$/, "");
  return [
    {
      id: KECKTECH_PROVIDER_ID,
      name: "Kecktech SSO",
      type: "oauth",
      wellKnown: `${issuer}/.well-known/openid-configuration`,
      clientId: process.env.KECKTECH_SSO_CLIENT_ID,
      clientSecret: process.env.KECKTECH_SSO_CLIENT_SECRET,
      authorization: { params: { scope: "openid profile email groups" } },
      checks: ["pkce", "state"],
      // Authelia returns an id_token for the openid scope; its claims are minimal,
      // so group membership is read from userinfo in ssoAccountAllowed().
      idToken: true,
      client: { token_endpoint_auth_method: "client_secret_basic" },
      profile(p: any) {
        return {
          id: String(p.sub),
          email: p.email ?? null,
          name: p.name ?? p.preferred_username ?? null,
          groups: Array.isArray(p.groups) ? p.groups : [],
        };
      },
    },
  ];
}

export function ssoGroupsAllowed(groups: unknown): boolean {
  const allowed = (process.env.KECKTECH_SSO_GROUPS || "kecktech_admins")
    .split(",").map((g) => g.trim()).filter(Boolean);
  return Array.isArray(groups) && groups.some((g) => allowed.includes(String(g)));
}

/** Group check against Authelia userinfo, using the access token from the sign-in. */
export async function ssoAccountAllowed(account: { access_token?: string } | null | undefined): Promise<boolean> {
  if (!account?.access_token) return false;
  const issuer = (process.env.KECKTECH_SSO_ISSUER || "https://auth.kecktech.net").replace(/\/$/, "");
  try {
    const r = await fetch(`${issuer}/api/oidc/userinfo`, {
      headers: { authorization: `Bearer ${account.access_token}` },
      cache: "no-store",
    });
    if (!r.ok) return false;
    const info = (await r.json()) as { groups?: unknown };
    return ssoGroupsAllowed(info.groups);
  } catch {
    return false;
  }
}

/** The local admin account an SSO admin is linked to (null = deny). */
export async function resolveSsoAdmin(query: QueryFn): Promise<Row | null> {
  const link = process.env.KECKTECH_SSO_LINK_EMAIL;
  const res = link
    ? await query("SELECT id, email, role FROM users WHERE lower(email) = lower($1) AND role = 'admin'", [link])
    : await query("SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY id LIMIT 1", []);
  return res.rows[0] ?? null;
}
