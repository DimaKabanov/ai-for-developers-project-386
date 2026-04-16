# syntax = docker/dockerfile:1

# =============================================================================
# STAGE 1: Build Frontend (Node.js)
# =============================================================================
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build production bundle
RUN npm run build

# =============================================================================
# STAGE 2: Rails Backend (Ruby)
# =============================================================================
FROM ruby:3.2.2-slim AS base

WORKDIR /rails

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test" \
    PORT="3000"

# =============================================================================
# STAGE 3: Build Stage for Gems
# =============================================================================
FROM base AS build

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git pkg-config

# Copy Gemfiles
COPY backend/Gemfile backend/Gemfile.lock ./

# Install gems
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Copy backend application code
COPY backend/ ./

# Precompile bootsnap
RUN bundle exec bootsnap precompile app/ lib/ 2>/dev/null || true

# =============================================================================
# STAGE 4: Final Production Image
# =============================================================================
FROM base

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libsqlite3-0 openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built gems
COPY --from=build /usr/local/bundle /usr/local/bundle

# Copy backend application
COPY --from=build /rails /rails

# Copy built frontend static files to Rails public directory
COPY --from=frontend-build /app/frontend/dist /rails/public

# Create non-root user for security
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails /rails

USER rails:rails

# Expose port (will be overridden by PORT env variable at runtime)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/up || exit 1

# Start Rails server on PORT (generate SECRET_KEY_BASE if not set)
CMD ["/bin/sh", "-c", "if [ -z \"$SECRET_KEY_BASE\" ]; then export SECRET_KEY_BASE=$(openssl rand -hex 64); fi && ./bin/rails server -b 0.0.0.0"]
