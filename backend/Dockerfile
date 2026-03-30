FROM node:20-slim

# Install curl for health checks
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production dependencies (separate layer for better caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Ensure WhatsApp session directory exists
RUN mkdir -p wa_auth

EXPOSE 5001

CMD ["node", "server.js"]
