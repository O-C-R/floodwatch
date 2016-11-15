FROM nvidia/caffe:0.15

RUN set -ex \
	&& mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN set -ex \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends \
		libenchant-dev \
		python-pip \
	&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt /usr/src/app/
RUN pip install -r requirements.txt

COPY . /usr/src/app/
CMD ["python", "classify_queue.py"]
