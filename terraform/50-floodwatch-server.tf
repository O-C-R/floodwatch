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
