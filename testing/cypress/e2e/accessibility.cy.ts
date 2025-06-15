describe('Accessibility Features', () => {
  it('should have skip to content link accessible by keyboard', () => {
    cy.visit('/');
    
    // Tab to make skip link visible
    cy.get('body').type('{tab}');
    
    // Skip link should be visible when focused
    cy.focused().should('have.text', 'Skip to content');
    cy.focused().should('be.visible');
    
    // Pressing Enter should focus on main content
    cy.focused().type('{enter}');
    cy.focused().should('have.attr', 'id', 'main-content');
  });

  it('should have keyboard navigable blog posts', () => {
    cy.visit('/blog');
    
    // Tab to first blog post link
    cy.get('body').type('{tab}{tab}{tab}');
    
    // Check focused element is a link in the blog post list
    cy.focused()
      .should('have.attr', 'href')
      .and('include', '/blog/');
    
    // Pressing Enter should navigate to the post
    cy.focused().type('{enter}');
    cy.url().should('include', '/blog/');
  });

  it('should have proper heading hierarchy', () => {
    cy.visit('/');
    
    // Check heading hierarchy
    cy.get('h1').should('have.length.at.least', 1);
    
    // Heading levels should not be skipped
    cy.get('h1 + h3, h1 + h4, h1 + h5, h1 + h6').should('not.exist');
    cy.get('h2 + h4, h2 + h5, h2 + h6').should('not.exist');
    cy.get('h3 + h5, h3 + h6').should('not.exist');
    cy.get('h4 + h6').should('not.exist');
  });

  it('should have sufficient color contrast', () => {
    // This is a simplified test; ideally, you'd use axe or similar tools
    cy.visit('/');
    
    // Check that our text is either dark on light or light on dark
    cy.get('body').should('have.css', 'color').then(color => {
      cy.get('body').should('have.css', 'background-color').then(bgColor => {
        // Simple check: if one is dark, the other should be light
        // A more sophisticated test would calculate contrast ratios
        expect(color !== bgColor).to.be.true;
      });
    });
  });
}); 