# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
# We don't have a build script for backend yet, so we just use the source with ts-node in prod or transpile if needed.
# Let's add a build script to package.json for production efficiency.

# Production stage
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./

EXPOSE 8000

CMD ["npx", "ts-node", "src/index.ts"]
