#!/bin/bash

set -o allexport
source ../config/staging.env
set +o allexport
go run floodwatch-server.go "$@"
