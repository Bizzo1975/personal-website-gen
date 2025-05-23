describe('Admin Content Management', () => {
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
  });

  describe('Blog Posts Management', () => {
    beforeEach(() => {
      // Mock API response for posts list
      cy.intercept('GET', '/api/admin/posts', {
        statusCode: 200,
        body: [
          {
            id: 'post-1',
            title: 'Test Post 1',
            slug: 'test-post-1',
            excerpt: 'This is test post 1',
            date: '2025-05-20',
            published: true
          },
          {
            id: 'post-2',
            title: 'Test Post 2',
            slug: 'test-post-2',
            excerpt: 'This is test post 2',
            date: '2025-05-19',
            published: false
          }
        ]
      }).as('getPostsRequest');
      
      cy.visit('/admin/posts');
    });

    it('should display the list of posts', () => {
      // Wait for API request to complete
      cy.wait('@getPostsRequest');
      
      // Verify posts are displayed
      cy.contains('Test Post 1').should('be.visible');
      cy.contains('Test Post 2').should('be.visible');
      
      // Verify published status indicators
      cy.contains('tr', 'Test Post 1').within(() => {
        cy.get('[data-published="true"]').should('exist');
      });
      
      cy.contains('tr', 'Test Post 2').within(() => {
        cy.get('[data-published="false"]').should('exist');
      });
    });

    it('should navigate to create new post page', () => {
      cy.contains('Add New Post').click();
      cy.url().should('include', '/admin/posts/new');
    });

    it('should navigate to edit post page', () => {
      cy.wait('@getPostsRequest');
      
      // Click edit button for first post
      cy.contains('tr', 'Test Post 1').within(() => {
        cy.get('button[aria-label*="Edit"]').click();
      });
      
      // Verify URL changed to edit page
      cy.url().should('include', '/admin/posts/post-1');
    });

    it('should delete a post', () => {
      // Mock delete API call
      cy.intercept('DELETE', '/api/admin/posts/post-2', {
        statusCode: 200,
        body: { success: true }
      }).as('deletePostRequest');
      
      cy.wait('@getPostsRequest');
      
      // Trigger delete action
      cy.contains('tr', 'Test Post 2').within(() => {
        cy.get('button[aria-label*="Delete"]').click();
      });
      
      // Confirm delete in dialog
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Confirm').click();
      });
      
      // Wait for delete request to complete
      cy.wait('@deletePostRequest');
      
      // Verify success message
      cy.contains('Post deleted successfully').should('be.visible');
      
      // Verify post is removed from list
      cy.contains('Test Post 2').should('not.exist');
    });
  });

  describe('Projects Management', () => {
    beforeEach(() => {
      // Mock API response for projects list
      cy.intercept('GET', '/api/admin/projects', {
        statusCode: 200,
        body: [
          {
            id: 'project-1',
            title: 'Test Project 1',
            slug: 'test-project-1',
            description: 'This is test project 1',
            featured: true
          },
          {
            id: 'project-2',
            title: 'Test Project 2',
            slug: 'test-project-2',
            description: 'This is test project 2',
            featured: false
          }
        ]
      }).as('getProjectsRequest');
      
      cy.visit('/admin/projects');
    });

    it('should display the list of projects', () => {
      // Wait for API request to complete
      cy.wait('@getProjectsRequest');
      
      // Verify projects are displayed
      cy.contains('Test Project 1').should('be.visible');
      cy.contains('Test Project 2').should('be.visible');
      
      // Verify featured status indicators
      cy.contains('tr', 'Test Project 1').within(() => {
        cy.get('[data-featured="true"]').should('exist');
      });
      
      cy.contains('tr', 'Test Project 2').within(() => {
        cy.get('[data-featured="false"]').should('exist');
      });
    });

    it('should toggle project featured status', () => {
      // Mock API call for toggling featured status
      cy.intercept('PATCH', '/api/admin/projects/project-2', {
        statusCode: 200,
        body: {
          id: 'project-2',
          featured: true,
          title: 'Test Project 2'
        }
      }).as('updateProjectRequest');
      
      cy.wait('@getProjectsRequest');
      
      // Toggle featured status
      cy.contains('tr', 'Test Project 2').within(() => {
        cy.get('button[aria-label*="Toggle featured"]').click();
      });
      
      // Wait for update request to complete
      cy.wait('@updateProjectRequest');
      
      // Verify status has changed
      cy.contains('tr', 'Test Project 2').within(() => {
        cy.get('[data-featured="true"]').should('exist');
      });
      
      // Verify success message
      cy.contains('Project updated successfully').should('be.visible');
    });
  });

  describe('Pages Management', () => {
    beforeEach(() => {
      // Mock API response for pages list
      cy.intercept('GET', '/api/admin/pages', {
        statusCode: 200,
        body: [
          {
            id: 'page-1',
            title: 'Home Page',
            slug: 'home',
            updatedAt: '2025-05-20T10:00:00Z'
          },
          {
            id: 'page-2',
            title: 'About Page',
            slug: 'about',
            updatedAt: '2025-05-19T10:00:00Z'
          }
        ]
      }).as('getPagesRequest');
      
      cy.visit('/admin/pages');
    });

    it('should display the list of pages', () => {
      // Wait for API request to complete
      cy.wait('@getPagesRequest');
      
      // Verify pages are displayed
      cy.contains('Home Page').should('be.visible');
      cy.contains('About Page').should('be.visible');
    });

    it('should navigate to edit page', () => {
      cy.wait('@getPagesRequest');
      
      // Click edit button for about page
      cy.contains('tr', 'About Page').within(() => {
        cy.get('button[aria-label*="Edit"]').click();
      });
      
      // Verify URL changed to edit page
      cy.url().should('include', '/admin/pages/page-2');
    });

    it('should preview a page', () => {
      // Mock preview page in new tab
      cy.window().then(win => {
        cy.stub(win, 'open').as('windowOpen');
      });
      
      cy.wait('@getPagesRequest');
      
      // Click preview button
      cy.contains('tr', 'About Page').within(() => {
        cy.get('button[aria-label*="Preview"]').click();
      });
      
      // Verify window.open was called with correct URL
      cy.get('@windowOpen').should('be.calledWith', '/about');
    });
  });
});
