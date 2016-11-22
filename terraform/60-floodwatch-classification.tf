data "template_file" "floodwatch-classification" {
  template = "${file("cloud-config/floodwatch-classification.yaml")}"
  vars {
    region = "us-east-1"
    input-queue-url = "${aws_sqs_queue.classifier-input.id}"
    output-queue-url = "${aws_sqs_queue.classifier-output.id}"
  }
}

resource "aws_spot_fleet_request" "floodwatch-classification" {
  iam_fleet_role = "${aws_iam_role.floodwatch-classification-spot-fleet.arn}"
  spot_price = "0.9"
  allocation_strategy = "lowestPrice"
  target_capacity = 1
  terminate_instances_with_expiration = true
  excess_capacity_termination_policy= "default"
  valid_until = "2017-12-31T23:59:59Z"
  launch_specification {
    instance_type = "p2.xlarge"
    ami = "ami-2281a335"
    key_name = "floodwatch"
	  iam_instance_profile = "${aws_iam_instance_profile.floodwatch-classification.id}"
		vpc_security_group_ids = ["${aws_security_group.ssh.id}", "${aws_security_group.floodwatch-classification.id}"]
	  subnet_id = "${aws_subnet.floodwatch-a.id},${aws_subnet.floodwatch-c.id},${aws_subnet.floodwatch-d.id},${aws_subnet.floodwatch-e.id}"
	  user_data = "${data.template_file.floodwatch-classification.rendered}"
    root_block_device {
      volume_size = "100"
      volume_type = "gp2"
    }
  }
}
