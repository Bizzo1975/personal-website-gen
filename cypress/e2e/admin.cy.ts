describe('Admin Functionality', () => {
  // Test login functionality
  describe('Authentication', () => {
    beforeEach(() => {
      cy.visit('/admin/login');
    });

    it('should show login form', () => {
      // Verify login form elements exist
      cy.get('form').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      // Submit with empty fields
      cy.get('button[type="submit"]').click();
      
      // Verify error messages appear
      cy.get('form').contains('Email is required').should('be.visible');
      cy.get('form').contains('Password is required').should('be.visible');
    });

    it('should show error message for invalid credentials', () => {
      // Fill in invalid credentials
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Verify error message
      cy.contains('Invalid email or password').should('be.visible');
    });

    it('should navigate to dashboard after successful login', () => {
      // Mock successful login - we'll intercept the auth API call
      cy.intercept('POST', '/api/auth/callback/credentials', {
        statusCode: 200,
        body: {
          user: { 
            name: 'Test Admin',
            email: 'admin@example.com',
            role: 'admin'
          }
        }
      }).as('loginRequest');
      
      // Fill in valid credentials 
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('admin12345');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Wait for redirect to dashboard
      cy.url().should('include', '/admin/dashboard');
    });
  });

  // Test dashboard functionality (requires login)
  describe('Dashboard', () => {
    beforeEach(() => {
      // Mock authentication to avoid having to log in before each test
      cy.session('authenticated-admin', () => {
        // Setup the session to mock being logged in
        cy.setCookie('next-auth.session-token', 'mock-session-token');
        
        // Mock the session data that would be returned by NextAuth
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
      
      cy.visit('/admin/dashboard');
    });

    it('should display main dashboard elements', () => {
      // Verify dashboard elements
      cy.get('h1').contains('Dashboard').should('be.visible');
      cy.contains('Recent Posts').should('be.visible');
      cy.contains('Recent Projects').should('be.visible');
    });
    
    it('should have working navigation to content sections', () => {
      // Check for navigation links
      cy.contains('Posts').click();
      cy.url().should('include', '/admin/posts');
      
      cy.go('back');
      
      cy.contains('Projects').click();
      cy.url().should('include', '/admin/projects');
      
      cy.go('back');
      
      cy.contains('Pages').click();
      cy.url().should('include', '/admin/pages');
    });
  });

  // Test blog post editor functionality
  describe('Blog Post Editor', () => {
    beforeEach(() => {
      // Mock authentication as in Dashboard tests
      cy.session('authenticated-admin', () => {
        cy.setCookie('next-auth.session-token', 'mock-session-token');
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
      
      // Mock API responses for post data
      cy.intercept('GET', '/api/admin/posts/*', {
        statusCode: 200,
        body: {
          id: 'test-post-id',
          title: 'Test Post',
          slug: 'test-post',
          content: 'This is test content',
          excerpt: 'Test excerpt',
          tags: ['test', 'cypress'],
          date: '2025-05-20',
          published: true
        }
      }).as('getPostRequest');
      
      cy.visit('/admin/posts/new');
    });

    it('should display the post editor form', () => {
      // Verify form elements
      cy.get('form').should('be.visible');
      cy.get('input[name="title"]').should('be.visible');
      cy.get('input[name="slug"]').should('be.visible');
      cy.get('textarea[name="excerpt"]').should('be.visible');
      
      // Verify rich text editor is present
      cy.get('.ql-editor').should('be.visible');
    });

    it('should show validation errors for required fields', () => {
      // Clear title field (if pre-filled)
      cy.get('input[name="title"]').clear();
      
      // Submit form
      cy.get('button').contains('Save').click();
      
      // Check validation errors
      cy.contains('Title is required').should('be.visible');
    });

    it('should handle slug generation', () => {
      // Type a title
      cy.get('input[name="title"]').clear().type('This Is A Test Title');
      
      // Verify slug is auto-generated
      cy.get('input[name="slug"]').should('have.value', 'this-is-a-test-title');
    });
  });
});
