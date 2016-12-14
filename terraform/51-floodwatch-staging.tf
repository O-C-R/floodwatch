data "template_file" "floodwatch-server-staging" {
  template = "${file("cloud-config/floodwatch-server.yaml")}"
  vars {
    hostname = "floodwatch-server-staging"
  }
}

resource "aws_instance" "floodwatch-server-staging" {
  ami = "ami-4d795c5a"
  instance_type = "t2.medium"
  subnet_id = "${aws_subnet.floodwatch-a.id}"
  associate_public_ip_address = true
  vpc_security_group_ids = [
    "${aws_security_group.ssh.id}",
    "${aws_security_group.floodwatch-server.id}"
  ]
  user_data = "${data.template_file.floodwatch-server-staging.rendered}"
  key_name = "floodwatch"
  iam_instance_profile = "${aws_iam_instance_profile.floodwatch-server.id}"
  root_block_device {
    volume_type = "gp2"
    volume_size = 100
  }
  tags {
    Name = "floodwatch-server-staging"
  }
}

resource "aws_route53_record" "floodwatch-server-staging" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "floodwatch-server-staging.floodwatch.me"
  type = "A"
  ttl = "60"
  records = ["${aws_instance.floodwatch-server-staging.public_ip}"]
}

resource "aws_elb" "floodwatch-staging" {
  name = "floodwatch-staging"
  subnets = [
    "${aws_subnet.floodwatch-a.id}",
    "${aws_subnet.floodwatch-c.id}",
    "${aws_subnet.floodwatch-d.id}"
  ]
  security_groups = ["${aws_security_group.floodwatch-server-elb.id}"]

  listener {
    instance_port = 80
    instance_protocol = "http"
    lb_port = 443
    lb_protocol = "https"
    ssl_certificate_id = "arn:aws:acm:us-east-1:963245043784:certificate/0cabd13e-7ce1-4bcf-9a33-3372e67b8636"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 3
    target = "HTTP:80/"
    interval = 30
  }

  instances = ["${aws_instance.floodwatch-server-staging.id}"]
  cross_zone_load_balancing = true

  tags {
    Name = "floodwatch-staging"
  }
}

resource "aws_route53_record" "staging-floodwatch-me" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name = "staging.floodwatch.me"
  type = "CNAME"
  ttl = "60"
  records = ["${aws_elb.floodwatch-staging.dns_name}"]
}
