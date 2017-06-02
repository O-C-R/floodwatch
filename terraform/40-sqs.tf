resource "aws_sqs_queue" "classifier-input" {
  name                      = "classifier-input"
  max_message_size          = 1024
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "classifier-output" {
  name                      = "classifier-output"
  max_message_size          = 1024
  message_retention_seconds = 1209600
}
