FROM node:lts-alpine

WORKDIR /app
COPY package*.json tsconfig*.json README.md /app/
COPY . /app
# RUN npm install && npm i @nestjs/cli@7.4.1

EXPOSE 8083

CMD ["npm", "run", "start:dev", "--host", "0.0.0.0"]
