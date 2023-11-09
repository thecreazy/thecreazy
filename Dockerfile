FROM nginx:alpine as thecreazy-site

WORKDIR /app

COPY . .
COPY ./public ./dist/public

COPY ./configs/nginx.conf /etc/nginx/nginx.conf