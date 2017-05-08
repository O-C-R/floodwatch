#!/bin/bash

env $(cat defaults.env | grep -v "#" | xargs) go run floodwatch-server.go
