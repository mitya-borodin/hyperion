FROM node:lts-alpine

ENV SERVER_HOST="0.0.0.0"
ENV SERVER_PORT="10000"
ENV WS_HOST="0.0.0.0"
ENV WS_PORT="10001"

WORKDIR '/app'

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY ./ ./

RUN yarn build

EXPOSE 10000
EXPOSE 10001

CMD ["node", "./dist/src/index.js"]