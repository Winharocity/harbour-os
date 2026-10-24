# Harbour OS

A modern Next.js app scaffold for Harbour OS, ready for Docker and Portainer deployment.

## Features
- Next.js 14 app router
- TypeScript
- Drizzle ORM with PostgreSQL
- Docker + compose support
- Portainer-friendly structure

## Getting started

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## Database

```bash
npm run db:generate
npm run db:migrate
```

## Docker

```bash
docker compose up --build
```

## Deployment

See `DEPLOYMENT.md` for Portainer and production notes.
