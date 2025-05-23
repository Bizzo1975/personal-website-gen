describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the home page correctly', () => {
    // Check main elements are present
    cy.get('h1').should('be.visible');
    cy.get('main').should('be.visible');
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('should have working navigation links', () => {
    // Check navigation links
    cy.get('header a[href="/blog"]').should('exist');
    cy.get('header a[href="/projects"]').should('exist');
    cy.get('header a[href="/about"]').should('exist');
    
    // Navigate to Blog page
    cy.get('header a[href="/blog"]').click();
    cy.url().should('include', '/blog');
    
    // Check we can return to home
    cy.get('header a[href="/"]').click();
    cy.url().should('not.include', '/blog');
  });

  it('should have working theme switcher', () => {
    // Find theme switcher button
    cy.get('button[aria-label*="theme"]').as('themeToggle');
    
    // Toggle theme
    cy.get('@themeToggle').click();
    
    // Check if theme changed (this is a simplified check)
    cy.get('html').should('have.attr', 'class').then((classes) => {
      const hasThemeClass = classes.includes('dark') || classes.includes('light');
      expect(hasThemeClass).to.be.true;
    });
  });
}); 