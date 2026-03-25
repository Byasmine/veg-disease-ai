FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src
COPY data ./data

ENV NODE_ENV=production
EXPOSE 8082

CMD ["node", "src/server.js"]
