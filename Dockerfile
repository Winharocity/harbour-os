# Base images default to Google's Docker Hub mirror (mirror.gcr.io), which has
# solid IPv4 *and* IPv6 routing — works on hosts where docker.io is unreachable.
# Override at build time with: --build-arg NODE_IMAGE=node:20-alpine
ARG NODE_IMAGE=mirror.gcr.io/library/node:20-alpine

# ---------- dependencies ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# package-lock.json is optional. Install strategy: try `npm ci` first; if the
# lockfile is stale/missing fall back to `npm install`; if registry.npmjs.org
# is unreachable from the host, fall back to the npmmirror.com registry.
COPY package.json package-lock.json* ./
RUN set -ux; \
    if [ -f package-lock.json ] && npm ci --no-audit --no-fund; then \
      echo "[deps] installed with npm ci"; \
    elif npm install --no-audit --no-fund; then \
      echo "[deps] installed with npm install"; \
    else \
      echo "[deps] registry.npmjs.org unreachable — trying npmmirror.com"; \
      npm install --no-audit --no-fund --registry=https://registry.npmmirror.com; \
    fi

# ---------- build ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
# NODE_OPTIONS caps the JS heap so the build survives on small containers
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=1024
COPY --from=deps /app/node_modules ./node_modules
# Copy only what the build needs (Context excludes the rest via .dockerignore)
COPY package.json package-lock.json* next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs drizzle.config.json ./
COPY src ./src
COPY public ./public
COPY drizzle ./drizzle
COPY .env.example ./.env.example
# DATABASE_URL is only needed at runtime; give the build a harmless placeholder
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}
# Fail loudly and name the exact culprit if the repo upload was incomplete
RUN echo "==> verifying build inputs:" && \
    for f in package.json next.config.ts tsconfig.json postcss.config.mjs src/app/globals.css src/app/layout.tsx src/app/page.tsx src/db/schema.ts src/lib/actions.ts; do \
      test -f "$f" && echo "  ok: $f" || { echo "!!! MISSING: $f (check your GitHub upload — this file didn't reach the repo)"; exit 1; }; \
    done && \
    echo "==> node $(node --version), npm $(npm --version)" && \
    test -d node_modules || { echo "!!! node_modules missing — deps stage failed"; exit 1; } && \
    npm run build && test -d .next

# ---------- runtime ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Drizzle SQL migrations are applied automatically on boot (see instrumentation.ts)
COPY --from=builder /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=4s --start-period=25s \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
