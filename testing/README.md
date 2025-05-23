# Testing

This directory contains all testing-related files and configurations for the personal website project.

## Structure

```
testing/
├── cypress/                 # End-to-end tests
│   ├── e2e/                # E2E test specs
│   ├── fixtures/           # Test data
│   ├── screenshots/        # Test screenshots
│   └── support/            # Support files
├── unit/                   # Unit tests (moved from src/__tests__)
│   ├── api/               # API tests
│   ├── components/        # Component tests
│   └── integration/       # Integration tests
├── cypress.config.ts      # Cypress configuration
├── jest.config.js         # Jest configuration
├── jest.setup.ts          # Jest setup file
└── README.md              # This file
```

## Test Scripts

Run tests from the project root using these npm scripts:

### Unit Tests (Jest)
```bash
npm run test              # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:ci           # Run tests for CI/CD
```

### End-to-End Tests (Cypress)
```bash
npm run cypress           # Open Cypress GUI
npm run cypress:headless  # Run Cypress in headless mode
npm run test:e2e          # Run E2E tests with dev server
npm run test:e2e:ci       # Run E2E tests for CI/CD
```

## Utility Scripts

The testing directory also contains utility scripts for testing and debugging:

- `check-admin-pages.js` - Validates admin page functionality
- `check-db-connection.js` - Tests database connectivity
- `check-fixes.js` - Validates bug fixes
- `test-admin-user.js` - Tests admin user functionality
- `test-db-connection.js` - Database connection tests
- `test-pages.js` - Page functionality tests
- `check-nextauth.sh` - NextAuth configuration validation
- `reset-admin.js` - Reset admin user for testing
- `create-env-local.js` - Environment setup utility

## Configuration

### Jest Configuration
- Tests are configured to run from the testing directory
- Module paths are mapped to the src directory
- Coverage reports are generated in `testing/coverage/`

### Cypress Configuration
- E2E tests run against `http://localhost:3000`
- Component tests can be run against individual React components
- Screenshots and videos are saved in the cypress directory

## Writing Tests

### Unit Tests
Place unit tests in the `unit/` directory following the same structure as the `src/` directory:

```
unit/
├── components/
│   └── Button.test.tsx
├── api/
│   └── auth.test.ts
└── integration/
    └── pages.test.tsx
```

### E2E Tests
Place E2E tests in `cypress/e2e/` with descriptive names:

```
cypress/e2e/
├── auth.cy.ts
├── admin-dashboard.cy.ts
└── public-pages.cy.ts
```

## Best Practices

1. **Test Organization**: Keep tests close to the functionality they test
2. **Naming**: Use descriptive test names that explain what is being tested
3. **Data**: Use fixtures for test data instead of hardcoding values
4. **Cleanup**: Ensure tests clean up after themselves
5. **Isolation**: Tests should be independent and not rely on other tests 