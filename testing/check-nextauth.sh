#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking NextAuth API route structure...${NC}"

NEXTAUTH_DIR="src/app/api/auth/[...nextauth]"
ROUTE_FILE="$NEXTAUTH_DIR/route.ts"

if [ -d "$NEXTAUTH_DIR" ] && [ -f "$ROUTE_FILE" ]; then
  echo -e "${GREEN}✅ NextAuth API route exists at the correct location.${NC}"
  echo -e "Path: $ROUTE_FILE"
else
  echo -e "${RED}❌ NextAuth API route is missing or in the wrong location!${NC}"
  
  # Create the directory if it doesn't exist
  if [ ! -d "$NEXTAUTH_DIR" ]; then
    echo -e "${YELLOW}Creating directory: $NEXTAUTH_DIR${NC}"
    mkdir -p "$NEXTAUTH_DIR"
  fi
  
  # Create the route file if it doesn't exist
  if [ ! -f "$ROUTE_FILE" ]; then
    echo -e "${YELLOW}Creating NextAuth route file: $ROUTE_FILE${NC}"
    cat > "$ROUTE_FILE" << 'EOF'
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
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) {
          console.log("User not found:", credentials.email);
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          console.log("Invalid password for:", credentials.email);
          return null;
        }

        console.log("Authentication successful for:", credentials.email);
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
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
EOF
    echo -e "${GREEN}✅ NextAuth route file created successfully${NC}"
  fi
fi

echo -e "\n${YELLOW}Checking NextAuth environment variables...${NC}"
if grep -q "NEXTAUTH_SECRET" .env.local && grep -q "NEXTAUTH_URL" .env.local; then
  echo -e "${GREEN}✅ NextAuth environment variables are defined in .env.local${NC}"
else
  echo -e "${RED}❌ NextAuth environment variables are missing in .env.local${NC}"
  echo -e "${YELLOW}Please run the fix-env.sh script to update your environment variables${NC}"
fi

echo -e "\n${GREEN}Check completed. Run the following to restart your server:${NC}"
echo -e "npm run dev" 