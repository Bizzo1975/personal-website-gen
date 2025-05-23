// Custom commands for admin testing
import 'cypress-file-upload';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as admin user
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Navigate to admin section
       */
      navigateToAdmin(section: 'posts' | 'projects' | 'pages' | 'editor' | 'dashboard'): Chainable<void>;
    }
  }
}

// Mock admin authentication
Cypress.Commands.add('loginAsAdmin', () => {
  // Set session cookie
  cy.setCookie('next-auth.session-token', 'mock-session-token');
  
  // Mock the session API response
  cy.intercept('GET', '/api/auth/session', {
    statusCode: 200,
    body: {
      user: {
        name: 'Test Admin',
        email: 'admin@example.com',
        role: 'admin'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  }).as('sessionRequest');
});

// Navigate to admin section
Cypress.Commands.add('navigateToAdmin', (section) => {
  cy.loginAsAdmin();
  cy.visit(`/admin/${section}`);
});

// Import commands
export {};
