# Stage 1: Build the Go binary
# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS builder

# BuildKit автоматично передає TARGETOS та TARGETARCH — архітектура runtime-образу.
# Це гарантує що бінарник буде зібрано саме під ту платформу, де він запуститься.
ARG TARGETOS=linux
ARG TARGETARCH=amd64

# Install build dependencies
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Use alternative Go proxy to bypass proxy.golang.org 403 errors on Hetzner
ENV GOPROXY=https://goproxy.cn,https://goproxy.io,direct

# Copy go.mod and go.sum to cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary with optimizations (stripped symbols and static linking)
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -o products_etl -ldflags="-w -s" main.go \
    && chmod +x products_etl

# Stage 2: Minimal runtime image
FROM alpine:3.20

# Install ca-certificates (crucial for connecting to MongoDB Atlas & NeonDB via TLS) and tzdata
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy the pre-built binary
COPY --from=builder --chmod=755 /app/products_etl .

# Expose the HTTP health check port
EXPOSE 8082

# Run the binary
CMD ["./products_etl"]
