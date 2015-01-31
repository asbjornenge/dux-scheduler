FROM node:0.11-slim
ADD . /app
ENTRYPOINT ["node","/app/index.js"]
