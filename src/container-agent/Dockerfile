# syntax=docker/dockerfile:1.7
FROM node:22-alpine

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

COPY .docker-build/container-agent/package.json ./
COPY .docker-build/container-agent/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,id=npm-container-agent,sharing=locked \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY .docker-build/container-agent/dist ./dist
COPY .docker-build/container-agent/package.json ./dist/package.json

RUN mkdir -p /app/certs
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production \
    CONTAINER_MANAGER_HOST=0.0.0.0 \
    CONTAINER_MANAGER_PORT=4070 \
    CONTAINER_MANAGER_TLS_REQUIRED=true \
    CONTAINER_MANAGER_TLS_ENABLED=true \
    CONTAINER_MANAGER_TLS_AUTO_SELF_SIGNED=true \
    CONTAINER_MANAGER_TLS_KEY_PATH=/app/certs/server.key \
    CONTAINER_MANAGER_TLS_CERT_PATH=/app/certs/server.crt

EXPOSE 4070

CMD ["node", "dist/index.js"]
