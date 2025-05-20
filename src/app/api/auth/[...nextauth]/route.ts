import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/auth";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 Auth attempt for:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        try {
          const user = await getUserByEmail(credentials.email);
          if (!user) {
            console.log("❌ User not found:", credentials.email);
            return null;
          }

          console.log("👤 User found:", user.email, "with ID:", user._id);

          const isValid = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.log("❌ Invalid password for:", credentials.email);
            return null;
          }

          console.log("✅ Authentication successful for:", credentials.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("⚠️ Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("🔑 Creating JWT for user:", user.email);
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        console.log("🔄 Creating session for user with role:", token.role);
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
