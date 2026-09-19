# Production Cloud Dockerfile for Render Deployment
FROM node:18-alpine

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy full application code and frontend resources
COPY . .

# Expose HTTP port (Render dynamically sets $PORT)
ENV PORT=8081
EXPOSE 8081

# Launch the cloud backend service
CMD ["node", "server.js"]
