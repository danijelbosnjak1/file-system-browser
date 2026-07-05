# Project Structure

This project should be organized as a small monorepo with separate frontend and backend applications.

## Recommended Layout

```text
file-system-browser/
  README.md
  PROJECT_STRUCTURE.md

  backend/
    README.md
    package.json
    src/
      app.js
      server.js

      common/
        database.js
        models/
          FileSystemNode.js

      db/
        connection.js
        schema.sql
        seed.js

      routes/
        nodes.routes.js
        search.routes.js

      controllers/
        nodes.controller.js
        search.controller.js

      services/
        nodes.service.js
        search.service.js

      repositories/
        nodes.repository.js

      middleware/
        errorHandler.js
        validateRequest.js

      utils/
        errors.js

    tests/
      nodes.test.js
      search.test.js

  frontend/
    README.md
    package.json
    index.html
    src/
      main.jsx
      App.jsx

      api/
        client.js
        nodesApi.js
        searchApi.js

      components/
        FileBrowser.jsx
        Breadcrumbs.jsx
        Toolbar.jsx
        CreateItemForm.jsx
        SearchBox.jsx
        ItemList.jsx
        ItemRow.jsx

      styles/
        index.css
        app.css
```

## Root Folder

The root folder should contain project-level documentation and shared setup files.

Responsibilities:

- Explain how to run the full project
- Explain assumptions
- Link to frontend and backend instructions
- Optionally hold Docker Compose later

## Backend Folder

The backend owns the API, database, validation, and filesystem behavior.

Suggested responsibility split:

```text
routes -> controllers -> services -> repositories -> database
```

### `routes/`

Defines API URLs and connects them to controller functions.

Examples:

- `nodes.routes.js`
- `search.routes.js`

### `controllers/`

Handles HTTP request and response logic.

Controllers should:

- Read request params/body/query
- Call services
- Return JSON responses
- Pass errors to middleware

### `services/`

Contains business logic.

Examples:

- Validate that a parent is a folder
- Prevent deleting the root folder
- Recursively delete folder descendants
- Decide whether search is scoped to one parent or all files

### `repositories/`

Contains database queries.

Repositories should:

- Create nodes
- Find nodes by ID
- List children by `parentId`
- Search by exact name
- Search by prefix
- Delete nodes

### `db/`

Contains database setup.

Examples:

- Database connection
- SQL schema
- Seed script for root folder

### `common/`

This project currently uses a tutorial-friendly `common/` folder for Sequelize setup.

Current files:

- `common/database.js`: creates the SQLite connection
- `common/models/FileSystemNode.js`: defines the file/folder node model

This can stay as-is, or later be moved into `db/` and `models/` if you want a more conventional backend structure.

### `middleware/`

Contains reusable Express middleware.

Examples:

- Error handler
- Request validation

### `tests/`

Contains backend tests.

Priority tests:

- Create folder
- Create file
- List folder contents
- Delete file
- Delete folder recursively
- Exact search
- Prefix suggestions
- Reject duplicate names in same folder

## Frontend Folder

The frontend owns the React app.

### `api/`

Keeps fetch/API logic away from components.

Suggested files:

- `client.js`: shared fetch wrapper
- `nodesApi.js`: list/create/delete node requests
- `searchApi.js`: search and suggestions requests

### `components/`

Contains UI components for the file browser.

Suggested files:

- `FileBrowser.jsx`: main stateful browser component
- `Breadcrumbs.jsx`: current folder path
- `Toolbar.jsx`: create/search controls
- `CreateItemForm.jsx`: create file/folder form
- `SearchBox.jsx`: search input and suggestions
- `ItemList.jsx`: list of current folder contents
- `ItemRow.jsx`: one file or folder row

### `styles/`

Contains CSS files.

The current scaffold still has CSS beside `App.jsx`, which is fine for a blank project. As the app grows, move shared styles into `src/styles/`.

## Minimal Version

If you want to move faster during the interview task, this smaller structure is also acceptable:

```text
file-system-browser/
  backend/
    src/
      server.js
      db.js
      nodes.js
      search.js

  frontend/
    src/
      App.jsx
      main.jsx
      api.js
      components/
```

The fuller structure is better for explaining clean separation. The minimal structure is better for moving quickly.
