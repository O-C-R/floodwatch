data "template_file" "etcd-a" {
  template = "${file("cloud-config/etcd.yaml")}"
  vars {
    hostname = "etcd-a"
  }
}

resource "aws_instance" "etcd-a" {
  ami = "ami-1c94e10b"
  instance_type = "t2.nano"
  subnet_id = "${aws_subnet.floodwatch-a.id}"
  private_ip = "10.0.0.10"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.etcd.id}"]
  user_data = "${data.template_file.etcd-a.rendered}"
  key_name = "floodwatch"
  root_block_device {
    volume_type = "gp2"
    volume_size = 32
  }
  tags {
    Name = "etcd-a"
  }
}

resource "aws_route53_record" "etcd-a" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "etcd-a.floodwatch.me"
  type = "A"
  ttl = "300"
  records = ["${aws_instance.etcd-a.public_ip}"]
}

data "template_file" "etcd-d" {
  template = "${file("cloud-config/etcd.yaml")}"
  vars {
    hostname = "etcd-d"
  }
}

resource "aws_instance" "etcd-c" {
  ami = "ami-1c94e10b"
  instance_type = "t2.nano"
  subnet_id = "${aws_subnet.floodwatch-c.id}"
  private_ip = "10.0.64.10"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.etcd.id}"]
  user_data = "${data.template_file.etcd-c.rendered}"
  key_name = "floodwatch"
  root_block_device {
    volume_type = "gp2"
    volume_size = 32
  }
  tags {
    Name = "etcd-c"
  }
}

resource "aws_route53_record" "etcd-c" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "etcd-c.floodwatch.me"
  type = "A"
  ttl = "300"
  records = ["${aws_instance.etcd-c.public_ip}"]
}

resource "aws_instance" "etcd-d" {
  ami = "ami-1c94e10b"
  instance_type = "t2.nano"
  subnet_id = "${aws_subnet.floodwatch-d.id}"
  private_ip = "10.0.128.10"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.etcd.id}"]
  user_data = "${data.template_file.etcd-d.rendered}"
  key_name = "floodwatch"
  root_block_device {
    volume_type = "gp2"
    volume_size = 32
  }
  tags {
    Name = "etcd-d"
  }
}

resource "aws_route53_record" "etcd-d" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "etcd-d.floodwatch.me"
  type = "A"
  ttl = "300"
  records = ["${aws_instance.etcd-d.public_ip}"]
}

data "template_file" "etcd-c" {
  template = "${file("cloud-config/etcd.yaml")}"
  vars {
    hostname = "etcd-c"
  }
}
