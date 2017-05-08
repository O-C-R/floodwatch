#!/bin/bash
set -ex
cd `dirname $0`

deploy () {
	scp ../systemd/twofishes.service core@$1:~/
	ssh core@$1 'set -ex \
		&& docker pull fsqio/twofishes \
		&& sudo mv ~/twofishes.service /etc/systemd/system/ \
		&& sudo systemctl daemon-reload \
		&& sudo systemctl stop twofishes \
		&& sudo systemctl enable twofishes \
		&& sudo systemctl start twofishes'
}

SERVERS=(floodwatch-twofishes-a.floodwatch.me)

for server in ${SERVERS[@]}
do
	deploy $server
done
