#!/bin/bash
set -ex
cd $(dirname $0)/..

BRANCH=$(git rev-parse --abbrev-ref HEAD)

TAG=$1
if [ -z $TAG ]; then
  TAG=":$BRANCH"
else
  TAG=":$TAG"
fi

rm -rf docker/build
mkdir -p docker/build

floodwatch-server/build.bash
cp -r floodwatch-server/build/floodwatch-server docker/build/
cp -r floodwatch-server/templates docker/build/templates

floodwatch/build.bash
cp -r floodwatch/build docker/build/static

cd docker
docker build -t ocrnyc/floodwatch-server$TAG .
docker push ocrnyc/floodwatch-server$TAG
