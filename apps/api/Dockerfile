# ═══════════════════════════════════════════════
# Leon Bookmarks API - Dockerfile
# ═══════════════════════════════════════════════

FROM node:20-alpine AS base
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Build ──
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN cd apps/api && npx prisma generate && pnpm build

# ── Production ──
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

# Preserve pnpm workspace directory structure so relative symlinks in apps/api/node_modules resolve properly
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/tsconfig.json ./apps/api/tsconfig.json

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
