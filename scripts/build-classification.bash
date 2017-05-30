#!/bin/bash
set -ex
cd $(dirname $0)/..

BRANCH=$(git rev-parse --abbrev-ref HEAD)
REPO=ocrnyc/floodwatch-classification

docker build -t $REPO:latest ./classification
docker push $REPO:latest
