FROM golang:1.7.3
ENV CGO_ENABLED=0
ADD . /go/src/github.com/O-C-R/floodwatch-server/server
WORKDIR /go/src/github.com/O-C-R/floodwatch-server/server
RUN go install -ldflags '-extldflags "-static"' .
