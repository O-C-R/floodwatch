package webserver

import (
	"fmt"
	"net/http"
)

func httpsRedirect(w http.ResponseWriter, req *http.Request) {
	http.Redirect(w, req,
		"https://"+req.Host+req.URL.String(),
		http.StatusMovedPermanently)
}

func NewRedirectServer(options *Options) *http.Server {
	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", options.RedirectPort),
		Handler: http.HandlerFunc(httpsRedirect),
	}

	return server
}
