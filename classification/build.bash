#!/bin/bash
set -ex
cd `dirname $0`

docker build -t ocrnyc/floodwatch-classification . 
docker push ocrnyc/floodwatch-classification
