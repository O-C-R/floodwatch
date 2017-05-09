package screenshot

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path"

	"github.com/pkg/errors"
)

type Screenshotter struct {
	Executable string
}

func (s *Screenshotter) Capture(url string) ([]byte, error) {
	dir, err := ioutil.TempDir("", "screenshot")
	if err != nil {
		return nil, errors.Wrap(err, "failed to create tmp dir")
	}
	defer os.RemoveAll(dir)

	cmd := exec.Command(
		s.Executable,
		"--headless",
		"--disable-gpu",
		"--screenshot",
		"--virtual-time-budget=1500",
		// "--remote-debugging-port=9222",
		// "--window-size=1280,1696",
		url,
	)
	cmd.Dir = dir

	err = cmd.Run()
	if err != nil {
		return nil, errors.Wrap(err, "error running chrome")
	}

	imgFile := path.Join(dir, "screenshot.png")
	imgData, err := ioutil.ReadFile(imgFile)
	if err != nil {
		return nil, errors.Wrap(err, "error reading img")
	}

	return imgData, nil
}
