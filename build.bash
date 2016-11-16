#!/bin/bash
set -ex
cd `dirname $0`

rm -rf docker/static docker/floodwatch-server

./floodwatch-server/build.bash
cp -r floodwatch-server/build/floodwatch-server docker/

./floodwatch/build.bash
cp -r floodwatch/build docker/static

cd docker
docker build -t ocrnyc/floodwatch-server . 
docker push ocrnyc/floodwatch-server
