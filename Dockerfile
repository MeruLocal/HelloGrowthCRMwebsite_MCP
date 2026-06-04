FROM node:22-alpine AS deps
WORKDIR /app

# Install all dependencies for the TypeScript build stage.
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund && npm cache clean --force

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3008

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY samples ./samples

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p reports \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3008

CMD ["node", "dist/index.js"]
