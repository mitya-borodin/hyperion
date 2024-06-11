FROM node:lts-alpine as builder

LABEL "org.opencontainers.image.source"="https://github.com/mitya-borodin/hyperion"
LABEL "org.opencontainers.image.description"="Home automation platform"
LABEL "org.opencontainers.image.licenses"="AGPL-3.0-only"

ENV NODE_ENV=development

USER node
WORKDIR '/tmp'

COPY --chown=node:node package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY --chown=node:node . .

RUN yarn prisma:generate
RUN yarn build

FROM node:lts-alpine as runner

LABEL "org.opencontainers.image.source"="https://github.com/mitya-borodin/hyperion"
LABEL "org.opencontainers.image.description"="Home automation platform"
LABEL "org.opencontainers.image.licenses"="AGPL-3.0-only"

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
