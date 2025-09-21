FROM oven/bun:latest

WORKDIR /app 

COPY ./bun.lock ./package-lock.json ./package.json ./turbo.json ./

COPY ./packages ./packages
COPY ./apps/engine ./apps/engine

RUN bun install

WORKDIR /app/packages/db
RUN bunx prisma generate

WORKDIR /app/apps/engine

CMD ["bun", "run", "index.ts"]

