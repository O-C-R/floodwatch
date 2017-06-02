FROM debian:jessie

# Adapted from https://hub.docker.com/r/selenium/node-chrome/~/dockerfile/
ARG CHROME_VERSION="google-chrome-stable"
RUN apt-get -qqy update \
  && apt-get -qqy install wget \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update -qqy \
  && apt-get -qqy install \
    ttf-liberation \
    fonts-liberation \
    ${CHROME_VERSION:-google-chrome-stable} \
  && rm /etc/apt/sources.list.d/google-chrome.list \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

COPY . /etc/floodwatch

WORKDIR /etc/floodwatch/build
CMD ["./floodwatch-server"]
