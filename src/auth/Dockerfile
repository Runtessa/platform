# syntax=docker/dockerfile:1.7
FROM docker.io/library/node:22-alpine AS runner

WORKDIR /app

COPY LICENSE NOTICE THIRD_PARTY_NOTICES.md /app/
COPY licenses /app/licenses


ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_HOST=0.0.0.0
ENV AUTH_PORT=3015
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_PREFER_OFFLINE=true
ENV NPM_CONFIG_FETCH_RETRIES=10
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=300000
ENV NPM_CONFIG_FETCH_TIMEOUT=1800000

COPY .docker-build/auth/package.json ./
COPY .docker-build/auth/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,id=npm-auth,sharing=locked \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY .docker-build/auth/.next ./.next
COPY .docker-build/auth/dist ./dist
COPY .docker-build/auth/public ./public
COPY .docker-build/auth/migrations ./migrations
COPY .docker-build/auth/next.config.mjs ./next.config.mjs
COPY .docker-build/auth/branding.json ./branding.json

EXPOSE 3015

CMD ["npm", "run", "start"]
