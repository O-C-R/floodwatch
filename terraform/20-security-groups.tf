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

resource "aws_security_group" "etcd" {
  name = "etcd"
  description = "etcd"
  vpc_id = "${aws_vpc.floodwatch.id}"

  ingress {
      from_port = 2379
      to_port = 2380
      protocol = "tcp"
      self = true
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
