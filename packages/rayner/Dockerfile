FROM node:lts-alpine

WORKDIR '/app'

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY ./ ./

RUN yarn build
