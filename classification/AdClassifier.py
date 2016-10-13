# -*- coding: UTF-8 -*-

import argparse
import traceback
import caffe
import numpy as np
import PIL.Image
import os.path


def model(filename):
    '''
    Returns the path to a model file
    '''
    return os.path.join(os.path.dirname(__file__), 'models', filename)


class AdClassifier:
    def __init__(self, useGPU=True):
        if useGPU:
            caffe.set_device(0)
            caffe.set_mode_gpu()
        else:
            caffe.set_mode_cpu()

        self.ad_category_net = caffe.Net(
            model('banners_only_deploy.prototxt'),
            model('banners_bvlc_googlenet_banners_only_iter_200000.caffemodel'),
            caffe.TEST)

        self.transformer = caffe.io.Transformer({'data': self.ad_category_net.blobs['data'].data.shape})
        self.transformer.set_transpose('data', (2,0,1))
        self.transformer.set_mean('data', np.array([104.00698793, 116.66876762, 122.67891434])) # mean pixel
        self.transformer.set_raw_scale('data', 255)  # the reference model operates on images in [0,255] range instead of [0,1]
        self.transformer.set_channel_swap('data', (2, 1, 0))  # the reference model has channels in BGR order instead of RGB

        ad_categories_filename = model('labels_onlyads.txt')
        self.ad_categories = np.loadtxt(ad_categories_filename, str, delimiter='\t')

        self.yes_no_net = caffe.Net(model('yesno_deploy.prototxt'),
                        model('banners_bvlc_googlenet_yesno_2_iter_100000.caffemodel'),
                        caffe.TEST)

        yes_no_labels_filename = model('labels_yesno.txt')
        self.yes_no_labels = np.loadtxt(yes_no_labels_filename, str, delimiter='\t')

    # utility function that loads an image, optionally limits
    # the size and removes an alpha channel in case there is one
    def prepareImage(self, img, minSideLength=1, maxSideLength=1024):
        s = img.size

        ratio = 1.0
        if np.max(s) > maxSideLength:
            ratio = float(maxSideLength)/float(np.max(s))

        if np.min(s)*ratio < minSideLength:
            ratio = float(minSideLength)/float(np.min(s))

        if ratio != 1.0:
            new_size = [int(s[0]*ratio), int(s[1]*ratio)]
            img = img.resize(new_size, PIL.Image.ANTIALIAS)

        if img.mode != 'RGB':
            img = img.convert("RGB")

        try:
            img = np.float32(img) / 255.0
        except Exception:
            traceback.print_exc()
            return None

        return img

    def classify(self, imgPath, classifyNonAds=False, classifyAds=True):
        img = PIL.Image.open(imgPath)
        if img is None:
            raise Exception("could not open image %r" % imgPath)

        prepared_image = self.prepareImage(img)
        prepared = self.transformer.preprocess('data', prepared_image)

        self.yes_no_net.blobs['data'].data[...] = prepared
        out = self.yes_no_net.forward()
        f_is_ad = out['prob'][0].flatten()
        is_ad = f_is_ad.argsort()[-1:-2:-1]
        results = {}
        print self.yes_no_labels[is_ad[0]], f_is_ad[is_ad[0]]
        results[self.yes_no_labels[is_ad[0]]] = f_is_ad[is_ad[0]]

        if classifyAds and (is_ad[0] == "is ad" or not classifyNonAds):
            self.ad_category_net.blobs['data'].data[...] = prepared
            out = self.ad_category_net.forward()
            f = out['prob'][0].flatten()

            top_k = f.argsort()[-1:-9:-1]

            results['tags'] = {}

            for i in range(len(top_k)):
                print self.ad_categories[top_k[i]], f[top_k[i]]
                results['tags'][self.ad_categories[top_k[i]]] = f[top_k[i]]

        return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Ad classifier')
    parser.add_argument('-useGPU', type=bool, default=0, help='use GPU (=1) or CPU (=0)')
    parser.add_argument('-classifyNonAds', type=bool, default=0, help='if set to 1 images will that have been detected as non-ads will also be classified')
    parser.add_argument('-classifyAds', type=bool, default=1, help='if set to 0 classification will only determin if an image is an ad or not')
    parser.add_argument('-imgPath', required=True, help='path to image file')

    args = parser.parse_args()
    classifier = AdClassifier(useGPU=args.useGPU)
    classifier.classify(
        imgPath=args.imgPath,
        classifyNonAds=args.classifyNonAds, classifyAds=args.classifyAds)
