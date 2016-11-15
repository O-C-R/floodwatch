#!/bin/bash
set -ex
cd `dirname $0`

docker build -t floodwatch-server-build . 

rm -rf build
mkdir build
docker rm -f floodwatch-server-build || true
docker run --rm --name floodwatch-server-build -v `pwd`/build:/build floodwatch-server-build cp /go/src/bin/floodwatch-server /build/
