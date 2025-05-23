describe('Admin Content Management', () => {
  beforeEach(() => {
    // Mock authentication session
    cy.window().then((win) => {
      win.sessionStorage.setItem('next-auth.session-token', 'mock-admin-token');
    });
    
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

  describe('Site Settings Management', () => {
    beforeEach(() => {
      // Mock site settings API responses
      cy.intercept('GET', '/api/site-settings', {
        statusCode: 200,
        body: {
          logoUrl: '/images/wizard-icon.svg',
          logoText: 'John Doe',
          footerText: 'Built with Next.js and Tailwind CSS',
          bioText: 'Full-stack developer specializing in modern web technologies.',
          navbarStyle: 'default',
          navbarLinks: []
        }
      }).as('getSiteSettings');

      cy.intercept('PUT', '/api/site-settings', {
        statusCode: 200,
        body: { success: true }
      }).as('updateSiteSettings');
    });

    it('should display site settings form', () => {
      cy.visit('/admin/settings/site');
      
      cy.get('input[name="logoText"]').should('be.visible');
      cy.get('textarea[name="footerText"]').should('be.visible');
      cy.get('textarea[name="bioText"]').should('be.visible');
      
      cy.wait('@getSiteSettings');
    });

    it('should load existing settings', () => {
      cy.visit('/admin/settings/site');
      
      cy.wait('@getSiteSettings');
      
      cy.get('input[name="logoText"]').should('have.value', 'John Doe');
      cy.get('textarea[name="footerText"]').should('contain.value', 'Built with Next.js and Tailwind CSS');
      cy.get('textarea[name="bioText"]').should('contain.value', 'Full-stack developer');
    });

    it('should save updated settings', () => {
      cy.visit('/admin/settings/site');
      
      cy.wait('@getSiteSettings');
      
      // Update fields
      cy.get('input[name="logoText"]').clear().type('Updated Name');
      cy.get('textarea[name="footerText"]').clear().type('Updated footer text');
      cy.get('textarea[name="bioText"]').clear().type('Updated bio text');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateSiteSettings').then((interception) => {
        expect(interception.request.body).to.include({
          logoText: 'Updated Name',
          footerText: 'Updated footer text',
          bioText: 'Updated bio text'
        });
      });
      
      // Should show success message
      cy.contains('Site settings updated successfully!').should('be.visible');
    });
  });

  describe('Page Header Management', () => {
    beforeEach(() => {
      // Mock page API responses
      cy.intercept('GET', '/api/pages/*', {
        statusCode: 200,
        body: {
          id: 'projects',
          slug: 'projects',
          title: 'Projects',
          headerTitle: 'My Projects',
          headerSubtitle: 'A showcase of my work',
          content: 'Project content here',
          isPublished: true
        }
      }).as('getPage');

      cy.intercept('PUT', '/api/pages/*', {
        statusCode: 200,
        body: { success: true }
      }).as('updatePage');
    });

    it('should allow editing project page headers', () => {
      cy.visit('/admin/projects');
      
      // Should see header editing form
      cy.get('input[name="headerTitle"]').should('be.visible');
      cy.get('textarea[name="headerSubtitle"]').should('be.visible');
      
      // Update header fields
      cy.get('input[name="headerTitle"]').clear().type('Updated Project Title');
      cy.get('textarea[name="headerSubtitle"]').clear().type('Updated project subtitle');
      
      // Submit header form
      cy.get('form').contains('Save Header').click();
      
      cy.wait('@updatePage');
      
      // Should show success message or feedback
      cy.contains(/saved|updated/i).should('be.visible');
    });

    it('should allow editing contact page headers', () => {
      cy.visit('/admin/contact');
      
      // Should see header editing form
      cy.get('input[name="headerTitle"]').should('be.visible');
      cy.get('textarea[name="headerSubtitle"]').should('be.visible');
      
      // Update header fields
      cy.get('input[name="headerTitle"]').clear().type('Get In Touch');
      cy.get('textarea[name="headerSubtitle"]').clear().type('Let\'s start a conversation');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updatePage');
    });

    it('should allow editing posts page headers', () => {
      cy.visit('/admin/posts');
      
      // Should see header editing form
      cy.get('input[name="headerTitle"]').should('be.visible');
      cy.get('textarea[name="headerSubtitle"]').should('be.visible');
      
      // Update header fields
      cy.get('input[name="headerTitle"]').clear().type('Blog Posts');
      cy.get('textarea[name="headerSubtitle"]').clear().type('Thoughts, tutorials, and insights');
      
      // Submit header form
      cy.get('form').contains('Save Header').click();
      
      cy.wait('@updatePage');
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate between admin sections', () => {
      cy.visit('/admin/dashboard');
      
      // Test navigation to different admin sections
      cy.contains('Site Settings').click();
      cy.url().should('include', '/admin/settings/site');
      
      cy.contains('Projects').click();
      cy.url().should('include', '/admin/projects');
      
      cy.contains('Posts').click();
      cy.url().should('include', '/admin/posts');
      
      cy.contains('Contact').click();
      cy.url().should('include', '/admin/contact');
    });

    it('should highlight active navigation item', () => {
      cy.visit('/admin/projects');
      
      cy.get('nav').within(() => {
        cy.contains('Projects').parent().should('have.class', 'bg-primary-600');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in site settings', () => {
      cy.visit('/admin/settings/site');
      
      cy.wait('@getSiteSettings');
      
      // Clear required fields
      cy.get('input[name="logoText"]').clear();
      cy.get('textarea[name="bioText"]').clear();
      
      // Try to submit
      cy.get('button[type="submit"]').click();
      
      // Should prevent submission and show validation
      cy.get('input[name="logoText"]:invalid').should('exist');
      cy.get('textarea[name="bioText"]:invalid').should('exist');
    });

    it('should validate required fields in page headers', () => {
      cy.visit('/admin/projects');
      
      // Clear required header title
      cy.get('input[name="headerTitle"]').clear();
      
      // Try to submit
      cy.get('form').contains('Save Header').click();
      
      // Should prevent submission
      cy.get('input[name="headerTitle"]:invalid').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('PUT', '/api/site-settings', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('updateSiteSettingsError');
      
      cy.visit('/admin/settings/site');
      
      cy.wait('@getSiteSettings');
      
      // Try to save
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateSiteSettingsError');
      
      // Should show error message
      cy.contains(/error|failed/i).should('be.visible');
    });
  });
});

describe('Frontend Integration', () => {
  it('should reflect admin changes on frontend pages', () => {
    // Visit a frontend page
    cy.visit('/projects');
    
    // Should see the header section with title and subtitle
    cy.get('h1').should('be.visible');
    cy.get('section').first().should('contain.text', 'Projects');
  });

  it('should display updated footer content', () => {
    cy.visit('/');
    
    // Check footer content
    cy.get('footer').should('be.visible');
    cy.get('footer').should('contain.text', 'Built with Next.js');
  });
}); 