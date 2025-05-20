describe('Projects Page', () => {
  beforeEach(() => {
    cy.visit('/projects');
  });

  it('should display the projects page correctly', () => {
    // Check main elements are present
    cy.get('h1').should('contain.text', 'Projects');
    cy.get('main').should('be.visible');
    
    // Check for project cards
    cy.get('.grid > div').should('have.length.at.least', 1);
  });

  it('should display project details correctly', () => {
    // Check first project has required elements
    cy.get('.grid > div').first().within(() => {
      // Project should have an image
      cy.get('img').should('exist');
      
      // Project should have a title
      cy.get('h2').should('be.visible');
      
      // Project should have a description
      cy.get('p').should('be.visible');
      
      // Project should have technology tags
      cy.get('.flex.flex-wrap.gap-2 > span').should('have.length.at.least', 1);
      
      // Project should have links
      cy.get('a').should('have.length.at.least', 1);
    });
  });

  it('should have working external links', () => {
    // Check that project links open in new tab
    cy.get('.grid > div').first().within(() => {
      cy.get('a').first().should('have.attr', 'target', '_blank');
      cy.get('a').first().should('have.attr', 'rel', 'noopener noreferrer');
    });
  });

  it('should have properly filtered projects when using technology filter', () => {
    // This test is a placeholder for when filtering functionality is implemented
    // Currently, the filtering is likely hardcoded in the component
    
    // Check that technologies are displayed
    cy.get('.flex.flex-wrap.gap-2 > span').first().should('be.visible');
  });

  it('should be responsive', () => {
    // Test mobile view
    cy.viewport('iphone-x');
    cy.get('.grid').should('be.visible');
    
    // Test tablet view
    cy.viewport('ipad-2');
    cy.get('.grid').should('be.visible');
    
    // Test desktop view
    cy.viewport(1280, 720);
    cy.get('.grid').should('be.visible');
  });
}); 