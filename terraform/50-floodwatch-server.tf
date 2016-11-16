data "template_file" "floodwatch-server-a" {
  template = "${file("cloud-config/floodwatch-server.yaml")}"
  vars {
    hostname = "floodwatch-server-a"
  }
}

resource "aws_instance" "floodwatch-server-a" {
  ami = "ami-4d795c5a"
  instance_type = "t2.medium"
  subnet_id = "${aws_subnet.floodwatch-a.id}"
  associate_public_ip_address = true
  vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.floodwatch-server.id}"]
  user_data = "${data.template_file.floodwatch-server-a.rendered}"
  key_name = "floodwatch"
  iam_instance_profile = "${aws_iam_instance_profile.floodwatch-server.id}"
  root_block_device {
    volume_type = "gp2"
    volume_size = 100
  }
  tags {
    Name = "floodwatch-server-a"
  }
}


resource "aws_elb" "floodwatch" {
  name = "floodwatch"
  subnets = ["${aws_subnet.floodwatch-a.id}", "${aws_subnet.floodwatch-c.id}", "${aws_subnet.floodwatch-d.id}"]
  security_groups = ["${aws_security_group.floodwatch-server-elb.id}"]
  
  listener {
    instance_port = 443
    instance_protocol = "http"
    lb_port = 80
    lb_protocol = "https"
    ssl_certificate_id = "arn:aws:acm:us-east-1:963245043784:certificate/7f55d237-6b70-4f8e-8c84-2198b109c6ba"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 3
    target = "HTTP:80/"
    interval = 30
  }

  instances = ["${aws_instance.floodwatch-server-a.id}"]
  cross_zone_load_balancing = true

  tags {
    Name = "floodwatch"
  }
}

resource "aws_route53_record" "beta-floodwatch-me" {
   zone_id = "Z1QWEZUQ6RWVUS"
   name = "beta.floodwatch.me"
   type = "CNAME"
   ttl = "60"
   records = ["${aws_elb.floodwatch.dns_name}"]
}
