#!/bin/bash

set -o allexport
source ../config/local.public.env
set +o allexport
go run floodwatch-server.go "$@"
