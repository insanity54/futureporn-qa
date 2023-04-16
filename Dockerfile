# syntax=docker/dockerfile:1.4

FROM node:16-alpine as build
RUN apk add curl
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm
WORKDIR /build
COPY pnpm-lock.yaml ./
RUN pnpm install -r --prod --offline
ADD . ./


# packaging step
FROM node:16-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /build .
EXPOSE 5000
CMD [ "node", "index.js" ]

