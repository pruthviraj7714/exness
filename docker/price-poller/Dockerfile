FROM oven/bun:latest

WORKDIR /app 

COPY ./bun.lock ./package-lock.json ./package.json ./turbo.json ./

COPY ./packages ./packages
COPY ./apps/price-poller ./apps/price-poller

RUN bun install

WORKDIR /app/packages/db
RUN bunx prisma generate

WORKDIR /app/apps/price-poller

CMD ["bun", "run", "index.ts"]

