# --- Build Stage ---
FROM rust:1.80-slim AS builder
WORKDIR /usr/src/search_service

# Install dependencies needed for compiling OpenSSL and other libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only Cargo.toml first to cache dependency build stage
COPY Cargo.toml ./

# Create dummy source and build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src target/release/deps/search_service*

# Copy the actual source files and build the release binary
COPY src ./src
RUN cargo build --release

# --- Runtime Stage ---
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /usr/src/search_service/target/release/search_service .

EXPOSE 8083

CMD ["./search_service"]
