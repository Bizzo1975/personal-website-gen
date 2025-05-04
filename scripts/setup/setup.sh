#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting comprehensive website setup and repair...${NC}"

# Check if .env.local exists, create if not
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}Creating .env.local file...${NC}"
  NEW_SECRET=$(openssl rand -hex 32)
  cat > .env.local << EOF
# MongoDB - Fixed URI without linebreaks
MONGODB_URI=mongodb+srv://webuidb:Skyler01@cluster0.7us70qf.mongodb.net/?retryWrites=true&w=majority

# NextAuth configuration
NEXTAUTH_SECRET=${NEW_SECRET}
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000
EOF
  echo -e "${GREEN}.env.local created successfully!${NC}"
else
  echo -e "${GREEN}.env.local already exists.${NC}"
  echo -e "${YELLOW}Fixing any formatting issues...${NC}"
  NEW_SECRET=$(openssl rand -hex 32)
  cat > .env.local.new << EOF
# MongoDB - Fixed URI without linebreaks
MONGODB_URI=mongodb+srv://webuidb:Skyler01@cluster0.7us70qf.mongodb.net/?retryWrites=true&w=majority

# NextAuth configuration
NEXTAUTH_SECRET=${NEW_SECRET}
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000
EOF
  mv .env.local.new .env.local
  echo -e "${GREEN}.env.local updated!${NC}"
fi

# Clear Next.js cache
echo -e "${YELLOW}Clearing Next.js cache...${NC}"
rimraf .next
echo -e "${GREEN}Cache cleared!${NC}"

# Check and fix SVG assets
echo -e "${YELLOW}Checking background SVG assets...${NC}"
mkdir -p public
if [ ! -f public/grid-light.svg ] || [ ! -f public/grid-dark.svg ]; then
  echo -e "${YELLOW}Creating SVG background assets...${NC}"
  cat > public/grid-light.svg << EOF
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
  <path d="M50 0 L50 100 M0 50 L100 50" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
</svg>
EOF

  cat > public/grid-dark.svg << EOF
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="none" stroke="#222222" stroke-width="0.5"/>
  <path d="M50 0 L50 100 M0 50 L100 50" fill="none" stroke="#222222" stroke-width="0.5"/>
</svg>
EOF
  echo -e "${GREEN}SVG assets created!${NC}"
else
  echo -e "${GREEN}SVG assets already exist.${NC}"
fi

# Check NextAuth API routes
echo -e "${YELLOW}Checking NextAuth API routes...${NC}"
NEXTAUTH_DIR="src/app/api/auth/[...nextauth]"
if [ ! -d "$NEXTAUTH_DIR" ]; then
  echo -e "${YELLOW}Creating NextAuth API directory...${NC}"
  mkdir -p "$NEXTAUTH_DIR"
fi

# Ensure the NextAuth route file is correct
echo -e "${YELLOW}Creating or updating NextAuth API route...${NC}"
cat > "${NEXTAUTH_DIR}/route.ts" << 'EOF'
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
echo -e "${GREEN}NextAuth API route updated!${NC}"

# Reset and seed the database
echo -e "${YELLOW}Resetting and seeding the database...${NC}"
node -r dotenv/config src/lib/seed-data.js
echo -e "${GREEN}Database seeded!${NC}"

# Install dependencies in case any are missing
echo -e "${YELLOW}Ensuring all dependencies are installed...${NC}"
npm install

echo -e "${GREEN}Setup complete! Now run:${NC}"
echo -e "npm run dev" 