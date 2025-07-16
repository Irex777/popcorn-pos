FROM node:20-alpine

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install ALL dependencies for build
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Don't remove dev dependencies - we need some at runtime for dynamic imports

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3002

# Health check - increase start period to allow for longer startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Install psql for database migrations
RUN apk add --no-cache postgresql-client

# Make startup script executable
RUN chmod +x startup.sh

# Start the application using startup script
CMD ["sh", "-c", "echo '=== CONTAINER STARTUP DEBUG ===' && echo 'Node: $(node --version)' && echo 'Working dir: $(pwd)' && echo 'Files:' && ls -la && echo 'Starting app with migrations...' && exec ./startup.sh"]