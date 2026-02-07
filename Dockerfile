# --- STAGE 1: Build Angular Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /build-frontend
COPY GangBro-client/package*.json ./
RUN npm install --legacy-peer-deps
COPY GangBro-client/ ./
RUN npm run build -- --configuration production

# --- STAGE 2: Build Rust Backend ---
FROM rustlang/rust:nightly AS backend-builder
WORKDIR /build-backend
COPY server/ .
# Note: We expect the binary name to be 'server' based on Cargo.toml
RUN cargo build --release

# --- STAGE 3: Final Runtime Image ---
FROM debian:testing-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy the Rust binary
COPY --from=backend-builder /build-backend/target/release/server .

# Copy the Angular build output into 'statics' folder (what our Axum code expects)
# Based on Angular 18/21 default paths: dist/[project-name]/browser
COPY --from=frontend-builder /build-frontend/dist/client/browser ./statics

# Expose port (Render sets PORT env, but 8080 is often default in config)
EXPOSE 8080

CMD ["./server"]
