FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build:h5

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends default-mysql-client ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci --omit=dev && mkdir -p /app/server/data && chown -R node:node /app
COPY --from=build /app/dist/build/h5 ./dist/build/h5
COPY server ./server
COPY src/domain ./src/domain
COPY tools/serve.js ./tools/serve.js
ENV NODE_ENV=production PORT=4174 TZ=Asia/Shanghai
USER node
EXPOSE 4174
CMD ["node","tools/serve.js"]
