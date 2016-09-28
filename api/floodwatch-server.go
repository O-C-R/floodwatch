package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/O-C-R/floodwatch-server/api/api/v1"
	"github.com/O-C-R/floodwatch-server/api/backend"
)

var (
	config struct {
		backendURL, sessionStoreAddr, sessionStorePassword string
		addr                                               string
	}
)

func init() {
	flag.StringVar(&config.backendURL, "backend-url", "postgres://localhost/floodwatch?sslmode=disable", "postgres backend URL")
	flag.StringVar(&config.sessionStoreAddr, "session-store-address", "localhost:6379", "redis session store address")
	flag.StringVar(&config.sessionStorePassword, "session-store-password", "", "redis session store password")
	flag.StringVar(&config.addr, "a", "127.0.0.1:8080", "address to listen on")
}

func main() {
	flag.Parse()

	if backendURL := os.Getenv("BACKEND_URL"); backendURL != "" {
		config.backendURL = backendURL
	}

	if sessionStoreAddr := os.Getenv("SESSION_STORE_ADDRESS"); sessionStoreAddr != "" {
		config.sessionStoreAddr = sessionStoreAddr
	}

	if sessionStorePassword := os.Getenv("SESSION_STORE_PASSWORD"); sessionStorePassword != "" {
		config.sessionStorePassword = sessionStorePassword
	}

	b, err := backend.New(config.backendURL)
	if err != nil {
		log.Fatal(err)
	}

	sessionStore, err := backend.NewSessionStore(backend.SessionStoreOptions{
		Addr:            config.sessionStoreAddr,
		Password:        config.sessionStorePassword,
		SessionDuration: time.Hour * 72,
	})
	if err != nil {
		log.Fatal(err)
	}

	apiHandler, err := v1.NewHandler(&v1.Options{
		Backend:      b,
		SessionStore: sessionStore,
	})

	// Build a new server mux.
	mux := http.NewServeMux()
	mux.Handle("/api/v1/", apiHandler)

	handler := http.Handler(mux)

	log.Printf("🌊  %s\n", config.addr)
	log.Fatal(
		http.ListenAndServe(config.addr, handler))
}
