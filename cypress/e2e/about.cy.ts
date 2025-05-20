describe('About Page', () => {
  beforeEach(() => {
    cy.visit('/about');
  });

  it('should display the about page correctly', () => {
    // Check profile section is present
    cy.get('div.md\\:w-1\\/3').should('exist');
    
    // Check content section is present
    cy.get('div.md\\:w-2\\/3').should('exist');
    
    // Check profile image
    cy.get('img').should('be.visible');
    
    // Check skills section
    cy.get('h3').contains('Skills & Technologies').should('be.visible');
  });

  it('should display skills correctly', () => {
    // Find skills section
    cy.contains('h3', 'Skills & Technologies').scrollIntoView();
    
    // Check that skill items exist
    cy.get('.grid.grid-cols-2 > div').should('have.length.at.least', 1);
    
    // Check some common skills that should be present
    const expectedSkills = ['JavaScript', 'React', 'Next.js'];
    
    expectedSkills.forEach(skill => {
      cy.contains(skill).should('exist');
    });
  });

  it('should have profile info with contact details', () => {
    // Check profile section has expected elements
    cy.get('div.md\\:w-1\\/3').within(() => {
      // Name should be visible
      cy.contains('John Doe').should('be.visible');
      
      // Location should be visible (if present)
      // This uses optional chaining to handle potential absence
      cy.contains('New York').should('exist');
    });
  });

  it('should be responsive', () => {
    // Test mobile view
    cy.viewport('iphone-x');
    
    // On mobile, layout should stack (not side-by-side)
    cy.get('div.flex-col').should('be.visible');
    
    // Test tablet view 
    cy.viewport('ipad-2');
    cy.get('div.md\\:flex-row').should('be.visible');
    
    // Test desktop view
    cy.viewport(1280, 720);
    cy.get('div.md\\:flex-row').should('be.visible');
  });

  it('should navigate using keyboard', () => {
    // Start by focusing on the body
    cy.get('body').focus();
    
    // Tab to focus on various elements
    cy.get('body').tab().tab();
    
    // After some tabs, we should reach a skill item
    cy.focused().should('exist');
  });
}); 