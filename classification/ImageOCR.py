# -*- coding: UTF-8 -*-

import sys
import traceback
import PIL.Image
import scipy.ndimage
import pytesseract
import enchant
import numpy as np
import cv2
import string

MAX_TOKEN_LENGTH = 2048


class ImageOCR():
    def __init__(self):
        table = string.maketrans('', '')
        chars = string.digits + string.letters+"$%!?-+#áàéèòóùúäöü,. \n"
        self.badChars = table.translate(None, chars)

    # Processes an image to extract the text portions. Primarily
    # used for pre-processing for performing OCR.

    # Based on the paper "Font and Background Color Independent Text Binarization" by
    # T Kasar, J Kumar and A G Ramakrishnan
    # http://www.m.cs.osakafu-u.ac.jp/cbdar2007/proceedings/papers/O1-1.pdf

    # Copyright (c) 2012, Jason Funk <jasonlfunk@gmail.com>
    # Permission is hereby granted, free of charge, to any person obtaining a copy of this software
    # and associated documentation files (the "Software"), to deal in the Software without restriction,
    # including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
    # and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
    # subject to the following conditions:
    #
    # The above copyright notice and this permission notice shall be included in all copies or substantial
    # portions of the Software.
    #
    # THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
    # LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.
    # IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    # WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    # SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    # Determine pixel intensity
    # Apparently human eyes register colors differently.
    # TVs use this formula to determine
    # pixel intensity = 0.30R + 0.59G + 0.11B
    def ii(self, xx, yy):
        if yy >= self.img_y or xx >= self.img_x:
            # print "pixel out of bounds ("+str(y)+","+str(x)+")"
            return 0
        pixel = self.img[yy][xx]
        # return 0.30 * pixel[2] + 0.59 * pixel[1] + 0.11 * pixel[0]
        return 0.45 * pixel[2] + 0.45 * pixel[1] + 0.1 * pixel[0]

    # A quick test to check whether the contour is
    # a connected shape
    def connected(self, contour):
        first = contour[0][0]
        last = contour[len(contour) - 1][0]
        return abs(first[0] - last[0]) <= 1 and abs(first[1] - last[1]) <= 1

    # Helper function to return a given contour
    def c(self, index):
        return self.contours[index]

    # Count the number of real children
    def count_children(self, index, h_, contour):
        # No children
        if h_[index][2] < 0:
            return 0
        else:
            # If the first child is a contour we care about
            # then count it, otherwise don't
            if self.keep(self.c(h_[index][2])):
                count = 1
            else:
                count = 0

                # Also count all of the child's siblings and their children
            count += self.count_siblings(h_[index][2], h_, contour, True)
            return count

    # Quick check to test if the contour is a child
    def is_child(self, index, h_):
        return self.get_parent(index, h_) > 0

    # Get the first parent of the contour that we care about
    def get_parent(self, index, h_):
        parent = h_[index][3]
        while not self.keep(self.c(parent)) and parent > 0:
            parent = h_[parent][3]

        return parent

    # Count the number of relevant siblings of a contour
    def count_siblings(self, index, h_, contour, inc_children=False):
        # Include the children if necessary
        if inc_children:
            count = self.count_children(index, h_, contour)
        else:
            count = 0

        # Look ahead
        p_ = h_[index][0]
        while p_ > 0:
            if self.keep(self.c(p_)):
                count += 1
            if inc_children:
                count += self.count_children(p_, h_, contour)
            p_ = h_[p_][0]

        # Look behind
        n = h_[index][1]
        while n > 0:
            if self.keep(self.c(n)):
                count += 1
            if inc_children:
                count += self.count_children(n, h_, contour)
            n = h_[n][1]
        return count

    # Whether we care about this contour
    def keep(self, contour):
        return self.keep_box(contour) and self.connected(contour)

    # Whether we should keep the containing box of this
    # contour based on it's shape
    def keep_box(self, contour):
        xx, yy, w_, h_ = cv2.boundingRect(contour)

        # width and height need to be floats
        w_ *= 1.0
        h_ *= 1.0

        # Test it's shape - if it's too oblong or tall it's
        # probably not a real character
        # if w_ / h_ < 0.1 or w_ / h_ > 10:
        if w_ / h_ < 0.01 or w_ / h_ > 50:
            return False

        # check size of the box
        if ((w_ * h_) > ((self.img_x * self.img_y) / 5)) or ((w_ * h_) < 15):
            return False

        return True

    def include_box(self, index, h_, contour):
        if self.is_child(index, h_) and self.count_children(self.get_parent(index, h_), h_, contour) <= 2:
            return False

        if self.count_children(index, h_, contour) > 2:
            return False

        return True

    def getWords(self, imgPath):
        img = PIL.Image.open(imgPath)
        if img is None:
            raise Exception("no image at %r" % imgPath)

        try:
            img = img.convert("RGB")
            img = PIL.Image.fromarray(scipy.ndimage.zoom(img, (2, 2, 1), order=3), 'RGB')
        except Exception:
            traceback.print_exc()
            return False

        try:
            ocrText = pytesseract.image_to_string(img)
        except OSError:
            traceback.print_exc()
            return False

        orig_img = np.array(img)

        for channel in xrange(3):
            adaptiveImg = cv2.adaptiveThreshold(orig_img[:,:,channel],255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,127,2)
            adaptiveImg = cv2.blur(adaptiveImg, (2, 2))
            try:
                ocrText += pytesseract.image_to_string(PIL.Image.fromarray(adaptiveImg))
            except Exception:
                print "error in pytesseract"
                traceback.print_exc()

        orig_img = orig_img[:, :, ::-1].copy()

        # Add a border to the image for processing sake
        self.img = cv2.copyMakeBorder(orig_img, 50, 50, 50, 50, cv2.BORDER_CONSTANT)

        # Calculate the width and height of the image
        self.img_y = len(self.img)
        self.img_x = len(self.img[0])

        # Split out each channel
        blue, green, red = cv2.split(self.img)

        # Run canny edge detection on each channel
        blue_edges = cv2.Canny(blue, 200, 250)
        green_edges = cv2.Canny(green, 200, 250)
        red_edges = cv2.Canny(red, 200, 250)

        # Join edges back into image
        edges = blue_edges | green_edges | red_edges

        # Find the contours

        self.contours, hierarchy = cv2.findContours(edges.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)

        try:
            hierarchy = hierarchy[0]
        except Exception:
            traceback.print_exc()
            return False

        # These are the boxes that we are determining
        keepers = []

        # For each contour, find the bounding rectangle and decide
        # if it's one we care about
        for index_, contour_ in enumerate(self.contours):
            x, y, w, h = cv2.boundingRect(contour_)
            # Check the contour and it's bounding box
            if self.keep(contour_) and self.include_box(index_, hierarchy, contour_):
                # It's a winner!
                keepers.append([contour_, [x, y, w, h]])

        # Make a white copy of our image
        new_image = edges.copy()
        new_image.fill(255)

        # For each box, find the foreground and background intensities
        for index_, (contour_, box) in enumerate(keepers):

            # Find the average intensity of the edge pixels to
            # determine the foreground intensity
            fg_int = 0.0
            for p in contour_:
                fg_int += self.ii(p[0][0], p[0][1])

            fg_int /= len(contour_)

            # Find the intensity of three pixels going around the
            # outside of each corner of the bounding box to determine
            # the background intensity
            x_, y_, width, height = box
            bg_int = \
                [
                    # bottom left corner 3 pixels
                    self.ii(x_ - 1, y_ - 1),
                    self.ii(x_ - 1, y_),
                    self.ii(x_, y_ - 1),

                    # bottom right corner 3 pixels
                    self.ii(x_ + width + 1, y_ - 1),
                    self.ii(x_ + width, y_ - 1),
                    self.ii(x_ + width + 1, y_),

                    # top left corner 3 pixels
                    self.ii(x_ - 1, y_ + height + 1),
                    self.ii(x_ - 1, y_ + height),
                    self.ii(x_, y_ + height + 1),

                    # top right corner 3 pixels
                    self.ii(x_ + width + 1, y_ + height + 1),
                    self.ii(x_ + width, y_ + height + 1),
                    self.ii(x_ + width + 1, y_ + height)
                ]

            # Find the median of the background
            # pixels determined above
            bg_int = np.median(bg_int)

            # Determine if the box should be inverted
            if fg_int >= bg_int:
                fg = 255
                bg = 0
            else:
                fg = 0
                bg = 255

                # Loop through every pixel in the box and color the
                # pixel accordingly
            for x in range(x_, x_ + width):
                for y in range(y_, y_ + height):
                    if y >= self.img_y or x >= self.img_x:
                        continue
                    if self.ii(x, y) > fg_int:
                        new_image[y][x] = bg
                    else:
                        new_image[y][x] = fg

        # blur a bit to improve ocr accuracy
        new_image = PIL.Image.fromarray(cv2.blur(new_image, (2, 2)))
        new_image.show()
        try:
            ocrText += pytesseract.image_to_string(new_image)
        except Exception:
            print "error in pytesseract"
            traceback.print_exc()
        # print "----------------\n",ocrText
        # ocrText = ocrText.translate(None, ':;»‘"/_\\>\xef\xac\x82')

        ocrText = ocrText.translate(None, self.badChars).lower()

        # print "------- cleaned up ocr text ---------\n",ocrText
        # Separate words
        d = enchant.Dict("en_us")
        newtokens = []
        tokens = ocrText.split()
        exceptionCount = 0
        for token in tokens:
            # just lowercase the fully uppercase words, they're probably
            # names

            # token = token.lower()
            if token in newtokens:
                continue

            if len(token) > 1 and len(token) < 21:
                try:
                    if d.check(token) and token.count(".") < 3 and \
                            token.count(",") == 0:
                        newtokens.append(token)
                    else:
                        # Token is not a valid word
                        suggestions = d.suggest(token)
                        if len(suggestions) > 0 and suggestions[0].lower() not in newtokens:
                            # If the spell check has suggestions take the first one
                            newtokens.append(suggestions[0].lower().decode('string-escape'))
                        if token.count(".") < 3 and token.count(",") == 0:
                            newtokens.append(token)
                except Exception:
                    traceback.print_exc()
                    exceptionCount += 1
                    #print "error with",token

        if len(newtokens) > 0:
            while len(",".join(newtokens)) > MAX_TOKEN_LENGTH:
                newtokens.pop()
            return newtokens
        else:
            return "NOTEXT"


def main(argv):
    if len(argv) != 2:
        print "Usage: python ImageOCR.py [path to image file]"
    else:
        ocr = ImageOCR()
        print ocr.getWords(argv[1])


if __name__ == "__main__":
    main(sys.argv)
