resource "aws_security_group" "ssh" {
  name = "ssh"
  description = "ssh"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
      from_port = 22
      to_port = 22
      protocol = "tcp"
      cidr_blocks = ["24.103.10.214/32"]
  }

  egress {
      from_port = 0
      to_port = 0
      protocol = "-1"
      cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "floodwatch-server-elb" {
  name = "floodwatch-server-elb"
  description = "floodwatch-server-elb"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
      from_port = 80
      to_port = 80
      protocol = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
      from_port = 443
      to_port = 443
      protocol = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
      from_port = 0
      to_port = 0
      protocol = "-1"
      cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "floodwatch-server" {
  name = "floodwatch-server"
  description = "floodwatch-server"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
      from_port = 80
      to_port = 80
      protocol = "tcp"
      security_groups = ["${aws_security_group.floodwatch-server-elb.id}"]
  }

  ingress {
      from_port = 8000
      to_port = 8000
      protocol = "tcp"
      security_groups = ["${aws_security_group.floodwatch-server-elb.id}"]
  }

  egress {
      from_port = 0
      to_port = 0
      protocol = "-1"
      cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "floodwatch-classification" {
  name = "floodwatch-classification"
  description = "floodwatch-classification"
  vpc_id = "${aws_vpc.floodwatch.id}"

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "floodwatch-twofishes-elb" {
  name = "floodwatch-twofishes-elb"
  description = "floodwatch-twofishes-elb"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
      from_port = 80
      to_port = 80
      protocol = "tcp"
      cidr_blocks = ["24.103.10.214/32"]
      security_groups = ["${aws_security_group.floodwatch-server.id}"]
  }

  egress {
      from_port = 0
      to_port = 0
      protocol = "-1"
      cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "floodwatch-twofishes" {
  name = "floodwatch-twofishes"
  description = "floodwatch-twofishes"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
      from_port = 8081
      to_port = 8081
      protocol = "tcp"
      security_groups = ["${aws_security_group.floodwatch-twofishes-elb.id}"]
  }

  egress {
      from_port = 0
      to_port = 0
      protocol = "-1"
      cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "postgresql" {
  name = "postgresql"
  description = "postgresql"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    security_groups = ["${aws_security_group.floodwatch-server.id}"]
  }
}

resource "aws_security_group" "redis" {
  name = "redis"
  description = "redis"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
    from_port = 6379
    to_port = 6379
    protocol = "tcp"
    security_groups = ["${aws_security_group.floodwatch-server.id}"]
  }
}
