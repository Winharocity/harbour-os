# Deployment Guide

## Portainer / Docker Compose

This project is structured for deployment via Portainer using the root `compose.yaml` file.

### Recommended setup
- Compose path: `/app/compose.yaml`
- Dockerfile path: `/app/Dockerfile`
- Environment file: `.env` (not committed to GitHub)

### Example environment

```env
NEXT_PUBLIC_APP_NAME=Harbour OS
DATABASE_URL=postgresql://postgres:postgres@db:5432/harbour
PORT=3000
```

### Build and run

```bash
docker compose up --build -d
```

## Notes
- Keep your real `.env` file local and never commit it.
- The repo includes `.env.example` as a template only.
- Portainer reads `compose.yaml` automatically unless you change the configure path.
