#!/bin/bash
set -ex
cd `dirname $0`

docker build -t floodwatch-build . 

rm -rf build
mkdir build
docker rm -f floodwatch-build || true
docker run --rm --name floodwatch-build -v `pwd`/build:/build floodwatch-build bash -c 'cp -r /usr/app/build/* /build/'
find build -name '*.css' -exec gzip -k9 {} \;
find build -name '*.html' -exec gzip -k9 {} \;
find build -name '*.js' -exec gzip -k9 {} \;
find build -name '*.json' -exec gzip -k9 {} \;
find build -name '*.txt' -exec gzip -k9 {} \;
