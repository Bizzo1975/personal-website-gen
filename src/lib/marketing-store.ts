import { query, getClient } from "@/lib/db";
import type { Store, Sql } from "./marketing/receiver";
const pgSql = (s: string) => { let index = 0; return s.replace(/\?/g, () => `$${++index}`); };
export const marketingStore: Store = {
  target: "wwfl",
  read: async (s, p = []) => (await query(pgSql(s), p)).rows,
  transaction: async work => {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      // Serialize short receiver commits, including first reservations, without network work inside the transaction.
      await client.query("SELECT pg_advisory_xact_lock(77432219)");
      const sql: Sql = { rows: async (s, p = []) => (await client.query(pgSql(s), p)).rows, run: async (s, p = []) => { await client.query(pgSql(s), p); } };
      const result = await work(sql); await client.query("COMMIT"); return result;
    } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
  },
};
