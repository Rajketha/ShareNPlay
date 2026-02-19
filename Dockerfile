# ============================================================
# Stage 1: Build the React Frontend
# ============================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first to leverage Docker layer caching
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build the production React bundle
RUN npm run build

# ============================================================
# Stage 2: Run the Backend + Serve the Frontend
# ============================================================
FROM node:18-alpine AS production

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./

# Copy the built React frontend from Stage 1
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Create uploads directory (used for file sharing)
RUN mkdir -p /app/backend/uploads

# Expose the app port (7860 is required for Hugging Face Spaces)
EXPOSE 7860

# Set environment to production
ENV NODE_ENV=production
ENV PORT=7860

# Health check (updated for port 7860)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:7860/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
