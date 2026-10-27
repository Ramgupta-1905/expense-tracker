# ExpenseTracker

ExpenseTracker is a React/Vite income and expense tracker. The frontend currently
stores its data in the browser's LocalStorage, so it works without running the
API. An Express API is also available in `backend/` for persistent local JSON
storage and future frontend integration.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Run the backend

```bash
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:3001` by default. Copy `backend/.env.example`
to `backend/.env` to configure `PORT` or `CORS_ORIGIN`. During frontend
development, Vite forwards `/api` requests to the backend.

### API routes

- `GET /api/health`
- `GET`, `POST /api/transactions`
- `PUT`, `DELETE /api/transactions/:id`
- `GET`, `POST /api/categories`
- `PUT`, `DELETE /api/categories/:name`

Backend data is written to `backend/data/store.json`. It is intentionally ignored
by Git so that local transaction data is not published.
