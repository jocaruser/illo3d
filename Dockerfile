FROM node:25-alpine

# Pin pnpm to v9 to avoid breaking changes in v10 regarding build scripts
RUN npm install -g pnpm@9.15.0

WORKDIR /app

EXPOSE 5173

CMD ["tail", "-f", "/dev/null"]
