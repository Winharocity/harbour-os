# Base images default to Google's Docker Hub mirror (mirror.gcr.io), which has
# solid IPv4 *and* IPv6 routing — works on hosts where docker.io is unreachable.
# Override at build time with: --build-arg NODE_IMAGE=node:20-alpine
ARG NODE_IMAGE=mirror.gcr.io/library/node:20-alpine

# ---------- dependencies ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# package-lock.json is optional: `npm ci` when it exists, `npm install` otherwise
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

# ---------- build ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL is only needed at runtime; give the build a harmless placeholder
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run build

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
