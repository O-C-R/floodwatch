data "template_file" "floodwatch-server-a" {
  template = "${file("cloud-config/floodwatch-server.yaml")}"
  vars {
    hostname = "floodwatch-server-a"
    az = "us-east-1a"
    role = "server"
  }
}

resource "aws_instance" "floodwatch-server-a" {
  ami = "ami-1c94e10b"
  instance_type = "t2.medium"
  subnet_id = "${aws_subnet.floodwatch-a.id}"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.etcd.id}", "${aws_security_group.floodwatch-server.id}"]
  user_data = "${data.template_file.floodwatch-server-a.rendered}"
  key_name = "floodwatch"
  iam_instance_profile = "${aws_iam_instance_profile.floodwatch-server.id}"
  root_block_device {
    volume_type = "gp2"
    volume_size = 32
  }
  tags {
    Name = "floodwatch-server-a"
  }
}

resource "aws_route53_record" "floodwatch-server-a" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "floodwatch-server-a.floodwatch.me"
  type = "A"
  ttl = "60"
  records = ["${aws_instance.floodwatch-server-a.public_ip}"]
}

data "template_file" "floodwatch-server-c" {
  template = "${file("cloud-config/floodwatch-server.yaml")}"
  vars {
    hostname = "floodwatch-server-c"
    az = "us-east-1c"
    role = "server"
  }
}

resource "aws_instance" "floodwatch-server-c" {
  ami = "ami-1c94e10b"
  instance_type = "t2.medium"
  subnet_id = "${aws_subnet.floodwatch-c.id}"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.etcd.id}", "${aws_security_group.floodwatch-server.id}"]
  user_data = "${data.template_file.floodwatch-server-c.rendered}"
  key_name = "floodwatch"
  iam_instance_profile = "${aws_iam_instance_profile.floodwatch-server.id}"
  root_block_device {
    volume_type = "gp2"
    volume_size = 32
  }
  tags {
    Name = "floodwatch-server-c"
  }
}

resource "aws_route53_record" "floodwatch-server-c" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "floodwatch-server-c.floodwatch.me"
  type = "A"
  ttl = "60"
  records = ["${aws_instance.floodwatch-server-c.public_ip}"]
}
