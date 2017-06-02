resource "aws_s3_bucket" "ads" {
  bucket              = "floodwatch-ads"
  acceleration_status = "Enabled"
}

resource "aws_s3_bucket" "gallery" {
  bucket              = "floodwatch-gallery"
  acl                 = "public-read"
  acceleration_status = "Enabled"
}
