# Deploying HARBOUR·OS on Portainer

Step-by-step guide, from zero to a running ops hub behind HTTPS.

---

## 0 · What you need

- A machine with **Docker** running and **Portainer** managing it
  (single Docker host / "standalone" environment is the common case and
  the one this guide targets)
- ~1 GB free RAM for the image build (or pre-build the image — see §6)
- Optional: a domain name if you want `https://ops.yourclub.org`

> **Using Docker Swarm instead of a standalone host?**
> Swarm can't build images — jump to §6, pre-build the image, and use the
> `image:` variant of the stack described there.

---

## 1 · Put the code in a git repo Portainer can reach

Portainer's git stacks clone your repo onto the host and build from it.

```bash
# on your computer, inside the project folder
git init
git add .
git commit -m "harbour-os"
git remote add origin https://github.com/<you>/harbour-os.git
git push -u origin main
```

Any host works: GitHub, GitLab, or a Gitea/Forgejo instance running on the
same box. Private repo? You'll add a **personal access token** in step 2.

---

## 2 · Create the stack in Portainer

1. Open Portainer → pick your environment → **Stacks** → **+ Add stack**.
2. **Name:** `harbour-os`
3. **Build method:** choose **Repository** and fill in:
   - **Repository URL:** `https://github.com/<you>/harbour-os`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:** `compose.yaml`
   - Private repo → enable **Authentication**, username + access token.
4. **Environment variables** — the important part. Add:

   | Key | Example | What it does |
   | --- | --- | --- |
   | `POSTGRES_PASSWORD` | `a-long-random-string` | **Change this.** DB password |
   | `CENTRE_NAME` | `Westbay Sailing Academy` | Shown in the UI |
   | `CENTRE_LAT` | `50.7290` | Weather location (right-click your slipway on openstreetmap.org) |
   | `CENTRE_LON` | `-2.7640` | Weather location |
   | `CENTRE_TZ` | `Europe/London` | Timezone for clock & weather |

   *(Leave anything unset and the defaults from `compose.yaml` apply.)*

5. Click **Deploy the stack**.

---

## 3 · Watch it come up

**Stacks → harbour-os → Containers** (or **Logs**). Expected timeline:

1. `db` starts and becomes healthy (~5–10 s)
2. `app` builds on first deploy (2–5 min), then starts and logs:

```
[harbour-os] waiting for database… (1/25)   ← maybe a couple of these
[harbour-os] database schema is up to date
```

3. Open `http://<server-ip>:3000` — the app greets you with a fresh-install
   screen and a **Load demo data** button. Use it to explore; when you're
   ready, clear it (see §7) and enter real boats and members.

---

## 4 · Port already in use?

Edit the stack (**Editor** tab) and change only the left-hand side:

```yaml
    ports:
      - "8090:3000"
```

Then **Update the stack** and browse to `http://<server-ip>:8090`.

---

## 5 · Put it on a domain with HTTPS (recommended)

Any reverse proxy works. With **Nginx Proxy Manager** (itself a Portainer stack):

1. Proxy Host → domain `ops.yourclub.org` → forward to the app.
   - Same Docker host: forward to `host.docker.internal:3000`
     (or the host's LAN IP), or attach NPM to the `harbour-os_default`
     network and forward to `app:3000`.
2. **SSL** tab → Request Let's Encrypt certificate → **Force SSL**.

The app needs no extra configuration for this.

---

## 6 · Pre-building the image (Swarm, weak servers, or no git)

```bash
# on any machine with Docker (can be the same host over SSH)
git clone https://github.com/<you>/harbour-os.git && cd harbour-os
docker build -t ghcr.io/<you>/harbour-os:latest .
docker push ghcr.io/<you>/harbour-os:latest
```

Then change one line in the stack editor:

```yaml
  app:
    image: ghcr.io/<you>/harbour-os:latest   # replaces `build: .`
    restart: unless-stopped
    ...
```

Add the registry in **Portainer → Registries** if the image is private
(also avoids Docker Hub pull rate limits).

*Alternative without a registry — build directly on the host and use
`image: harbour-os:local`.*

---

## 7 · Backups, updates, resets

**Backup (all data lives in the `harbour-os_harbour_db` volume):**

```bash
docker exec $(docker ps -qf name=harbour-os-db) \
  pg_dump -U sailing sailing | gzip > harbour-os-$(date +%F).sql.gz
```

**Update to a new version:** Stacks → harbour-os → **Pull and redeploy**
(git stacks), or bump the image tag and **Update the stack**.
Migrations run automatically on boot.

**Remove the demo data and start clean** (or fully reset):

```bash
docker exec $(docker ps -qf name=harbour-os-db) \
  psql -U sailing -c "TRUNCATE bookings, sorties, issues, sessions, boats, members CASCADE;"
```

---

## 8 · Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| App logs repeat `waiting for database…` | DB still starting (first boot) — give it a minute. Persistent? Check `POSTGRES_PASSWORD` didn't change after first deploy (the volume keeps the old one; reset the volume or match the old password). |
| Weather panel shows "unavailable" | Host has no outbound internet, or `CENTRE_LAT`/`CENTRE_LON` are wrong. Weather needs access to `api.open-meteo.com`. |
| Build step runs out of memory | Pre-build the image somewhere stronger (§6). |
| `address already in use` | Port 3000 taken — §4. |
| Want to disable boot-time migrations | Add `DB_MIGRATE=false` to the app's environment. |
