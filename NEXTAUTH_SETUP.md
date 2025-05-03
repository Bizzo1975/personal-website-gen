# NextAuth Setup Guide

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/personal-website?retryWrites=true&w=majority

# NextAuth.js
NEXTAUTH_SECRET=6320d8efb1e89384372387e68d801b8b2e34f6056074f09b90f256bd70cd4f6a
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# For production (when you deploy)
# NEXTAUTH_URL=https://your-production-domain.com
```

Replace:
- The MongoDB connection string with your actual credentials
- The NEXTAUTH_SECRET with the generated secure key shown above
- The NEXTAUTH_URL with your production URL when deploying

## Important Notes

1. **Security**: 
   - Keep your `.env.local` file secure and never commit it to version control
   - The NEXTAUTH_SECRET is used to encrypt cookies and tokens
   - Generate a different secret for production environments

2. **Local Development**:
   - For local development, NEXTAUTH_URL should be http://localhost:3000
   - NEXTAUTH_URL_INTERNAL helps when running in environments like Docker

3. **Production**:
   - In production, NEXTAUTH_URL should be your deployed URL
   - Make sure to update this in your deployment platform's environment variables

## Testing the Configuration

After setting up your environment variables, you can test if they're properly configured by:

1. Running the development server: `npm run dev`
2. Navigating to the login page: http://localhost:3000/admin/login
3. Testing authentication with the admin credentials:
   - Email: admin@example.com
   - Password: admin12345 (from the seed data)

## Troubleshooting

If you encounter issues:

- Make sure the NEXTAUTH_SECRET is properly set
- Check that NEXTAUTH_URL matches your actual URL
- Verify your MongoDB connection is working
- Ensure the NextAuth dependencies are installed correctly

## Additional Configuration (Optional)

For advanced configuration, you can add these variables:

```
# JWT Configuration
JWT_SECRET=another-secret-key-for-jwt-tokens

# OAuth Providers (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Provider (if using)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com
``` 