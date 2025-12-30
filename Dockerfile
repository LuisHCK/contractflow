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

# Optional: where file uploads will be stored
VOLUME ["/app/uploads"]

# Start the server with Bun
CMD ["bun", "src/server.js"]
