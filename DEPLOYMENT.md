# Gakushu Nihongo — deployment

## Target architecture

- Frontend: Vercel (Vite/React)
- Backend: Render (FastAPI)
- MongoDB: MongoDB Atlas M0
- MySQL: Aiven MySQL Free

## Render

Create a Web Service from this repository. `render.yaml` is included.

Required environment variables:

- `MONGO_URL`
- `DB_NAME=gakushu`
- `MYSQL_URL=mysql+aiomysql://...`
- `JWT_SECRET`
- `CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app`
- `APP_TZ=Asia/Jakarta`

Health check: `/api/health`

## Vercel

Set Root Directory to `frontend`. Build command is `npm run build`; output is `dist`.

Set environment variable:

`VITE_API_URL=https://YOUR-RENDER-DOMAIN.onrender.com/api`

The local development fallback remains `/api`, which Vite proxies to `http://localhost:8001`.

## Database initialization

The FastAPI startup initializes the MySQL schema. Seed MongoDB once after the Atlas database is configured:

```bash
cd backend
python seed.py
python seed_strokes.py
```

Do not add the seed scripts to the web-service startup command.

## Security

Do not commit real `.env` files or database credentials. Use Render/Vercel environment variables. Use a long random `JWT_SECRET`. Keep `CORS_ORIGINS` restricted to the actual frontend origin.

## Free-tier caveat

The selected services are intended here for a small/demo workload. Free tiers have resource limits and may sleep when idle.
