## ADDED Requirements

### Requirement: Dockerfile
The project SHALL include a Dockerfile based on `node:22-alpine` that installs production dependencies and runs `src/index.js`.

#### Scenario: Docker build and run
- **WHEN** `docker build -t spectopus .` and `docker run -p 3000:3000 spectopus` are executed
- **THEN** the server starts and responds to health check requests on port 3000

### Requirement: Docker ignore
The project SHALL include a `.dockerignore` file that excludes `node_modules`, `.env`, `.git`, and test files from the Docker build context.

#### Scenario: Sensitive files excluded
- **WHEN** a Docker image is built
- **THEN** `.env`, `node_modules`, `.git`, and `*.test.js` files are not included in the image
