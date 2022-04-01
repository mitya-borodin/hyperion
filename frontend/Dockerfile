FROM node:lts-alpine

WORKDIR '/app'

COPY ./package.json ./yarn.lock ./
RUN yarn install --frozen-lockfile

COPY ./ ./

RUN yarn build

FROM nginx:alpine
EXPOSE 3000
COPY --from=0 /app/build /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf