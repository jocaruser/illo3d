FROM node:25-alpine

RUN npm install -g pnpm@latest

WORKDIR /app

EXPOSE 5173

CMD ["tail", "-f", "/dev/null"]
