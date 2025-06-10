# Personal Website

A modern, responsive personal website built with Next.js, TypeScript, and Tailwind CSS. This website serves as a portfolio, blog, and project showcase with an admin dashboard that allows editing of all content.

## Features

- 📱 Responsive design that works on all devices
- 🚀 Fast performance with Next.js
- 📝 Blog with MDX support and RSS feed
- 💼 Project showcase with GitHub integration
- 📄 Resume/CV page
- 🌓 Dark/light mode support
- 🔍 Search functionality
- 🖼️ Optimized image loading
- 🔒 Authentication with NextAuth
- 📊 Admin dashboard
- 🐳 Docker support with Windows compatibility
- 🖥️ Cross-platform development (Windows, macOS, Linux)

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark/light mode
- **Content Management**: MDX for blog posts
- **Database**: MongoDB with Mongoose (PostgreSQL support via Docker)
- **Authentication**: NextAuth.js
- **Testing**: Jest for unit tests, Cypress for E2E tests
- **Containerization**: Docker with Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (primary) / Netlify (alternative)

## Port Configuration

The application uses the following ports:

- **Frontend (Next.js)**: `3006`
- **Backend API**: `4006` (if separate backend is added)
- **PostgreSQL Database**: `5436`
- **pgAdmin**: `8080` (optional, for database management)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (for database functionality) OR Docker for PostgreSQL
- GitHub account (for project integration)
- Docker Desktop (optional, for containerized development)

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
   - MongoDB connection string OR PostgreSQL settings
   - NextAuth secret
   - GitHub API keys (if using GitHub integration)
   - Site URL (http://localhost:3006)

5. Start the development server:

**Option 1: Native Development**
```bash
npm run dev
```

**Option 2: Docker Development (Recommended for Windows)**
```bash
npm run dev:docker
```

**Option 3: Windows-specific**
```bash
npm run dev:windows
```

Open [http://localhost:3006](http://localhost:3006) with your browser to see the result.

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
# Start all services (frontend + database)
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
├── docs/                    # Project documentation
│   ├── MONGODB_SETUP.md
│   ├── NEXTAUTH_SETUP.md
│   ├── PROJECT_PLAN.md
│   ├── TROUBLESHOOTING.md
│   ├── WINDOWS_SETUP.md     # Windows-specific setup guide
│   └── ...
├── testing/                 # All testing files and configurations
│   ├── cypress/            # E2E tests
│   ├── unit/               # Unit tests
│   ├── jest.config.js
│   └── cypress.config.ts
├── scripts/                 # Utility scripts
│   ├── setup/
│   ├── maintenance/
│   ├── database/           # Database initialization scripts
│   └── ...
├── src/                     # Source code
│   ├── app/                # Next.js app router pages
│   │   ├── (main)/         # Public pages
│   │   ├── admin/          # Admin dashboard
│   │   └── api/            # API endpoints
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions and services
│   │   ├── models/         # MongoDB schemas
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
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

2. Push to the main branch to trigger automatic deployment.

Alternatively, you can deploy manually:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fpersonal-website)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/personal-website)

## Documentation

Additional documentation is available in the [docs/](docs/) directory:
- [MongoDB Setup](docs/MONGODB_SETUP.md)
- [NextAuth Setup](docs/NEXTAUTH_SETUP.md)
- [Project Plan](docs/PROJECT_PLAN.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Windows Setup Guide](docs/WINDOWS_SETUP.md)
- [Admin Pages Troubleshooting](docs/ADMIN_PAGES_TROUBLESHOOTING.md)
- [Animations and Accessibility](docs/ANIMATIONS_AND_ACCESSIBILITY.md)

## License

This project is open source and available under the [MIT License](LICENSE). 