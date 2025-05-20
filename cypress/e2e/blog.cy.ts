describe('Blog Page', () => {
  beforeEach(() => {
    cy.visit('/blog');
  });

  it('should display the blog page correctly', () => {
    // Check main elements are present
    cy.get('h1').should('contain.text', 'Blog');
    cy.get('main').should('be.visible');
    
    // Check for blog posts
    cy.get('article, .card, [role="article"]').should('have.length.at.least', 1);
  });

  it('should show blog post details when clicked', () => {
    // Click on the first blog post
    cy.get('article a, .card a').first().click();
    
    // Check we're on a blog post page
    cy.url().should('include', '/blog/');
    
    // Verify blog post content is present
    cy.get('h1').should('be.visible');
    cy.get('article, .prose').should('be.visible');
    
    // Check for back link to main blog
    cy.get('a[href="/blog"]').should('be.visible').contains('back', { matchCase: false });
  });

  it('should have working RSS feed link', () => {
    // Check RSS link exists
    cy.get('a[href="/api/rss"]').should('be.visible');
    
    // We can't directly test the RSS feed content with Cypress
    // but we can check the link is correctly set up
    cy.get('a[href="/api/rss"]').should('have.attr', 'target', '_blank');
  });

  it('should have properly visible animations', () => {
    // Wait for animations to complete
    cy.wait(1000);
    
    // Check animated elements are visible
    cy.get('h1').should('be.visible');
    cy.get('article, .card').should('be.visible');
  });
}); 