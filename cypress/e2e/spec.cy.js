describe('Resource Management Frontend', () => {
  let baseUrl;
  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
      cy.visit(baseUrl);
    });
  });
  after(() => {
    return cy.task('stopServer'); // Stop the server after the report is done
  });

  it('should show the student table', () => {
    // Intercept the API call that fetches students data
    cy.intercept('GET', '/read-student').as('getStudents');

    // Visit the page
    cy.visit('http://localhost:5050/');

    // Wait for the API request to finish
    cy.wait('@getStudents');

    // Now check if the table exists and has at least one row
    cy.get('table').should('exist');
    cy.get('table tbody tr').should('have.length.greaterThan', 0); // Ensure there is at least one row
  });

  it('should show the table headers correctly', () => {
    // Intercept the API call that fetches students data
    cy.intercept('GET', '/read-student').as('getStudents');

    // Visit the page
    cy.visit('http://localhost:5050/');

    // Wait for the API request to finish
    cy.wait('@getStudents');

    // Check if the table headers exist
    cy.get('table thead').should('exist');
    cy.get('table thead th').should('have.length', 6); // Ensure there are 6 headers

    // Verify that the headers are correct
    cy.get('table thead th').first().should('have.text', 'Number');
    cy.get('table thead th').eq(1).should('have.text', 'Admin Number');
    cy.get('table thead th').eq(2).should('have.text', 'Name');
    cy.get('table thead th').eq(3).should('have.text', 'Diploma');
    cy.get('table thead th').eq(4).should('have.text', 'cGPA');
    cy.get('table thead th').last().should('have.text', 'Actions');
  });
  it('should display the student data in the table', () => {
    // Intercept the API call that fetches students data
    cy.intercept('GET', '/read-student').as('getStudents');

    // Visit the page
    cy.visit('http://localhost:5050/');

    // Wait for the API request to finish
    cy.wait('@getStudents');

    // Check if the table exists and has data
    cy.get('table').should('exist');
    cy.get('table tbody tr').should('have.length.greaterThan', 0); // Ensure there is at least one row

    // Verify the first row has the expected student data
    cy.get('table tbody tr').first().within(() => {
      cy.get('td').eq(2).should('have.text', 'John Doe'); // Check if the first student's name is "John Doe"
    });
  });
});