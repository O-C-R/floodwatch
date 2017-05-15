package webserver

import (
	"net/http"

	"github.com/O-C-R/auth/id"
	"github.com/gorilla/mux"
	"github.com/pkg/errors"
)

func GetGalleryImage(options *Options) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		vars := mux.Vars(req)
		imageIDStr := vars["imageID"]

		var imageID = id.ID{}
		err := imageID.UnmarshalText([]byte(imageIDStr))
		if err != nil {
			Error(w, errors.New("bad image id"), 400)
			return
		}

		galleryImage, err := options.Backend.GetGalleryImage(imageID)
		if err != nil {
			Error(w, errors.Wrap(err, "error loading image"), 400)
			return
		}
		if galleryImage == nil {
			Error(w, errors.New("no image found"), 404)
			return
		}

		res, err := galleryImage.ToResponse(options.S3GalleryBucket)
		if err != nil {
			Error(w, errors.Wrap(err, "couldn't serialize response"), 500)
			return
		}

		WriteJSON(w, res)
	})
}
