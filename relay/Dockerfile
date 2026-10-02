FROM node:20-alpine
WORKDIR /app
COPY dispatcher.js .
ENV PORT=1080
ENV WORKER_URL=https://gredge-network.grwebdevs5.workers.dev
EXPOSE 1080
CMD ["node", "dispatcher.js"]
