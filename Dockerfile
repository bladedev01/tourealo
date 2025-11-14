# Multi-stage Dockerfile for Next.js (frontend-next)
# Builds the app and serves it with `next start` in production mode

FROM node:20-alpine AS deps
WORKDIR /app
# Copy only package manifests to leverage layer caching
COPY package.json package-lock.json* ./
RUN npm ci --production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm","start"]
