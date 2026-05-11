# ── Build stage ──
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage ──
FROM nginx:alpine

# Copy built assets
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy nginx config with gzip, caching, security headers, and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
