Floodwatch Ad Classification
==========

## Classification server

In [classify_server.py](classify_server.py) you can find a a minimal Flask app, exposing an endpoint for classifying images.

The Floodwatch API server interacts with this server (which is running under the new AWS account) via [classify_client.py](https://github.com/O-C-R/floodwatch/blob/master/flask_API/floodwatch_api/floodwatch_api/classify_client.py).

### TODO for AWS parallelization

On a minimal CPU instance, we were seeing the average time to classify an image take about 12 seconds.

One simple way to parallelize the classification would be to use AWS:

 - An AMI in the N. Virgina region with the classification server running on port 80 exists called `cpu-classifier-image`. It was created using the installation steps below.
 - Using an [Auto Scaling Group and an Elastic Load Balancer](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/example-templates-autoscaling.html), set up a group to scale up to 20 or so instances. Then many classification servers will be running behind one IP address, and the Floodwatch code can ask it for image classifications as is.

## Classifier Installation

These instructions work on a fresh AWS Ubuntu instance. Make sure to have more than the default 8GB of root device space. (20GB is enough.)

```
## MODIFY BASH RC
vim ~/.bashrc

# (add these lines)
export PATH=$PATH:/usr/local/cuda-7.0/bin
export LD_LIBRARY_PATH=:/usr/local/cuda-7.0/lib64
export PYTHONPATH=$PYTHONPATH:/home/ubuntu/caffe/python

## INSTALL CUDA
sudo apt-get update && sudo apt-get upgrade
sudo apt-get install build-essential

wget http://developer.download.nvidia.com/compute/cuda/7_0/Prod/local_installers/cuda_7.0.28_linux.run
chmod +x cuda_7.0.28_linux.run
mkdir nvidia_installers
./cuda_7.0.28_linux.run -extract=`pwd`/nvidia_installers
sudo ./cuda-linux64-rel-7.0.28-19326674.run
cd nvidia_installers/
sudo ./cuda-linux64-rel-7.0.28-19326674.run
source ~/.bashrc
sudo ldconfig

## INSTALL CAFFE
sudo apt-get install -y libprotobuf-dev libleveldb-dev libsnappy-dev libopencv-dev libboost-all-dev libhdf5-serial-dev protobuf-compiler gfortran libjpeg62 libfreeimage-dev libatlas-base-dev git python-dev python-pip libgoogle-glog-dev libbz2-dev libxml2-dev libxslt-dev libffi-dev libssl-dev libgflags-dev liblmdb-dev python-yaml python-numpy
sudo easy_install pillow
cd ~ && git clone https://github.com/BVLC/caffe.git
cd caffe
cat python/requirements.txt | xargs -L 1 sudo pip install
cp Makefile.config.example Makefile.config
vim Makefile.config

# uncomment CPU_ONLY := 1

make pycaffe -j2 && make all -j2 && make test -j2

## INSTALL FLOODWATCH AND DEPENDENCIES
cd ~ && git clone https://github.com/O-C-R/floodwatch.git
sudo pip install pytesseract
sudo pip install pyenchant
sudo apt-get install libjpeg8-dev libtiff4-dev libjasper-dev libpng12-dev libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libatlas-base-dev gfortran libopencv-dev python-opencv
cd ~/floodwatch/classification
python ImageOCR.py ad.png
python AdClassifier.py -imgPath ad.png
```

## Code walkthrough

### AdClassifier
AdClassifier uses two trained CNNs to determine wether an image is an Ad or not
and if it believes an image is an add will try to determine which of 22 categories
it belongs to.

The class can be used for single image testing purposes on the command line but
it is not recommended since it requires quite some time to load and initialize the CNNs

The class should be included in a script that does batch processing which will only
require the networks to be instaciated once.

Since I could not connect to the floodwatch database anymore to test I decided to
throw out all the code that is connected with retrieving images from the database
and replaced it with a general routine that accepts a path to an image file and
will return the classifications. 

### Dependencies
- caffe
- numpy
- PIL.Image

## ImageOCR
ImageOCR is used to extract words from images. It preprocesses the images in order to
get maximum contrast and readablibity for the tesseract engine. Subsequently it runs
a spell check with an english dictionary over the found words and adds potential
corrections to the list.

Again due to lack of database access I went for a standalone class that takes an image
and returns a list of strings. It should be relatively easy to integrate it back into
the database context

This class is quite demanding regarding its dependencies and the installation process
connected with them so I recommend to start with getting AdClassifier running first
to avoid frustration.

### Dependencies

- numpy
- PIL.Image
- scipy.ndimage
- pytesseract
- enchant
- cv2

