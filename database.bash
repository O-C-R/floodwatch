#!/bin/bash
exec ssh -t core@54.235.46.190 docker run -it --rm postgres psql postgres://floodwatch@floodwatch.cnr5oa8r0jip.us-east-1.rds.amazonaws.com:5432/floodwatch?sslmode=require
