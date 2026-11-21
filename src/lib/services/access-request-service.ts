import { query } from '@/lib/db';

/**
 * Per-user access flags managed from Admin > Users.
 * W46: request handling (submit, list, approve/reject) lives in lib/access-requests/service.ts.
 * Removed from here: create/list/stats duplicates, and updateStatus, whose BEGIN/COMMIT ran
 * on whatever pool connection each query got, so it was never a transaction.
 */
type Level = 'professional' | 'personal';
const column = (level: Level) => (level === 'professional' ? 'has_professional_access' : 'has_personal_access');
const norm = (email: string) => email.trim().toLowerCase();

export class AccessRequestService {
  /** Adds one level; the other level is left as it is. */
  static async grantAccess(email: string, level: Level, adminId: string): Promise<void> {
    await query(
      `INSERT INTO user_access_levels (email, has_professional_access, has_personal_access, granted_at, granted_by, is_active)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, true)
       ON CONFLICT (email) DO UPDATE SET ${column(level)} = true, granted_at = CURRENT_TIMESTAMP,
         granted_by = EXCLUDED.granted_by, is_active = true`,
      [norm(email), level === 'professional', level === 'personal', adminId]
    );
  }

  static async revokeAccess(email: string, level: Level): Promise<void> {
    await query(`UPDATE user_access_levels SET ${column(level)} = false WHERE email = $1`, [norm(email)]);
  }

  static async activateUser(email: string): Promise<void> {
    await query('UPDATE user_access_levels SET is_active = true WHERE email = $1', [norm(email)]);
  }

  static async deactivateUser(email: string): Promise<void> {
    await query('UPDATE user_access_levels SET is_active = false WHERE email = $1', [norm(email)]);
  }
}
