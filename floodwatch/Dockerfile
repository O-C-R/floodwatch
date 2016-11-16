FROM node:6.9.1
WORKDIR /usr/app
RUN npm install -g yarn
COPY ./package.json /usr/app/
COPY ./yarn.lock /usr/app/
RUN yarn install
COPY . /usr/app/
RUN yarn run build
