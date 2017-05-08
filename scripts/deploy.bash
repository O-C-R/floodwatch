#!/bin/bash
set -ex
cd `dirname $0`

deploy () {
	scp ../systemd/floodwatch-server.service core@$1:~/
	ssh core@$1 "set -ex \
		&& docker pull ocrnyc/floodwatch-server:$2 \
    && docker tag ocrnyc/floodwatch-server:$2 ocrnyc/floodwatch-server \
		&& sudo mv ~/floodwatch-server.service /etc/systemd/system/ \
		&& sudo systemctl daemon-reload \
		&& sudo systemctl stop floodwatch-server \
		&& sudo systemctl enable floodwatch-server \
		&& sudo systemctl start floodwatch-server"
}

TAG=$1
if [ -z $TAG ]; then
  echo "Usage: ./deploy.bash TAG [SERVER...]"
  exit
fi

DEFAULT_SERVERS=(floodwatch-server-a.floodwatch.me)
if [ -z $2 ]; then
  SERVERS=("${DEFAULT_SERVERS[@]}")
else
  SERVERS=("${@:2}")
fi

for server in ${SERVERS[@]}
do
	deploy $server $TAG
done
