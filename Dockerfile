# KIXoff Game Server
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies needed for build
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production runtime image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install runtime deps only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
