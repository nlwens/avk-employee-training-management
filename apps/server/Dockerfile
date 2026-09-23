FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN npm ci --workspace=server --include-workspace-root=false

COPY . .

RUN npm run build --workspace=server


FROM node:24-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json

RUN npm ci --omit=dev --workspace=server --include-workspace-root=false


FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY apps/server/package.json ./apps/server/package.json

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["node", "dist/main.js"]