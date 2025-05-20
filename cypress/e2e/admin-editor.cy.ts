describe('Admin Rich Text Editor', () => {
  beforeEach(() => {
    // Mock authentication
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
    
    // Visit the editor page
    cy.visit('/admin/editor');
  });

  it('should load the rich text editor', () => {
    // Verify editor components are present
    cy.get('.rich-text-editor').should('be.visible');
    cy.get('.ql-toolbar').should('be.visible');
    cy.get('.ql-editor').should('be.visible');
  });

  it('should format text with toolbar buttons', () => {
    // Clear the editor
    cy.get('.ql-editor').clear();
    
    // Type some content
    cy.get('.ql-editor').type('This is a test paragraph');
    
    // Select all text (using keyboard shortcut)
    cy.get('.ql-editor').type('{selectall}');
    
    // Click bold button
    cy.get('.ql-bold').click();
    
    // Verify bold text
    cy.get('.ql-editor strong').should('contain', 'This is a test paragraph');
    
    // Click italic button
    cy.get('.ql-italic').click();
    
    // Verify bold and italic text
    cy.get('.ql-editor strong em').should('contain', 'This is a test paragraph');
  });

  it('should insert a link', () => {
    // Clear the editor
    cy.get('.ql-editor').clear();
    
    // Type some content
    cy.get('.ql-editor').type('Visit my website');
    
    // Select all text
    cy.get('.ql-editor').type('{selectall}');
    
    // Click link button
    cy.get('.ql-link').click();
    
    // Handle link dialog (implementation may vary)
    cy.get('.ql-tooltip input').type('https://example.com');
    cy.get('.ql-tooltip .ql-action').click();
    
    // Verify link was created
    cy.get('.ql-editor a')
      .should('contain', 'Visit my website')
      .should('have.attr', 'href', 'https://example.com');
  });

  it('should handle image upload', () => {
    // Mock file upload API
    cy.intercept('POST', '/api/admin/upload', {
      statusCode: 200,
      body: {
        url: '/uploads/test-image.jpg'
      }
    }).as('imageUpload');
    
    // Click image button
    cy.get('.ql-image').click();
    
    // Handle file upload (implementation may vary)
    cy.get('input[type=file]').selectFile('cypress/fixtures/test-image.jpg', { force: true });
    
    // Wait for upload to complete
    cy.wait('@imageUpload');
    
    // Verify image was inserted
    cy.get('.ql-editor img').should('have.attr', 'src', '/uploads/test-image.jpg');
  });

  it('should save content when submitting the form', () => {
    // Mock API save response
    cy.intercept('POST', '/api/admin/content', {
      statusCode: 200,
      body: {
        success: true,
        id: 'test-content-id'
      }
    }).as('saveContent');
    
    // Clear editor
    cy.get('.ql-editor').clear();
    
    // Add content
    cy.get('.ql-editor').type('This is test content that should be saved.');
    
    // Submit form
    cy.get('form').submit();
    
    // Verify API was called with content
    cy.wait('@saveContent').its('request.body').should('include', 'This is test content that should be saved.');
    
    // Verify success message
    cy.contains('Content saved successfully').should('be.visible');
  });
});
