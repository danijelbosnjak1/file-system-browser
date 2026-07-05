# File System Browser

A browser-based file system app with a React frontend, Express API, and SQLite database. Users can create folders, create files by name, browse nested folders, search files by exact name, view top 10 prefix suggestions, and delete files or folders.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express
- Database: SQLite with Sequelize
- Tests: Node test runner, Vitest, Playwright

## Project Structure

```text
file-system-browser/
  backend/          Express API, Sequelize models, SQLite storage
  frontend/         React app
  tests/e2e/        Playwright full-stack smoke test
  docker-compose.yml
```

## Prerequisites

- Node.js
- npm
- Optional: Docker and Docker Compose

If you use `nvm`, load it first:

```bash
source ~/.nvm/nvm.sh
```

## Install

From the project root:

```bash
npm install
```

## Run In Debug Mode

Start the backend in one terminal:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev:frontend
```

Open:

```text
http://localhost:5173
```

The frontend uses `http://localhost:3000` as the default API URL. To point it somewhere else, set `VITE_API_BASE_URL` before starting or building the frontend.

## Build

Build the frontend production bundle:

```bash
npm run build
```

The compiled frontend is written to:

```text
frontend/dist
```

The backend does not require a compile step. It runs with:

```bash
npm run dev:backend
```

## Deploy With Docker

Docker is optional, but included as a convenient deployment path.

Build and start both services:

```bash
docker compose up --build
```

Open:

```text
http://localhost:5173
```

The API is exposed at:

```text
http://localhost:3000
```

SQLite data is persisted in the `backend-storage` Docker volume.

To stop the app:

```bash
docker compose down
```

To remove persisted database data too:

```bash
docker compose down -v
```

## Deploy Without Docker

1. Install dependencies:

```bash
npm install
```

2. Build the frontend:

```bash
VITE_API_BASE_URL=https://your-api-host.example.com npm run build
```

3. Serve `frontend/dist` with any static file host, such as nginx, Netlify, Vercel static hosting, or a CDN.

4. Deploy the backend as a Node.js service:

```bash
cd backend
npm install --omit=dev
node src/server.js
```

5. Make sure the backend has write access to `backend/storage`, because SQLite stores the database there.

## Tests

Run backend integration tests:

```bash
npm run test:backend
```

Run frontend unit and component tests:

```bash
npm run test:frontend
```

Run the Playwright E2E smoke test:

```bash
npx playwright install
npm run test:e2e
```

Run backend and frontend non-E2E tests:

```bash
npm test
```

## API Summary

- `GET /status`
- `GET /items?parentId=<id>`
- `POST /folders`
- `POST /files`
- `DELETE /items/:id`
- `GET /search?query=<name>&scope=parent|all&parentId=<id>`
- `GET /suggestions?prefix=<text>&scope=parent|all&parentId=<id>&limit=10`
