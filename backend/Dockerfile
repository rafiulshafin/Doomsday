# Backend Dockerfile for Doomsday Ready

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy schema and generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build TypeScript
COPY src ./src
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000

# Start script: push schema to postgres, seed sample data, and start server
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/index.js"]
