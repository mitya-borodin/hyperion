FROM node:lts-alpine as builder

ENV NODE_ENV=development

USER node
WORKDIR '/tmp'

COPY --chown=node:node package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY . .

RUN yarn prisma:generate
RUN yarn build

FROM node:lts-alpine as runner

ENV NODE_ENV=production

USER node
WORKDIR '/app'

COPY --chown=node:node --from=builder /tmp/package.json /app
COPY --chown=node:node --from=builder /tmp/yarn.lock /app

RUN yarn --frozen-lockfile

COPY --chown=node:node --from=builder /tmp/node_modules/.prisma /app/node_modules/.prisma
COPY --chown=node:node --from=builder /tmp/build /app/build
COPY --chown=node:node --from=builder /tmp/bin /app/bin

CMD [ "node", "/app/bin/hyperion" ]
