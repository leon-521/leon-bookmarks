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
RUN set -eu; \
    css_dir="/app/apps/web/.next/static/css"; \
    css_files="$(find "$css_dir" -type f -name '*.css')"; \
    test -n "$css_files"; \
    found=; for css in $css_files; do if grep -Fq '.min-h-screen' "$css"; then found=1; break; fi; done; test -n "$found"

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
