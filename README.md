<<<<<<< HEAD
# INVNTRY — Inventory & Order Management System

Full-stack app: **FastAPI** backend · **PostgreSQL** database · **React** frontend · **Docker Compose** orchestration.

---

## Project Structure

```
invntry/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── config.py          # env-var settings via pydantic-settings
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── routers/
│       ├── products.py
│       ├── customers.py
│       ├── orders.py
│       └── inventory.py
├── frontend/
│   ├── Dockerfile         # multi-stage: dev → build → nginx
│   ├── nginx.frontend.conf
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.js         # layout + toast context + routing
│       ├── api.js         # axios API client
│       └── pages/
│           ├── Dashboard.js
│           ├── Products.js
│           ├── Customers.js
│           ├── Orders.js
│           └── Inventory.js
├── nginx/
│   └── nginx.conf         # reverse proxy (production)
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## Business Rules Implemented

| Rule | Where |
|---|---|
| Unique product SKU | `products.py` — 400 if duplicate |
| Unique customer email | `customers.py` — 400 if duplicate |
| Stock validation on order | `orders.py` — 400 with clear message |
| Automatic stock reduction | `orders.py` — deducted atomically on create |
| Stock restoration on cancel | `orders.py` — restored when status → cancelled |
| Negative quantity guard | `inventory.py` — 400 if quantity < 0 |
| Price must be positive | `schemas.py` — Pydantic validator |
| Order must have ≥1 item | `orders.py` — 400 if items list empty |

---

## Local Development (Docker)

### 1. Clone & configure

```bash
git clone <your-repo>
cd invntry
cp .env.example .env
# Edit .env — change POSTGRES_PASSWORD at minimum
```

### 2. Start all services

```bash
docker compose up --build
```

| Service  | URL |
|---|---|
| React frontend | http://localhost:3000 |
| FastAPI backend | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

### 3. Useful commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop and wipe the database volume
docker compose down -v
```

---

## Environment Variables

All configuration is via environment variables — **no hardcoded credentials**.

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `postgres` | DB username |
| `POSTGRES_PASSWORD` | `postgres` | DB password — **change in prod** |
| `POSTGRES_DB` | `inventory_db` | Database name |
| `APP_ENV` | `development` | `development` or `production` |
| `REACT_APP_API_URL` | `""` | Public backend URL (production only) |

The backend constructs `DATABASE_URL` automatically from the Postgres vars via Docker Compose.

---

## Production Build

```bash
# Build optimised images (React is compiled, no hot-reload)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

The production stack runs:
- FastAPI with 4 Uvicorn workers
- React as a pre-built static bundle served by nginx
- nginx reverse proxy routing `/api/*` → backend, `/` → frontend

---

## Free Hosting Deployment

### Option A — Railway (recommended, easiest)

Railway supports Docker Compose natively.

1. Push your repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Railway auto-detects `docker-compose.yml` and provisions all services
4. Add a **PostgreSQL** plugin via the Railway dashboard
5. Set environment variables in Railway's Variables panel:
   ```
   POSTGRES_PASSWORD=<strong-password>
   APP_ENV=production
   REACT_APP_API_URL=https://<your-backend-service>.up.railway.app
   ```
6. Railway assigns public URLs to each service automatically

### Option B — Render

Deploy backend and frontend as separate Render services:

**Backend (Web Service)**
- Runtime: Docker
- Root directory: `backend/`
- Add a **Render PostgreSQL** database and copy the connection string to:
  ```
  DATABASE_URL=<render-postgres-connection-string>
  APP_ENV=production
  ```

**Frontend (Static Site)**
- Build command: `npm run build`
- Publish directory: `build`
- Root directory: `frontend/`
- Environment variable:
  ```
  REACT_APP_API_URL=https://<your-backend>.onrender.com
  ```

### Option C — Fly.io

```bash
# Install flyctl, then:
fly launch --dockerfile backend/Dockerfile   # deploy backend
fly launch --dockerfile frontend/Dockerfile  # deploy frontend
fly postgres create                           # managed Postgres
fly secrets set POSTGRES_PASSWORD=<secret> DATABASE_URL=<postgres-url>
```

---

## API Reference

Full interactive docs at `http://localhost:8000/docs` (Swagger UI).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products/` | List all products |
| POST | `/api/products/` | Create product (auto-creates inventory) |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/customers/` | List customers |
| POST | `/api/customers/` | Create customer |
| GET | `/api/orders/` | List orders |
| POST | `/api/orders/` | Create order (validates & deducts stock) |
| PATCH | `/api/orders/{id}/status` | Update order status |
| GET | `/api/inventory/` | List all inventory |
| GET | `/api/inventory/low-stock` | Items at/below threshold |
| PUT | `/api/inventory/{product_id}` | Manually adjust stock |
| GET | `/api/inventory/stats/dashboard` | Dashboard summary stats |
=======
# invntry
This is an Inventory &amp; Order Management System built with FastAPI , SQLAlchemy , PostgreSQL , React and  Deployed using Docker and  Nginx
>>>>>>> 102704070e7ef14ef5c473e91c31dc41eda7240c
