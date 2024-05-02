FROM node:18 AS base

# Install dependencies only when needed
FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apt install libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json bun.lockb* ./
RUN npm install -g bun && bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CHAIN

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_CHAIN=${NEXT_PUBLIC_CHAIN}

ENV NEXT_PUBLIC_SUPABASE_URL https://brkmtkkxuuqyohimfvld.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya210a2t4dXVxeW9oaW1mdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ1MDYzNDgsImV4cCI6MjAzMDA4MjM0OH0.KFKEyX205JLH_D3nTb4D7DAlo8xkgNX8TvUFQdmXSdU

ENV NEXT_PUBLIC_PRIVY_APP_ID=clvmt5tx4042jki7w52ikrvmj
ENV NEXT_PUBLIC_PRIVY_APP_SECRET=46K8JB2UaZ326HGVyh3HfdtUw7f4BDRNFrt28kB6kUqv6PHWD77X4YXmyndMUhoEnsWgd3TrdpiD95hAToQ6877c

ENV NODE_OPTIONS=--max_old_space_size=4096

RUN npm install -g bun && bun run build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install foundry
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN foundryup && cast --version

# USER nextjs
USER root

EXPOSE 3000

ENV PORT 3000
CMD ["node", "server.js"]
