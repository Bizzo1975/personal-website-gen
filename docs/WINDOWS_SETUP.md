# Windows Development Setup Guide

This guide provides comprehensive instructions for setting up the personal website project on Windows with Docker support and optimal performance.

## Prerequisites

### Required Software

1. **Windows 10/11** (Version 1903+ for WSL2 support)
2. **Docker Desktop for Windows** (with WSL2 backend)
3. **Windows Subsystem for Linux (WSL2)**
4. **Node.js 18+** (installed in WSL2)
5. **Git** (for version control)

### WSL2 Setup (Recommended)

For the best development experience on Windows, we recommend using WSL2:

```bash
# Install WSL2 (run in PowerShell as Administrator)
wsl --install

# Set WSL2 as default
wsl --set-default-version 2

# Install Ubuntu (or your preferred distribution)
wsl --install -d Ubuntu
```

## Port Configuration

The application uses the following ports:

- **Frontend (Next.js)**: `3006`
- **Backend API**: `4006` (if separate backend is added)
- **PostgreSQL Database**: `5436`
- **pgAdmin**: `8080` (optional, for database management)

## Installation Steps

### 1. Clone the Repository

```bash
# In WSL2 terminal
git clone <repository-url>
cd personal-website-gen
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp env.example .env.local
```

Update `.env.local` with your specific values:

```env
# Port Configuration
FRONTEND_PORT=3006
BACKEND_PORT=4006
DATABASE_PORT=5436

# Base URLs
FRONTEND_URL=http://localhost:3006
BACKEND_URL=http://localhost:4006
API_URL=http://localhost:3006/api

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_URL_INTERNAL=http://localhost:3006

# Windows & Docker specific settings
NEXT_WEBPACK_USEPOLLING=1
WATCHPACK_POLLING=true
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify cross-env is installed (for Windows compatibility)
npm list cross-env
```

## Development Options

### Option 1: Native Windows Development

```bash
# Start development server (Windows)
npm run dev:windows

# Or with mock data
npm run dev:mock:windows
```

### Option 2: Docker Development (Recommended)

```bash
# Start with Docker Compose
npm run dev:docker

# Or run in detached mode
npm run dev:docker:detached

# View logs
npm run docker:logs

# Stop containers
npm run docker:stop
```

### Option 3: WSL2 Development

```bash
# In WSL2 terminal
npm run dev:mock
```

## Windows-Specific Configurations

### Hot Module Reloading (HMR) Fix

The project includes Windows-specific configurations to fix HMR issues:

**next.config.js**:
```javascript
webpack(config, { dev }) {
  if (dev) {
    // Enable polling for Windows development
    if (process.env.NEXT_WEBPACK_USEPOLLING) {
      config.watchOptions = {
        poll: 500,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    // Additional Windows-specific optimizations
    if (process.platform === 'win32' || process.env.WATCHPACK_POLLING) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
  }
  return config;
}
```

### Docker Windows Optimizations

**docker-compose.override.yml** includes Windows-specific settings:
```yaml
services:
  frontend:
    environment:
      - NEXT_WEBPACK_USEPOLLING=1
      - WATCHPACK_POLLING=true
      - CHOKIDAR_USEPOLLING=true
      - CHOKIDAR_INTERVAL=1000
    volumes:
      - type: bind
        source: .
        target: /app
        consistency: cached
      - node_modules:/app/node_modules
      - next_cache:/app/.next
```

## Database Setup

### PostgreSQL with Docker

The project includes PostgreSQL setup via Docker:

```bash
# Start database only
docker-compose up postgres -d

# Access database via pgAdmin
# URL: http://localhost:8080
# Email: admin@example.com
# Password: admin
```

### MongoDB (Current Setup)

The project currently uses MongoDB. Update your `.env.local`:

```env
DATABASE_TYPE=mongodb
MONGODB_URI=your-mongodb-connection-string
DB_NAME=personal_website
```

## Troubleshooting

### Common Windows Issues

1. **HMR Not Working**
   - Ensure `NEXT_WEBPACK_USEPOLLING=1` is set
   - Use WSL2 for better file system compatibility

2. **Port Conflicts**
   - Check if ports 3006, 4006, 5436 are available
   - Use `netstat -an | findstr :3006` to check port usage

3. **Docker Performance**
   - Enable WSL2 backend in Docker Desktop
   - Store project files in WSL2 filesystem for better performance

4. **File Permissions**
   - Ensure proper permissions in WSL2
   - Use `chmod +x startup-all` for shell scripts

### Performance Optimization

1. **Use WSL2**: Store and run the project in WSL2 for better performance
2. **Docker Volumes**: Use named volumes for `node_modules` and `.next`
3. **File Polling**: Enable polling for file watching in Windows environments

## Available Scripts

```bash
# Development
npm run dev                    # Cross-platform development
npm run dev:windows           # Windows-specific development
npm run dev:mock:windows      # Windows development with mock data
npm run dev:docker            # Docker development

# Docker Management
npm run docker:stop           # Stop Docker containers
npm run docker:clean          # Clean Docker containers and volumes
npm run docker:logs           # View Docker logs
npm run docker:shell          # Access container shell

# Testing
npm run test                  # Run unit tests
npm run test:e2e             # Run end-to-end tests
npm run test:e2e:docker      # Run E2E tests with Docker

# Production
npm run build                # Build for production
npm run start:windows        # Start production server (Windows)
```

## Best Practices

1. **Use WSL2** for the best development experience
2. **Enable file polling** when using Docker on Windows
3. **Store project files** in WSL2 filesystem, not Windows filesystem
4. **Use Docker Desktop** with WSL2 backend enabled
5. **Monitor resource usage** and adjust Docker settings as needed

## Support

For Windows-specific issues:
1. Check the troubleshooting section above
2. Ensure WSL2 is properly configured
3. Verify Docker Desktop is using WSL2 backend
4. Check that all required ports are available

## Additional Resources

- [WSL2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/)
- [Next.js on Windows](https://nextjs.org/docs/getting-started/installation)
- [Node.js on WSL2](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) 