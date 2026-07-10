FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Create database directory (will be mounted as volume in production)
RUN mkdir -p /app/database

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
