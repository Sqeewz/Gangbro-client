# Build stage
FROM docker.io/rustlang/rust:nightly as builder

WORKDIR /usr/src/app
COPY . .

# Build the application
RUN cargo build --release

# Runtime stage
FROM docker.io/library/debian:testing-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /usr/src/app/target/release/server .

# Copy static files (frontend) and configuration
COPY --from=builder /usr/src/app/statics ./statics


# Expose the server port (just for documentation, Render uses PORT env)
EXPOSE 8000

# Run the server
CMD ["./server"]
