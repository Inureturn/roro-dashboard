FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY ingest.mjs ./

# Run as non-root user
USER node

CMD ["node", "ingest.mjs"]
