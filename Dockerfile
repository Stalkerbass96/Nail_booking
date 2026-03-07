FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# OpenSSL is required by Prisma in the container.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Build-time dependencies such as Tailwind must be installed for next build.
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

# Runtime container serves the built Next.js app. Migrations are orchestrated by deploy-docker.sh.
CMD ["sh", "-c", "npm run start -- --hostname 0.0.0.0 --port 3000"]
