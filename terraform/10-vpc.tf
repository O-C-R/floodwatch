resource "aws_vpc" "floodwatch" {
  cidr_block = "10.0.0.0/16"
  tags {
    Name = "floodwatch"
  }
}

resource "aws_internet_gateway" "floodwatch" {
  vpc_id = "${aws_vpc.floodwatch.id}"
  tags {
    Name = "floodwatch"
  }
}

resource "aws_subnet" "floodwatch-a" {
	vpc_id = "${aws_vpc.floodwatch.id}"
	cidr_block = "10.0.0.0/18"
	availability_zone = "us-east-1a"
	map_public_ip_on_launch = true
	tags {
		Name = "floodwatch-a"
	}
}

resource "aws_subnet" "floodwatch-c" {
	vpc_id = "${aws_vpc.floodwatch.id}"
	cidr_block = "10.0.64.0/18"
	availability_zone = "us-east-1c"
	map_public_ip_on_launch = true
	tags {
		Name = "floodwatch-c"
	}
}

resource "aws_subnet" "floodwatch-d" {
	vpc_id = "${aws_vpc.floodwatch.id}"
	cidr_block = "10.0.128.0/18"
	availability_zone = "us-east-1d"
	map_public_ip_on_launch = true
	tags {
		Name = "floodwatch-d"
	}
}

resource "aws_subnet" "floodwatch-e" {
	vpc_id = "${aws_vpc.floodwatch.id}"
	cidr_block = "10.0.192.0/18"
	availability_zone = "us-east-1e"
	map_public_ip_on_launch = true
	tags {
		Name = "floodwatch-e"
	}
}

resource "aws_db_subnet_group" "floodwatch" {
  name = "floodwatch"
  description = "floodwatch"
  subnet_ids = ["${aws_subnet.floodwatch-a.id}", "${aws_subnet.floodwatch-c.id}", "${aws_subnet.floodwatch-d.id}"]
  tags {
    Name = "floodwatch"
  }
}

resource "aws_elasticache_subnet_group" "floodwatch" {
  name = "floodwatch"
  description = "floodwatch"
  subnet_ids = ["${aws_subnet.floodwatch-a.id}", "${aws_subnet.floodwatch-c.id}", "${aws_subnet.floodwatch-d.id}"]
}
