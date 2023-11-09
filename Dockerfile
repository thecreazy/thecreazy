# syntax=docker/dockerfile:1

###############################################
#################### BUILD ####################
###############################################

FROM node:20.9.0-alpine3.18 AS build
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN apk add --no-progress git
RUN corepack enable
WORKDIR /app/src
COPY package.json /app/src/package.json
COPY pnpm-lock.yaml /app/src/pnpm-lock.yaml
RUN pnpm install
ADD . .
RUN NODE_ENV=production pnpm build


################################################
################# RUNTIME ######################
################################################
FROM nginx:alpine as thecreazy-site

WORKDIR /app

COPY --from=build /app/src/dist /app/dist
COPY ./public ./dist/public

COPY ./configs/nginx.conf /etc/nginx/nginx.conf