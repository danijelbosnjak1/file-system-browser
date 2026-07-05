FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package.json backend/package.json
RUN npm install --workspace backend --omit=dev

COPY backend backend

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "src/server.js"]
