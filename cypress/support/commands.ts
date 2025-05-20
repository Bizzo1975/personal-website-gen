/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to simulate pressing tab key
       * @example cy.tab()
       */
      tab(): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to simulate pressing shift+tab keys
       * @example cy.tabBack()
       */
      tabBack(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Command to simulate pressing tab key
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  const focusableTags = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ];
  
  const subjectElement = subject ? cy.wrap(subject) : cy.focused().should('exist');
  
  return subjectElement.then($el => {
    const focusableElements = Cypress.$(focusableTags.join(', ')).filter(':visible');
    const currentIndex = focusableElements.index($el);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    
    return cy.wrap(focusableElements.eq(nextIndex)).focus();
  });
});

// Command to simulate pressing shift+tab keys
Cypress.Commands.add('tabBack', { prevSubject: 'optional' }, (subject) => {
  const focusableTags = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ];
  
  const subjectElement = subject ? cy.wrap(subject) : cy.focused().should('exist');
  
  return subjectElement.then($el => {
    const focusableElements = Cypress.$(focusableTags.join(', ')).filter(':visible');
    const currentIndex = focusableElements.index($el);
    const previousIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
    
    return cy.wrap(focusableElements.eq(previousIndex)).focus();
  });
});