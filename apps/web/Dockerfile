# ═══════════════════════════════════════════════
# Leon Bookmarks Web - Dockerfile
# ═══════════════════════════════════════════════

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Build ──
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && pnpm build

# ── Production ──
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
