FROM node:6.9.1
WORKDIR /usr/app
COPY ./package.json /usr/app/
RUN npm install
COPY . /usr/app/
RUN npm run build
