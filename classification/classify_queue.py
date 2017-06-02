from AdClassifier import AdClassifier
from json import JSONEncoder
import boto3
import numpy
import os
import tempfile
import traceback
import time

class NumpyEncoder(JSONEncoder):
	def default(self, obj):
		if isinstance(obj, numpy.integer):
			return int(obj)
		if isinstance(obj, numpy.floating):
			return float(obj)
		if isinstance(obj, numpy.ndarray):
			return obj.tolist()
		return super(self, obj)

jsonEncoder = NumpyEncoder()

sqs = boto3.client('sqs')
s3 = boto3.client('s3')
classifier = AdClassifier(useGPU=True)

while True:
	receiveMessageResponse = sqs.receive_message(
		QueueUrl=os.environ['INPUT_QUEUE_URL'],
		MessageAttributeNames=['id','bucket','key'],
		MaxNumberOfMessages=1,
		VisibilityTimeout=60,
		WaitTimeSeconds=20
	)

	if 'Messages' not in receiveMessageResponse:
		continue

	for message in receiveMessageResponse['Messages']:
		try:
			start = time.time()

			getObjectResponse = s3.get_object(
				Bucket=message['MessageAttributes']['bucket']['StringValue'],
				Key=message['MessageAttributes']['key']['StringValue'],
			)

			objectFile=tempfile.NamedTemporaryFile(delete=False)
			for chunk in iter(lambda: getObjectResponse['Body'].read(1024), b''):
				objectFile.write(chunk)
			objectFile.close()

			classifyResult=classifier.classify(imgPath=objectFile.name)

			sqs.send_message(
				QueueUrl=os.environ['OUTPUT_QUEUE_URL'],
				MessageBody=jsonEncoder.encode(classifyResult),
				MessageAttributes={
					'id': {
						'StringValue': message['MessageAttributes']['id']['StringValue'],
						'DataType': 'String'
					}
				}
			)
		except:
			print(traceback.format_exc())

		try:
			sqs.delete_message(
				QueueUrl=os.environ['INPUT_QUEUE_URL'],
				ReceiptHandle=message['ReceiptHandle']
			)
		except:
			print(traceback.format_exc())

		try:
			if os.path.isfile(objectFile.name):
				os.remove(objectFile.name)
		except:
			print(traceback.format_exc())

		end = time.time()
		print 'classified %s in %0.3f ms' % (message['MessageAttributes']['id']['StringValue'], (end-start)*1000.0)
