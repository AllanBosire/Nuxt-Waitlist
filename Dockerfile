FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-*.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm nuxt prepare && pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/server/database ./server/database
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

COPY entrypoint.sh .

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
