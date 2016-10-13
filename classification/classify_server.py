from flask import Flask, request, make_response, jsonify
from flask.json import JSONEncoder
import os.path
import tempfile
import numpy
from AdClassifier import AdClassifier

app = Flask(__name__)

# maximum upload size
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# a place to temporarily store images
app.config['UPLOAD_FOLDER'] = '/tmp/upload'

# log to stderr
app.config['DEBUG'] = True


class NumpyEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.integer):
            return int(obj)
        elif isinstance(obj, numpy.floating):
            return float(obj)
        elif isinstance(obj, numpy.ndarray):
            return obj.tolist()
        else:
            return super(NumpyEncoder, self).default(obj)
        return JSONEncoder.default(self, obj)

app.json_encoder = NumpyEncoder


@app.route('/', methods=['POST'])
def classify_image():
    file = request.files['file']
    if not file:
        return make_response('must send file', 400)

    filename = tempfile.mktemp(dir=app.config['UPLOAD_FOLDER'])

    try:
        file.save(filename)
        file.close()
        result = AdClassifier(useGPU=False).classify(imgPath=filename)
    finally:
        if os.path.isfile(filename):
            os.remove(filename)

    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0')
