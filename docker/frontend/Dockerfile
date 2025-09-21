FROM oven/bun:latest

WORKDIR /app 

COPY ./bun.lock ./package-lock.json ./package.json ./turbo.json ./

COPY ./packages ./packages
COPY ./apps/frontend ./apps/frontend

RUN bun install

WORKDIR /app/packages/db
RUN bunx prisma generate

WORKDIR /app/apps/frontend

EXPOSE 3001

CMD ["bun", "run", "index.ts"]

