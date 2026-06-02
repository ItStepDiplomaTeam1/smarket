# Stage 1: Build the Go binary
FROM golang:1.26-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go.mod and go.sum to cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary with optimizations (stripped symbols and static linking)
RUN CGO_ENABLED=0 GOOS=linux go build -o products_etl -ldflags="-w -s" main.go

# Stage 2: Minimal runtime image
FROM alpine:3.20

# Install ca-certificates (crucial for connecting to MongoDB Atlas & NeonDB via TLS) and tzdata
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy the pre-built binary
COPY --from=builder /app/products_etl .

# Expose the HTTP health check port
EXPOSE 8080

# Run the binary
CMD ["./products_etl"]
