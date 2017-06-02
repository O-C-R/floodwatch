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
		"--hide-scrollbars",
		"--screenshot",
		"--high-dpi-support=1",
		"--force-device-scale-factor=2",
		"--virtual-time-budget=1500",
		url,
	)
	cmd.Dir = dir

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, errors.Wrap(err, "error getting stderr")
	}

	stdout, err := cmd.Output()
	if err != nil {
		stderrSlurp, _ := ioutil.ReadAll(stderr)
		return nil, errors.Wrapf(err, "error running chrome\nstdout: %s\nstderr: %s", stdout, stderrSlurp)
	}

	imgFile := path.Join(dir, "screenshot.png")
	imgData, err := ioutil.ReadFile(imgFile)
	if err != nil {
		return nil, errors.Wrap(err, "error reading img")
	}

	return imgData, nil
}
