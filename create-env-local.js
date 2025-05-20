const fs = require('fs');
const path = require('path');

// Environment variables content
const envContent = `# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/personal-website?retryWrites=true&w=majority

# NextAuth.js
NEXTAUTH_SECRET=6320d8efb1e89384372387e68d801b8b2e34f6056074f09b90f256bd70cd4f6a
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# NOTE: Replace <username>, <password>, and <cluster> with your actual MongoDB Atlas credentials
# For production, generate a different NEXTAUTH_SECRET and update NEXTAUTH_URL
`;

// Write the file
fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
console.log('.env.local file created successfully!');
console.log('Remember to replace <username>, <password>, and <cluster> with your actual MongoDB credentials.'); 