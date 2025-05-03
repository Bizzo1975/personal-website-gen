# MongoDB Setup for Personal Website

## Prerequisites
- Node.js and npm installed
- MongoDB Atlas account (free tier works fine)

## Setup Steps

### 1. Create MongoDB Atlas Account
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- Create a new organization if needed

### 2. Create a Cluster
- Click "Build a Database"
- Choose the free tier (M0)
- Select your preferred provider and region
- Name your cluster (e.g., "personal-website")
- Click "Create Cluster"

### 3. Set Up Security
- Create a database user:
  - Go to "Database Access" → "Add New Database User"
  - Create a username and secure password
  - Set privileges to "Atlas admin"
  - Click "Add User"
- Configure network access:
  - Go to "Network Access" → "Add IP Address"
  - Add your development machine's IP or use "0.0.0.0/0" for all IPs (not recommended for production)
  - Click "Confirm"

### 4. Get Your Connection String
- Click "Connect" on your cluster
- Choose "Connect your application"
- Select Node.js as the driver
- Copy the connection string

### 5. Configure Environment Variables
- Create a `.env.local` file in your project root
- Add your MongoDB connection string:
  ```
  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/personal-website?retryWrites=true&w=majority
  NEXTAUTH_SECRET=your-nextauth-secret-key
  NEXTAUTH_URL=http://localhost:3000
  ```
- Replace `<username>`, `<password>`, and `<cluster>` with your actual values

### 6. Test the Connection
- Run the test script: `node --env-file=.env.local test-db-connection.js`
- You should see "Connected to MongoDB successfully!" if everything is working

### 7. Initialize the Database (Optional)
- Run the seed script to populate your database with sample data:
  ```
  node --env-file=.env.local src/lib/seed-data.js
  ```
- This will create a test admin user with:
  - Email: admin@example.com
  - Password: admin12345

### 8. Run Your Application
- Start the development server: `npm run dev`
- Your application should now be connected to MongoDB

## Troubleshooting
- If you see connection errors, check that:
  - Your IP is whitelisted in MongoDB Atlas
  - Your username and password are correct in the connection string
  - Network/firewall isn't blocking the connection
  - The connection string format is correct 