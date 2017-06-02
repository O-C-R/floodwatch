#!/bin/bash
set -ex
cd $(dirname $0)/..

PSQL_URL="postgres://floodwatch@floodwatch.cnr5oa8r0jip.us-east-1.rds.amazonaws.com:5432/floodwatch?sslmode=require"

exec ssh -t core@floodwatch-server-a.floodwatch.me \
  docker run -it --rm \
  postgres \
  psql $PSQL_URL \
  $@
