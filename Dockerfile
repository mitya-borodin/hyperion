FROM node:lts-alpine as builder

ENV NODE_ENV=development

USER node
WORKDIR '/tmp'
RUN mkdir /tmp

COPY package.json yarn.lock ./
RUN chown -R node:node /tmp
RUN yarn --frozen-lockfile

COPY . .

RUN chown -R node:node /tmp
RUN yarn prisma:generate
RUN yarn build

FROM node:lts-alpine as runner

ENV NODE_ENV=production

USER node
WORKDIR '/app'
RUN mkdir /app

COPY --from=builder /tmp/package.json /app
COPY --from=builder /tmp/yarn.lock /app
RUN chown -R node:node /app
RUN yarn --frozen-lockfile

COPY --from=builder /tmp/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /tmp/build /app/build
COPY --from=builder /tmp/bin /app/bin
RUN chown -R node:node /app

CMD [ "node", "/app/bin/hyperion" ]
