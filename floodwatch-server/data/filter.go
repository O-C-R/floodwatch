package data

type DemographicFilter struct {
	Logic  string `json:"logic"`
	Values []int  `json:"values"`
}

type RangeFilter struct {
	Min *int `json:"min"`
	Max *int `json:"max"`
}

type LocationFilter struct {
	CountryCodes []string `json:"country_codes"`
}

type PersonFilter struct {
	Age          *RangeFilter        `json:"age"`
	Location     *LocationFilter     `json:"location"`
	Demographics []DemographicFilter `json:"demographics"`
}

type FilterResponseItem struct {
	Categories map[int]float32 `json:"categories"`
	TotalCount int             `json:"total_count"`
}

func NewFilterResponseItem() *FilterResponseItem {
	return &FilterResponseItem{
		Categories: make(map[int]float32),
	}
}

type FilterRequest struct {
	FilterA PersonFilter `json:"filterA"`
	FilterB PersonFilter `json:"filterB"`
}

type FilterResponse struct {
	FilterA         *FilterResponseItem `json:"filterA"`
	FilterB         *FilterResponseItem `json:"filterB"`
	CalculationTime *int                `json:"calc_time,omitempty"`
}
