FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .
RUN cp -r /app/data /app/data-seed
RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
