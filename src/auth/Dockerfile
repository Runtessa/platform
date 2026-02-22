FROM node:20-bullseye-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ARG USE_PREBUILT=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN if [ "$USE_PREBUILT" != "true" ]; then npm run build; fi

FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_HOST=0.0.0.0
ENV AUTH_PORT=3015

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/branding.json ./branding.json

EXPOSE 3015

CMD ["npm", "run", "start"]
