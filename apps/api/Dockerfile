# ═══════════════════════════════════════════════
# Leon Bookmarks API - Dockerfile
# ═══════════════════════════════════════════════

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Build ──
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN cd apps/api && npx prisma generate && pnpm build

# ── Production ──
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./package.json

EXPOSE 4000

CMD ["node", "dist/main.js"]
