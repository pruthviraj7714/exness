FROM oven/bun:latest

WORKDIR /app 

COPY ./bun.lock ./package-lock.json ./package.json ./turbo.json ./

COPY ./packages ./packages
COPY ./apps/server ./apps/server

RUN bun install

WORKDIR /app/packages/db
RUN bunx prisma generate

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["bun", "run", "index.ts"]

