# Personal Website Generator

A modern, responsive personal website built with Next.js, TypeScript, and Tailwind CSS.

## 📚 Documentation

- **[Main Documentation](docs/README.md)** - Complete setup and usage guide
- **[Project Plan](docs/PROJECT_PLAN.md)** - Project structure and planning
- **[Project Details](docs/DETAILS.md)** - Technical details and specifications
- **[Deployment Guide](docs/LOCAL_SERVER_DEPLOYMENT.md)** - Production deployment instructions

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp config/env.example .env.local
   ```

3. **Start development:**
   ```bash
   # Linux/Ubuntu/macOS
   ./scripts/deployment/startup-all.sh
   ```

## 📁 Project Structure

```
├── docs/                    # Documentation
├── config/                  # Configuration templates
├── assets/                  # Static assets
├── scripts/                 # Scripts and utilities
│   └── deployment/          # Deployment scripts
├── src/                     # Source code
├── public/                  # Public assets
├── testing/                 # Tests
└── backups/                 # Backup system
```

## 🔧 Configuration

- **Environment**: `config/env.example` → `.env.local`
- **Production**: `config/env.production.template` → `.env.production`
- **Nginx**: `config/nginx.conf`
- **Database**: `config/init.sql`

## 📖 Full Documentation

See [docs/README.md](docs/README.md) for complete documentation.





