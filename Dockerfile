# syntax=docker/dockerfile:1

# ---- Build stage -------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Production URLs live in src/environments/environment.production.ts (applied via
# fileReplacements in the production build). Optionally override them at build:
#   --build-arg API_URL=... --build-arg SITE_URL=...
ARG API_URL=
ARG SITE_URL=
RUN if [ -n "$API_URL" ]; then \
      sed -i "s|apiUrl: '.*'|apiUrl: '${API_URL}'|" src/environments/environment.production.ts; \
    fi \
  && if [ -n "$SITE_URL" ]; then \
      sed -i "s|siteUrl: '.*'|siteUrl: '${SITE_URL}'|" src/environments/environment.production.ts; \
    fi

# Builds both the browser bundle and the SSR server (server.mjs).
RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force

# ---- Runtime stage (Node SSR server) -----------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4000
# Restrict SSR to your real domain(s) in production (comma-separated), e.g.:
#   -e NG_ALLOWED_HOSTS=www.tudominio.com,tudominio.com
# If unset, any host is allowed (safe here: URLs come from environment, not the request).
WORKDIR /app

# tini as PID 1 for correct signal handling / zombie reaping.
RUN apk add --no-cache tini

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

USER node

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/tienda-textiles-landing/server/server.mjs"]
