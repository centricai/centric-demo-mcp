FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY tools.js http.js server.js demo-fixture.json ./

RUN chown -R node:node /app
USER node

ENV PORT=8080
EXPOSE 8080

CMD ["node", "http.js"]
