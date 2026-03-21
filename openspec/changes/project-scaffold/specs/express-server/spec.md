## ADDED Requirements

### Requirement: Health check endpoint
The server SHALL expose a `GET /health` endpoint that returns HTTP 200 with `{ "status": "ok" }` as JSON.

#### Scenario: Health check responds
- **WHEN** a GET request is made to `/health`
- **THEN** the server responds with status 200 and body `{ "status": "ok" }`

### Requirement: App factory function
The server SHALL export a `createApp()` function from `src/app.js` that returns a configured Express application without starting the listener.

#### Scenario: App creation without listening
- **WHEN** `createApp()` is called
- **THEN** it returns an Express app instance that is not yet listening on any port

### Requirement: Server startup
The entry point `src/index.js` SHALL load environment variables from `.env` via dotenv, create the app via `createApp()`, and start listening on the port specified by `PORT` env var (default: 3000).

#### Scenario: Default port
- **WHEN** `PORT` is not set
- **THEN** the server listens on port 3000

#### Scenario: Custom port
- **WHEN** `PORT` is set to `4000`
- **THEN** the server listens on port 4000

### Requirement: Environment example file
The project SHALL include a `.env.example` file documenting all required and optional environment variables with placeholder values.

#### Scenario: .env.example exists
- **WHEN** a developer clones the repository
- **THEN** `.env.example` is present with documented variables and can be copied to `.env`

### Requirement: JSON body parsing
The Express app SHALL parse JSON request bodies by default.

#### Scenario: JSON body parsed
- **WHEN** a request with `Content-Type: application/json` and a JSON body is received
- **THEN** the parsed body is available on `req.body`

### Requirement: Test infrastructure
The project SHALL use Vitest as the test runner with a `test` npm script.

#### Scenario: Run tests
- **WHEN** `npm test` is executed
- **THEN** Vitest runs all `*.test.js` files and reports results
