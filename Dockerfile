FROM node:lts-alpine

LABEL maintainer="dmitriy@borodin.site"

WORKDIR '/app'

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY ./ ./

RUN yarn prisma:generate
RUN yarn prettier:check
RUN yarn eslint:check
RUN yarn build
