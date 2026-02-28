FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

EXPOSE 5173

CMD ["tail", "-f", "/dev/null"]
