import sys
import os.path

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, "/home/ubuntu/caffe/python")

from classify_server import app as application
