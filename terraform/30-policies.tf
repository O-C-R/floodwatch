data "aws_iam_policy_document" "floodwatch-server" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
    ]
    resources = [
      "arn:aws:s3:::floodwatch-ads/*",
    ]
  }

  statement {
    actions = [
      "sqs:SendMessage",
    ]
    resources = [
      "${aws_sqs_queue.classifier-input.arn}",
    ]
  }

  statement {
    actions = [
      "sqs:DeleteMessage",
      "sqs:ReceiveMessage",
    ]
    resources = [
      "${aws_sqs_queue.classifier-output.arn}",
    ]
  }
}

resource "aws_iam_role" "floodwatch-server" {
  name = "floodwatch-server"
  assume_role_policy = <<EOF
{
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_instance_profile" "floodwatch-server" {
  name = "floodwatch-server"
  roles = ["${aws_iam_role.floodwatch-server.name}"]
}

data "aws_iam_policy_document" "floodwatch-classification" {
  statement {
    actions = [
      "s3:GetObject",
    ]
    resources = [
      "arn:aws:s3:::floodwatch-ads/*",
    ]
  }

  statement {
    actions = [
      "sqs:DeleteMessage",
      "sqs:ReceiveMessage",
    ]
    resources = [
      "${aws_sqs_queue.classifier-input.arn}",
    ]
  }

  statement {
    actions = [
      "sqs:SendMessage",
    ]
    resources = [
      "${aws_sqs_queue.classifier-output.arn}",
    ]
  }
}

resource "aws_iam_role" "floodwatch-classification" {
  name = "floodwatch-classification"
  assume_role_policy = <<EOF
{
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "floodwatch-classification" {
  name = "floodwatch-classification"
  role = "${aws_iam_role.floodwatch-classification.id}"
  policy = "${data.aws_iam_policy_document.floodwatch-classification.json}"
}

resource "aws_iam_instance_profile" "floodwatch-classification" {
  name = "floodwatch-classification"
  roles = ["${aws_iam_role.floodwatch-classification.name}"]
}

data "aws_iam_policy_document" "floodwatch-classification-spot-fleet" {
  statement {
    actions = [
      "ec2:DescribeImages",
      "ec2:DescribeSubnets",
      "ec2:RequestSpotInstances",
      "ec2:TerminateInstances",
      "iam:PassRole",
    ]
    resources = [
      "*",
    ]
  }
}

resource "aws_iam_role" "floodwatch-classification-spot-fleet" {
  name = "floodwatch-classification-spot-fleet"
  assume_role_policy = <<EOF
{
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "spotfleet.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "floodwatch-classification-spot-fleet" {
  name = "floodwatch-classification-spot-fleet"
  role = "${aws_iam_role.floodwatch-classification-spot-fleet.id}"
  policy = "${data.aws_iam_policy_document.floodwatch-classification-spot-fleet.json}"
}
