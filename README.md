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

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark/light mode
- **Content Management**: MDX for blog posts
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Testing**: Jest for unit tests, Cypress for E2E tests
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (primary) / Netlify (alternative)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (for database functionality)
- GitHub account (for project integration)

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
cp .env.example .env.local
```

4. Update the `.env.local` file with your credentials:
   - MongoDB connection string
   - NextAuth secret
   - GitHub API keys (if using GitHub integration)
   - Site URL

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
/
├── docs/                    # Project documentation
│   ├── MONGODB_SETUP.md
│   ├── NEXTAUTH_SETUP.md
│   ├── PROJECT_PLAN.md
│   ├── TROUBLESHOOTING.md
│   └── ...
├── testing/                 # All testing files and configurations
│   ├── cypress/            # E2E tests
│   ├── unit/               # Unit tests
│   ├── jest.config.js
│   └── cypress.config.ts
├── scripts/                 # Utility scripts
│   ├── setup/
│   ├── maintenance/
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
└── ...config files
```

## Development

Here are the main npm scripts available:

```bash
# Development
npm run dev                  # Start development server
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run linting

# Testing
npm run test                # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run cypress             # Open Cypress GUI
npm run test:e2e            # Run E2E tests

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
- [Admin Pages Troubleshooting](docs/ADMIN_PAGES_TROUBLESHOOTING.md)
- [Animations and Accessibility](docs/ANIMATIONS_AND_ACCESSIBILITY.md)

## License

This project is open source and available under the [MIT License](LICENSE). 