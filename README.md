# Personal Website Generator

A modern, responsive personal website built with Next.js, TypeScript, and Tailwind CSS. This website serves as a portfolio, blog, and project showcase with a comprehensive admin system for content management.

## Features

- **Modern Design**: Clean, responsive design with dark/light mode support
- **Blog System**: Full-featured blog with MDX support, categories, and tags
- **Project Showcase**: Portfolio section with project details and live demos
- **Admin Dashboard**: Complete content management system
- **Authentication**: Secure admin authentication with NextAuth.js
- **SEO Optimized**: Built-in SEO optimization with meta tags and structured data
- **Performance**: Optimized for Core Web Vitals and fast loading
- **Accessibility**: WCAG compliant with proper semantic HTML
- **Testing**: Comprehensive test suite with Jest and Cypress
- **Docker Support**: Full containerization with Windows optimizations

## Tech Stack

- **Frontend Framework**: Next.js 15.4.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark/light mode
- **Content Management**: MDX for blog posts
- **Database**: PostgreSQL with pg
- **Authentication**: NextAuth.js 4.24.11
- **Testing**: Jest for unit tests, Cypress for E2E tests
- **Containerization**: Docker with Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Digital Ocean with CloudFlare

## Port Configuration

The application uses the following ports:

- **Frontend (Next.js)**: `3006`

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (for database functionality) OR use Docker for containerized development
- GitHub account (for project integration)
- Docker Desktop (recommended, for containerized development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/personal-website.git
cd personal-website
```

2. Install the dependencies:

```bash
npm install
```

3. Copy the environment variables:

```bash
cp env.example .env.local
```

4. Update the `.env.local` file with your credentials:
   - MongoDB connection string (or use mock data mode)
   - NextAuth secret
   - GitHub API keys (if using GitHub integration)
   - Site URL (http://localhost:3006)

5. Start the development server:

**Quick Start (Recommended)**
```bash
# Windows
startup-all.bat

# Linux/macOS
./startup-all.sh
```

**Manual Options**
```bash
# Option 1: Native Development
npm run dev

# Option 2: Docker Development (Recommended for Windows)
npm run dev:docker

# Option 3: Windows-specific
npm run dev:windows

# Option 4: Mock Data Development (no database required)
npm run dev:mock
```

Open [http://localhost:3006](http://localhost:3006) with your browser to see the result.

### Startup Scripts

The project includes comprehensive startup scripts that:
- Verify environment setup
- Install dependencies if needed
- Run build tests to ensure compilation
- Provide multiple development modes including testing suite
- Handle cross-platform compatibility

See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for detailed information about startup options.

## Windows Development

For Windows users, we provide enhanced compatibility:

- **WSL2 Support**: Optimized for Windows Subsystem for Linux
- **Docker Integration**: Full Docker Compose setup with Windows optimizations
- **HMR Fix**: Hot Module Reloading works properly on Windows
- **File Polling**: Automatic file watching in Docker containers

See [docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md) for detailed Windows setup instructions.

## Docker Development

The project includes full Docker support:

```bash
# Start all services
npm run dev:docker

# Start in detached mode
npm run dev:docker:detached

# View logs
npm run docker:logs

# Stop all services
npm run docker:stop

# Clean up containers and volumes
npm run docker:clean

# Access container shell
npm run docker:shell
```

## Project Structure

```
/
├── testing/                 # All testing files and configurations
│   ├── cypress/            # E2E tests
│   ├── unit/               # Unit tests
│   ├── jest.config.js
│   └── cypress.config.ts
├── scripts/                 # Deployment and utility scripts
│   ├── 02-migration/       # Migration scripts
│   ├── 03-server-setup/    # Server setup scripts
│   ├── 04-deployment/      # Deployment scripts
│   ├── 05-backup-restore/  # Backup scripts
│   └── 06-maintenance/     # Maintenance scripts
├── src/                     # Source code
│   ├── app/                # Next.js app router pages
│   │   ├── (main)/         # Public pages
│   │   ├── admin/          # Admin dashboard
│   │   └── api/            # API endpoints
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions and services
│   │   ├── models/         # PostgreSQL models
│   │   └── services/       # Data service layer
│   ├── styles/             # Global styles
│   └── types/              # TypeScript type definitions
├── public/                  # Static assets
├── docker-compose.yml       # Docker services configuration
├── docker-compose.override.yml # Windows-specific Docker overrides
├── Dockerfile              # Multi-stage Docker build
└── ...config files
```

## Development

Here are the main npm scripts available:

```bash
# Development
npm run dev                  # Start development server (port 3006)
npm run dev:windows          # Windows-specific development
npm run dev:mock             # Development with mock data
npm run dev:docker           # Docker development
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run linting

# Docker Management
npm run docker:stop          # Stop Docker containers
npm run docker:clean         # Clean Docker containers and volumes
npm run docker:logs          # View Docker logs
npm run docker:shell         # Access container shell

# Testing
npm run test                # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run cypress             # Open Cypress GUI
npm run test:e2e            # Run E2E tests
npm run test:e2e:docker     # Run E2E tests with Docker

# Utilities
npm run lighthouse          # Run Lighthouse audit
npm run accessibility       # Run accessibility checks
```

## Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Jest with React Testing Library in `testing/unit/`
- **E2E Tests**: Cypress tests in `testing/cypress/`
- **Utility Scripts**: Testing and debugging scripts in `testing/`

See [testing/README.md](testing/README.md) for detailed testing documentation.

## Deployment

This project uses GitHub Actions for CI/CD and can be deployed to Vercel or Netlify.

1. Set up the following secrets in your GitHub repository:
   - `VERCEL_TOKEN`
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`

2. Push to the main branch to trigger automatic deployment.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 