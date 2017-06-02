data "template_file" "floodwatch-twofishes-a" {
  template = "${file("cloud-config/floodwatch-server.yaml")}"

  vars {
    hostname = "floodwatch-twofishes-a"
  }
}

resource "aws_instance" "floodwatch-twofishes-a" {
  ami                         = "ami-4d795c5a"
  instance_type               = "t2.medium"
  subnet_id                   = "${aws_subnet.floodwatch-a.id}"
  associate_public_ip_address = true
  vpc_security_group_ids      = ["${aws_security_group.ssh.id}", "${aws_security_group.floodwatch-twofishes.id}"]
  user_data                   = "${data.template_file.floodwatch-twofishes-a.rendered}"
  key_name                    = "floodwatch"

  root_block_device {
    volume_type = "gp2"
    volume_size = 100
  }

  tags {
    Name = "floodwatch-twofishes-a"
  }
}

resource "aws_route53_record" "floodwatch-twofishes-a" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name    = "floodwatch-twofishes-a.floodwatch.me"
  type    = "A"
  ttl     = "60"
  records = ["${aws_instance.floodwatch-twofishes-a.public_ip}"]
}

resource "aws_elb" "floodwatch-twofishes" {
  name            = "floodwatch-twofishes"
  subnets         = ["${aws_subnet.floodwatch-a.id}", "${aws_subnet.floodwatch-c.id}", "${aws_subnet.floodwatch-d.id}"]
  security_groups = ["${aws_security_group.floodwatch-twofishes-elb.id}"]
  internal        = true

  listener {
    instance_port     = 8081
    instance_protocol = "http"
    lb_port           = 80
    lb_protocol       = "http"
  }

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    target              = "HTTP:8081/?query=nyc"
    interval            = 5
  }

  instances                 = ["${aws_instance.floodwatch-twofishes-a.id}"]
  cross_zone_load_balancing = true

  tags {
    Name = "floodwatch-twofishes"
  }
}

resource "aws_route53_record" "twofishes-floodwatch-me" {
  zone_id = "Z1QWEZUQ6RWVUS"
  name    = "twofishes.floodwatch.me"
  type    = "CNAME"
  ttl     = "60"
  records = ["${aws_elb.floodwatch-twofishes.dns_name}"]
}
