#!/bin/bash
exec ssh -t core@floodwatch-server-a.floodwatch.me docker run -it --rm postgres psql postgres://floodwatch:VFXGInSo8gyTaezJIwzUICkqfwt8AKWVB4Is2puhOnxsIXsVzz@floodwatch.cnr5oa8r0jip.us-east-1.rds.amazonaws.com:5432/floodwatch?sslmode=require $@
