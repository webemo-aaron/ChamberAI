# Dockerfile for Secretary Console (static HTML/JavaScript)
# Serves static files via lightweight HTTP server

FROM node:20-alpine AS builder
WORKDIR /app

# Copy all static assets
COPY . .

# No build step needed for vanilla JS - just copy as-is

FROM node:20-alpine
WORKDIR /app

# Install http-server for serving static content
RUN npm install -g http-server

# Copy static files from builder
COPY --from=builder /app .

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Expose port
EXPOSE 5173

# Serve static content
CMD ["http-server", "-p", "5173", "-c-1", "--gzip"]
