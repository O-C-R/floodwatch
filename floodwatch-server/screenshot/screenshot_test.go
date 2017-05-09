package screenshot

import (
	"testing"
)

func TestScreenshot(t *testing.T) {
	s := &Screenshotter{
		executable: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
	}

	_, err := s.Capture("https://www.chromestatus.com/")
	if err != nil {
		t.Fatal(err)
	}
}
