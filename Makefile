all: build/floodwatch-server build/static
	docker build -t floodwatch .

build/floodwatch-server: build floodwatch-server/build/floodwatch-server
	cp floodwatch-server/build/floodwatch-server build/

build/static: build floodwatch/build
	cp -r floodwatch/build build/static

build:
	mkdir build

floodwatch-server/build/floodwatch-server:
	./floodwatch-server/build.bash

floodwatch/build:
	./floodwatch/build.bash

classification-ami:
	AWS_PROFILE=floodwatch packer build packer/classification.json

clean:
	rm -rf build floodwatch-server/build floodwatch/build
