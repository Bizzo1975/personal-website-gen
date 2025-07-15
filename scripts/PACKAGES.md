# Project Packages Documentation

## Overview
This document provides a comprehensive list of all packages used in the Personal Website project, organized by category and purpose.

---

## Production Dependencies

### **Core Framework & Runtime**
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^14.0.3 | Next.js React framework - main application framework |
| `react` | ^18.2.0 | React library for building user interfaces |
| `react-dom` | ^18.2.0 | React DOM bindings for web applications |
| `node-fetch` | ^2.7.0 | Fetch API polyfill for Node.js environments |

### **Authentication & Security**
| Package | Version | Purpose |
|---------|---------|---------|
| `next-auth` | ^4.24.11 | Authentication library for Next.js with multiple providers |
| `@auth/pg-adapter` | ^1.0.0 | PostgreSQL adapter for NextAuth.js |
| `bcrypt` | ^5.1.1 | Password hashing library (native bindings) |
| `bcryptjs` | ^3.0.2 | JavaScript implementation of bcrypt for password hashing |

### **Database & Data Management**
| Package | Version | Purpose |
|---------|---------|---------|
| `pg` | ^8.16.3 | PostgreSQL client for Node.js |
| `uuid` | ^11.1.0 | UUID generation for unique identifiers |

### **UI Components & Styling**
| Package | Version | Purpose |
|---------|---------|---------|
| `@headlessui/react` | ^2.2.3 | Unstyled, accessible UI components for React |
| `@heroicons/react` | ^2.2.0 | Beautiful hand-crafted SVG icons by Heroicons |
| `@tailwindcss/typography` | ^0.5.16 | Typography plugin for Tailwind CSS |
| `next-themes` | ^0.4.6 | Theme switching library for Next.js applications |
| `tailwind-merge` | ^3.3.0 | Utility for merging Tailwind CSS classes |
| `clsx` | ^2.1.1 | Utility for constructing className strings conditionally |

### **Animation & Interactions**
| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^12.12.1 | Production-ready motion library for React |
| `react-dnd` | ^16.0.1 | Drag and drop library for React |
| `react-dnd-html5-backend` | ^16.0.1 | HTML5 backend for react-dnd |

### **Content Management & Rich Text**
| Package | Version | Purpose |
|---------|---------|---------|
| `next-mdx-remote` | ^4.4.1 | MDX remote content processing for Next.js |
| `react-quill` | ^2.0.0 | Rich text editor component for React |
| `easymde` | ^2.20.0 | Simple, beautiful, and embeddable JavaScript Markdown editor |
| `react-simplemde-editor` | ^5.2.0 | React wrapper for SimpleMDE markdown editor |
| `dompurify` | ^3.2.6 | DOM-only, super-fast, uber-tolerant XSS sanitizer |

### **Calendar & Scheduling**
| Package | Version | Purpose |
|---------|---------|---------|
| `react-big-calendar` | ^1.19.4 | Calendar component for React applications |
| `moment` | ^2.30.1 | Date manipulation and formatting library |

### **Forms & Validation**
| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.56.4 | Performant, flexible forms library for React |
| `react-google-recaptcha` | ^3.1.0 | Google reCAPTCHA component for React |

### **HTTP Client & API**
| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.10.0 | Promise-based HTTP client for browser and Node.js |

### **Email & Communication**
| Package | Version | Purpose |
|---------|---------|---------|
| `nodemailer` | ^6.10.1 | Email sending library for Node.js |

### **Utilities & Tools**
| Package | Version | Purpose |
|---------|---------|---------|
| `dotenv` | ^16.5.0 | Environment variable loading from .env files |
| `archiver` | ^7.0.1 | Streaming archive library for Node.js |
| `jsdom` | ^26.1.0 | JavaScript implementation of WHATWG DOM and HTML standards |
| `tough-cookie` | ^5.1.2 | HTTP cookie parsing and cookie jar management |
| `typo-js` | ^1.2.5 | Spellchecking library |
| `aws4` | ^1.13.2 | AWS signature version 4 signing library |

### **Typography & Fonts**
| Package | Version | Purpose |
|---------|---------|---------|
| `@fontsource/inter` | ^5.2.5 | Self-hosted Inter font family |
| `@fontsource/jetbrains-mono` | ^5.2.5 | Self-hosted JetBrains Mono font family |

### **Icons & UI Elements**
| Package | Version | Purpose |
|---------|---------|---------|
| `react-icons` | ^5.5.0 | Popular icon library for React applications |

### **Performance & Analytics**
| Package | Version | Purpose |
|---------|---------|---------|
| `web-vitals` | ^5.0.3 | Library for measuring Core Web Vitals metrics |

---

## Development Dependencies

### **TypeScript & Type Definitions**
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.8.3 | TypeScript language and compiler |
| `@types/node` | ^20.17.48 | Type definitions for Node.js |
| `@types/react` | 18.3.21 | Type definitions for React |
| `@types/react-dom` | ^18.3.7 | Type definitions for React DOM |
| `@types/bcrypt` | ^5.0.2 | Type definitions for bcrypt |
| `@types/bcryptjs` | ^2.4.6 | Type definitions for bcryptjs |
| `@types/pg` | ^8.10.9 | Type definitions for PostgreSQL client |
| `@types/uuid` | ^10.0.0 | Type definitions for UUID |
| `@types/jest` | ^29.5.14 | Type definitions for Jest testing framework |
| `@types/archiver` | ^6.0.3 | Type definitions for archiver |
| `@types/nodemailer` | ^6.4.17 | Type definitions for nodemailer |
| `@types/react-big-calendar` | ^1.16.2 | Type definitions for react-big-calendar |
| `@types/react-google-recaptcha` | ^2.1.9 | Type definitions for react-google-recaptcha |

### **Testing Framework**
| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | ^29.7.0 | JavaScript testing framework |
| `jest-environment-jsdom` | ^29.7.0 | JSDOM environment for Jest |
| `@testing-library/jest-dom` | ^6.6.3 | Custom Jest matchers for DOM testing |
| `@testing-library/react` | ^16.3.0 | React testing utilities |
| `@testing-library/user-event` | ^14.6.1 | User interaction simulation for testing |
| `cypress` | ^14.3.3 | End-to-end testing framework |
| `start-server-and-test` | ^2.0.12 | Start server and run tests utility |

### **Build Tools & Bundling**
| Package | Version | Purpose |
|---------|---------|---------|
| `@next/bundle-analyzer` | ^15.3.2 | Bundle analysis tool for Next.js |
| `postcss` | ^8.4.31 | CSS post-processing tool |
| `autoprefixer` | ^10.4.16 | PostCSS plugin for vendor prefixes |
| `tailwindcss` | ^3.3.5 | Utility-first CSS framework |

### **Code Quality & Linting**
| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | ^8.54.0 | JavaScript and TypeScript linting tool |
| `eslint-config-next` | 14.0.3 | ESLint configuration for Next.js projects |

### **Accessibility Testing**
| Package | Version | Purpose |
|---------|---------|---------|
| `@axe-core/react` | ^4.10.1 | React integration for axe accessibility testing |
| `axe-core` | ^4.10.3 | Accessibility testing engine |

### **Development Utilities**
| Package | Version | Purpose |
|---------|---------|---------|
| `cross-env` | ^7.0.3 | Cross-platform environment variable setting |
| `rimraf` | ^5.0.5 | Cross-platform rm -rf utility |
| `chalk` | ^5.4.1 | Terminal string styling library |
| `puppeteer` | ^24.9.0 | Headless Chrome automation library |

---

## Infrastructure & Runtime Requirements

### **Node.js Runtime**
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 8+ (comes with Node.js)

### **Database**
- **PostgreSQL**: Version 15+ 
- **Extensions Required**: `uuid-ossp`

### **Optional Services**
- **Redis**: Version 7+ (for session storage and caching)
- **SMTP Server**: For email functionality

---

## Production Dependencies Summary

### **Core Application**
- Next.js 14 with React 18
- PostgreSQL with NextAuth.js
- Tailwind CSS for styling
- TypeScript for type safety

### **Key Features**
- Authentication & authorization
- Content management (posts, projects, pages)
- Rich text editing capabilities
- Email functionality
- Calendar/scheduling features
- Drag & drop interfaces
- Dark/light theme support
- Accessibility compliance
- Performance monitoring

### **Security Features**
- Password hashing (bcrypt)
- XSS protection (DOMPurify)
- CSRF protection (NextAuth.js)
- Input validation
- Rate limiting capabilities

---

## Development Workflow

### **Testing Stack**
- **Unit Testing**: Jest with React Testing Library
- **E2E Testing**: Cypress
- **Accessibility Testing**: axe-core
- **Performance Testing**: Lighthouse integration

### **Development Tools**
- **Hot Reload**: Next.js development server
- **Type Checking**: TypeScript
- **Code Linting**: ESLint with Next.js config
- **CSS Framework**: Tailwind CSS with JIT mode
- **Bundle Analysis**: Next.js Bundle Analyzer

---

*Last Updated: December 2024*
*Total Dependencies: 41 production + 25 development = 66 total packages* 