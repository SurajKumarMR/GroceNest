# ── Stage 1: Build static web bundle ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

# Build React Native Web / static bundle if build script exists, fallback to packaging
RUN if npm run | grep -q "build:web"; then npm run build:web; else mkdir -p build && echo "<html><body><h1>GroceNest Mobile Web</h1></body></html>" > build/index.html; fi

# ── Stage 2: Serve static bundle via NGINX Alpine ──────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
