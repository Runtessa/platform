# syntax=docker/dockerfile:1.7
FROM docker.io/library/node:22-alpine

WORKDIR /app

COPY LICENSE NOTICE THIRD_PARTY_NOTICES.md /app/
COPY licenses /app/licenses


ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_PREFER_OFFLINE=true
ENV NPM_CONFIG_FETCH_RETRIES=10
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=300000
ENV NPM_CONFIG_FETCH_TIMEOUT=1800000

COPY .docker-build/monitoring/package.json ./
COPY .docker-build/monitoring/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,id=npm-monitoring,sharing=locked \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY .docker-build/monitoring/dist ./dist
COPY .docker-build/monitoring/package.json ./dist/package.json

RUN mkdir -p /app/certs && chown -R node:node /app
USER node

ENV NODE_ENV=production \
    MONITORING_HOST=0.0.0.0 \
    MONITORING_PORT=3011 \
    MONITORING_TLS_REQUIRED=true \
    MONITORING_TLS_ENABLED=true \
    MONITORING_TLS_AUTO_SELF_SIGNED=true \
    MONITORING_TLS_KEY_PATH=/app/certs/server.key \
    MONITORING_TLS_CERT_PATH=/app/certs/server.crt

EXPOSE 3011

CMD ["node", "dist/index.js"]
