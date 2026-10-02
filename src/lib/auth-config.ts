import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import {
  KECKTECH_PROVIDER_ID,
  kecktechSsoProviders,
  resolveSsoAdmin,
  ssoAccountAllowed,
} from '@/lib/kecktech-sso';

/**
 * Authenticate user with email and password
 */
async function authenticateUser(email: string, password: string): Promise<any | null> {
  try {
    const result = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authenticateUser(
          credentials.email as string,
          credentials.password as string
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }),
    ...kecktechSsoProviders()
  ],
  pages: {
    signIn: '/admin/login',
    signOut: '/admin/login', 
    error: '/admin/login'
  },
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      // Kecktech SSO: only allowed LLDAP groups (default kecktech_admins) may use it.
      if (account?.provider !== KECKTECH_PROVIDER_ID) return true;
      return ssoAccountAllowed(account);
    },
    async jwt({ token, user, account }) {
      if (account?.provider === KECKTECH_PROVIDER_ID) {
        // Link the SSO admin to this site's existing admin account.
        const admin = await resolveSsoAdmin(query as never);
        if (!admin) {
          token.role = undefined;
          return token;
        }
        token.sub = String(admin.id);
        token.email = admin.email;
        token.role = admin.role;
        return token;
      }
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.role) {
        session.user.role = token.role as string;
      }
      return session;
    }
  }
}; 
