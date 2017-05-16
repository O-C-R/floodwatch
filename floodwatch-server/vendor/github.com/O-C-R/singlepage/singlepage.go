package singlepage

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"errors"
	"io"
	"io/ioutil"
	"mime"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

func init() {
	mime.AddExtensionType(".json", "application/json")
}

var (
	directoryError = errors.New("directory error")
)

type SinglePageApplicationOptions struct {
	Root                       http.FileSystem
	Application, LongtermCache *regexp.Regexp

	// An optional function that is intended to replace bytes in index.html files.
	Replacer *func(req *http.Request, raw []byte) ([]byte, error)
}

type SinglePageApplication struct {
	options SinglePageApplicationOptions
}

func NewSinglePageApplication(options SinglePageApplicationOptions) *SinglePageApplication {
	return &SinglePageApplication{
		options: options,
	}
}

func acceptEncodingGzip(req *http.Request) bool {
	encodings := strings.Split(req.Header.Get("accept-encoding"), ",")
	for _, encoding := range encodings {
		if strings.TrimSpace(encoding) == "gzip" {
			return true
		}
	}

	return false
}

func (s *SinglePageApplication) open(req *http.Request, name string, allowGzip bool) (http.File, bool, error) {
	if allowGzip && acceptEncodingGzip(req) {
		// Attempt to open gzip encoding first
		file, err := s.options.Root.Open(name + ".gz")
		if err == nil {
			return file, true, nil
		}

		// If the error is anything other than the file not existing, pass it up.
		if !os.IsNotExist(err) {
			return nil, false, err
		}
	}

	file, err := s.options.Root.Open(name)
	return file, false, err
}

func (s *SinglePageApplication) serveFile(w http.ResponseWriter, req *http.Request, name string) error {
	// If we have a replacer and we're serving the index, don't
	// allow gzip, and prep to replace later.
	willEditIndex := s.options.Replacer != nil && name == "/index.html"

	// Attempt to open the file.
	file, gzipEncoded, err := s.open(req, name, !willEditIndex)
	if err != nil {
		return err
	}

	// Defer closing the file.
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return err
	}

	if fileInfo.IsDir() {
		return directoryError
	}

	// At this point, we might serve from the filesystem or a modified
	// buffer of it, so store that pointer here.
	var fileToServe io.ReadSeeker
	fileToServe = file

	// If we're on an index page that will be edited, read the file,
	// pass it to the replacer, and then use that as the new file.
	if willEditIndex {
		contents, err := ioutil.ReadAll(file)
		if err != nil {
			return err
		}

		contents, err = (*s.options.Replacer)(req, contents)
		if err != nil {
			return err
		}

		fileToServe = bytes.NewReader(contents)
	}

	// Get the SHA1 hash value for the file.
	fileHash := sha1.New()
	if _, err := io.Copy(fileHash, fileToServe); err != nil {
		return err
	}

	if _, err := fileToServe.Seek(0, 0); err != nil {
		return err
	}

	// Set an ETag header based on the SHA1 hash.
	fileHashSum := fileHash.Sum(nil)
	etag := `"` + base64.StdEncoding.EncodeToString(fileHashSum) + `"`
	w.Header().Set("etag", etag)

	// If the file is gzip-encoded, set a Content-Encoding header.
	if gzipEncoded {
		w.Header().Set("content-encoding", "gzip")
		w.Header().Set("vary", "accept-encoding")
	}

	// Set a Cache-Control header.
	if s.options.LongtermCache != nil && s.options.LongtermCache.MatchString(req.URL.Path) {
		w.Header().Set("cache-control", "max-age=31536000")
	} else {
		w.Header().Set("cache-control", "max-age=60")
	}

	http.ServeContent(w, req, name, time.Time{}, fileToServe)
	return nil
}

func (s *SinglePageApplication) serveAny(w http.ResponseWriter, req *http.Request, name string) error {

	// Attempt to serve the file.
	err := s.serveFile(w, req, name)

	// If the file is a directory, attempt to serve an index.
	if err == directoryError {
		return s.serveFile(w, req, name+"/index.html")
	}

	// If the file doesn't exist, but the URL path matches the application
	// regexp, attempt to serve the application index.
	if os.IsNotExist(err) && (s.options.Application == nil || s.options.Application.MatchString(req.URL.Path)) {
		return s.serveFile(w, req, "/index.html")
	}

	// Return any other error.
	return err
}

func (s *SinglePageApplication) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	name := req.URL.Path

	// Handle a request for index.html on the root level.
	if name == "/index.html" {
		http.Redirect(w, req, "/", 301)
		return
	}

	// Handle trailing slashes.
	if name != "/" && strings.HasSuffix(name, "/") {
		http.Redirect(w, req, strings.TrimSuffix(req.URL.Path, "/"), 301)
		return
	}

	// Handle a request for a sub-directory index.
	if strings.HasSuffix(name, "/index.html") {
		http.Redirect(w, req, strings.TrimSuffix(req.URL.Path, "/index.html"), 301)
		return
	}

	var err error
	if name == "/" {
		err = s.serveFile(w, req, "/index.html")
	} else {
		err = s.serveAny(w, req, name)
	}

	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, err.Error(), http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
