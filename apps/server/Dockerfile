FROM node:18
RUN npm install pm2 -g
WORKDIR /app
COPY dist /app
COPY .env /app
#ENTRYPOINT DEBUG=express:* pm2-runtime serve.js
ENTRYPOINT pm2-runtime serve.js
EXPOSE 4000