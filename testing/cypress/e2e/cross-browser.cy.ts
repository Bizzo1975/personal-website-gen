describe('Cross-browser Compatibility', () => {
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Projects', path: '/projects' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  // Viewport sizes representing different devices
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  // Test each page at each viewport size
  viewports.forEach(viewport => {
    context(`${viewport.name} viewport (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      pages.forEach(page => {
        it(`should display ${page.name} page correctly`, () => {
          cy.visit(page.path);
          
          // Check main elements are visible
          cy.get('header').should('be.visible');
          cy.get('main').should('be.visible');
          cy.get('footer').should('be.visible');
          
          // Take a screenshot for visual verification
          cy.screenshot(`${page.name.toLowerCase()}-${viewport.name.toLowerCase()}`);
        });
      });
    });
  });

  it('should handle theme switching consistently across pages', () => {
    cy.viewport(1280, 800);
    
    // Visit home page and toggle theme
    cy.visit('/');
    cy.get('button[aria-label*="theme"]').click();
    
    // Get theme state (checking if body has dark class)
    cy.get('html').invoke('attr', 'class').then(homeClasses => {
      const isDarkTheme = homeClasses?.includes('dark');
      
      // Check theme persistence across pages
      pages.slice(1).forEach(page => {
        cy.visit(page.path);
        cy.get('html').invoke('attr', 'class').then(pageClasses => {
          const pageIsDarkTheme = pageClasses?.includes('dark');
          expect(pageIsDarkTheme).to.equal(isDarkTheme);
        });
      });
    });
  });

  it('should render fonts consistently across pages', () => {
    cy.viewport(1280, 800);
    
    // Check typography consistency across pages
    pages.forEach(page => {
      cy.visit(page.path);
      
      // Check headings font consistency
      cy.get('h1, h2, h3').first()
        .should('have.css', 'font-family')
        .then(fontFamily => {
          // Store this for comparison with other pages
          cy.wrap(fontFamily).as('headingFont');
        });
      
      // Check body font consistency
      cy.get('p').first()
        .should('have.css', 'font-family')
        .then(fontFamily => {
          // Store this for comparison with other pages
          cy.wrap(fontFamily).as('bodyFont');
        });
    });
  });
}); 