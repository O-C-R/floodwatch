#!/bin/bash
set -ex
cd `dirname $0`

deploy () {
	scp -i ~/ocr/ssh/floodwatch floodwatch-server.service core@$1:~/
	ssh -i ~/ocr/ssh/floodwatch core@$1 'set -ex \
		&& docker pull ocrnyc/floodwatch-server \
		&& sudo mv ~/floodwatch-server.service /etc/systemd/system/ \
		&& sudo systemctl daemon-reload \
		&& sudo systemctl stop floodwatch-server \
		&& sudo systemctl enable floodwatch-server \
		&& sudo systemctl start floodwatch-server'
}

SERVERS=(54.235.46.190)

for server in ${SERVERS[@]}
do
	deploy $server	
done