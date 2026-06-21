FROM node:20-alpine AS base
WORKDIR /app
# Alpine doesn't ship OpenSSL by default — Prisma's engine binaries need it
# to detect the correct libssl version, otherwise they fall back to a guess
# that can fail to load entirely ("Could not parse schema engine response").
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
# Copying node_modules from the BUILD stage, not deps — deps never ran
# `prisma generate`, so its node_modules/.prisma/client is missing entirely.
# Using build's node_modules here is what actually ships the generated
# Prisma Client into the runtime image.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]