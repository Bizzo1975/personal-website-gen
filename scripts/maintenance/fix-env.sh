#!/bin/bash

# Generate a new NEXTAUTH_SECRET
NEW_SECRET=$(openssl rand -hex 32)

# Create a new .env.local file with proper formatting
cat > .env.local << EOF
# MongoDB - Fixed URI without linebreaks
MONGODB_URI=mongodb+srv://webuidb:Skyler01@cluster0.7us70qf.mongodb.net/?retryWrites=true&w=majority

# NextAuth configuration
NEXTAUTH_SECRET=${NEW_SECRET}
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000
EOF

echo "✅ .env.local file updated with a new NEXTAUTH_SECRET"
echo "✅ MongoDB URI has been fixed"

# Restart the development server - uncomment this if needed
# echo "Restarting the development server..."
# npm run dev 