// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

/// <reference types="Cypress" />

type Chainable<Subject = any> = Cypress.Chainable<Subject>;

type User = {
  id: string;
  username: string;
  name: string;
  is_admin: boolean;
  is_verified: boolean;
};

function getCy(cyName: string): Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-cy=${cyName}]`);
}

/**
 * Deletes all users with username starting 'test'.
 */
function serverCommand(command: "clearTestUsers"): Chainable<{
  success: true;
}>;

/**
 * Deletes all organizations with slug starting 'test'.
 */
function serverCommand(command: "clearTestOrganizations"): Chainable<{
  success: true;
}>;

/**
 * Creates a verified or unverified user, bypassing all safety checks.
 * Redirects to `next`.
 *
 * Default values:
 *
 * - username: `testuser`
 * - email: `${username}@example.com`
 * - verified: false
 * - name: `${username}`
 * - password: `TestUserPassword`
 * - next: `/`
 */
function serverCommand(
  command: "createUser",
  payload: {
    username?: string;
    email?: string;
    verified?: boolean;
    name?: string;
    password?: string;
    next?: string;
  }
): Chainable<{
  user: User;
  userEmailId: string;
  verificationToken: string | null;
}>;

/**
 * Gets the secrets for the specified email, allowing Cypress to perform email
 * validation. If unspecified, email defaults to `testuser@example.com`.
 */
function serverCommand(
  command: "getEmailSecrets",
  payload?: { email?: string }
): Chainable<{
  user_email_id: string;
  verification_token: string | null;
}>;

/**
 * Marks the given user as verified. Used for testing live user subscription
 * updates.
 */
function serverCommand(
  command: "verifyUser",
  payload?: { username?: string }
): Chainable<{ success: true }>;

// The actual implementation of the 'serverCommand' function.
function serverCommand(command: string, payload?: any): any {
  const url = `${Cypress.env(
    "ROOT_URL"
  )}/cypressServerCommand?command=${encodeURIComponent(command)}${
    payload ? `&payload=${encodeURIComponent(JSON.stringify(payload))}` : ""
  }`;
  // GET the url, and return the response body (JSON is parsed automatically)
  return cy.request(url).its("body");
}

function login(payload?: {
  next?: string;
  username?: string;
  name?: string;
  verified?: boolean;
  password?: string;
  orgs?: [[string, string] | [string, string, boolean]];
}): Chainable<Cypress.AUTWindow> {
  const { next = "/", ...rest } = payload ?? {};
  cy.request(
    Cypress.env("ROOT_URL") +
      `/cypressServerCommand?command=login&payload=${encodeURIComponent(
        JSON.stringify(rest)
      )}`
  );
  return cy.visit(Cypress.env("WEB_URL") + next);
}

function clearTestUsers() {
  // Wait 500ms for previous page loads to finish. Otherwise, the attachment
  // of a subscription controller on login can occur right as a test user is
  // being cleared, causing a client error.
  cy.wait(500);
  return serverCommand("clearTestUsers");
}

function waitForHydration() {
  // Wait for the navigation to start, so that the subsequent `get` call doesn't
  // find the element on the page we are navigating *away* from. This appears to
  // be a race condition.
  cy.wait(Cypress.config("isInteractive") ? 500 : 1000);
  // Wait for the `sveltekit-hydrated` element to be added to the page after every
  // visit. This ensures that we don't interact with the client until it is fully
  // hydrated.
  cy.get("#sveltekit-hydrated", { timeout: 10000 });
  // Wait for any handlers on the target page to be registered. Otherwise we
  // could e.g. click on a form button right as the page loads, before the
  // validation is attached.
  cy.wait(Cypress.config("isInteractive") ? 500 : 1000);
}

Cypress.Commands.add("getCy", getCy);
Cypress.Commands.add("serverCommand", serverCommand);
Cypress.Commands.add("clearTestUsers", clearTestUsers);
Cypress.Commands.add("waitForHydration", waitForHydration);
Cypress.Commands.add("login", login);

Cypress.Commands.overwrite("visit", (originalFn, url) => {
  originalFn(url);
  cy.waitForHydration();
});

export {}; // Make this a module so we can `declare global`

declare global {
  namespace Cypress {
    interface Chainable {
      getCy: typeof getCy;
      serverCommand: typeof serverCommand;
      login: typeof login;
      clearTestUsers: typeof clearTestUsers;
      waitForHydration: typeof waitForHydration;
    }
  }
}
