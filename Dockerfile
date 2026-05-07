FROM node:25-alpine

RUN npm install -g pnpm@latest

# Configure pnpm to allow esbuild postinstall scripts (pnpm v10+ requirement)
RUN pnpm config set onlyBuiltDependencies "esbuild"

WORKDIR /app

EXPOSE 5173

CMD ["tail", "-f", "/dev/null"]
