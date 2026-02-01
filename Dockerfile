# Multi-stage Dockerfile for Bun + Express app
# Base image (latest Bun on Alpine)
FROM oven/bun:alpine AS base

WORKDIR /app
ENV NODE_ENV=production

# -------------------------
# Dependencies stage
# -------------------------
FROM base AS deps

# Copy only package manifest first to leverage Docker layer caching
COPY package.json ./

# Install only production dependencies
RUN bun install --production

# -------------------------
# Development stage
# -------------------------
FROM base AS dev

COPY package.json ./
COPY bun.lock ./

# Install all dependencies (including dev)
RUN bun install

# Set workdir
WORKDIR /app

# Copy all source code (for initial build, but will be overridden by volume in compose)
COPY . .

# Expose port for dev
ENV PORT=3000
EXPOSE 3000

# Start with hot reload
CMD ["bun", "run", "dev"]

# -------------------------
# Runtime stage
# -------------------------
FROM base AS runtime

WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Expose application port
ENV PORT=3000
EXPOSE 3000

# Optional: where file uploads and database will be stored
VOLUME ["/app/uploads", "/app/data"]

# Start the server with Bun
CMD ["bun", "src/server.js"]
