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
