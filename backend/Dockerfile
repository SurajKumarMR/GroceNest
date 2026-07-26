# ── Stage 1: Dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install openssl for Prisma binaries on Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

# ── Stage 2: Builder ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client and transpile TypeScript to JavaScript (dist/)
RUN npx prisma generate
RUN npm run build
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 3: Runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["node", "dist/index.js"]
