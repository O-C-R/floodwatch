package data

type ClassificationResponse struct {
	IsAd       float64            `json:"is ad"`
	IsNotAd    float64            `json:"is not ad"`
	Categories map[string]float64 `json:"tags"`
}

func (r *ClassificationResponse) MostProbableCategory() (string, float64) {
	mostProbableCategory, maxProbability := "", .0
	for category, probability := range r.Categories {
		if probability > maxProbability {
			mostProbableCategory, maxProbability = category, probability
		}
	}

	return mostProbableCategory, maxProbability
}
