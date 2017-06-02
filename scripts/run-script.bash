#!/bin/bash
set -ex
cd $(dirname $0)/..

SERVER=floodwatch-server-staging.floodwatch.me
CONTAINER=ocrnyc/floodwatch-server:develop
COMMAND="./floodwatch-server"

exec ssh -t core@$SERVER \
  docker run -it --rm \
    --read-only \
    --env-file=/etc/floodwatch-server/floodwatch-server.env \
    --security-opt seccomp=/etc/floodwatch/config/chrome.json \
    --tmpfs /tmp:rw,size=787448k,mode=1777 \
  $CONTAINER \
  $COMMAND \
  $@
