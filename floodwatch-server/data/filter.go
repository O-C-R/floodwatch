package data

type DemographicFilter struct {
	Operator string `json:"operator"`
	Values   []int  `json:"values"`
}

type RangeFilter struct {
	Min *int `json:"min"`
	Max *int `json:"max"`
}

type LocationFilter struct {
	CountryCodes []string `json:"country_codes"`
}

type PersonFilter struct {
	Personal     *bool               `json:"personal"`
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
	FilterA PersonFilter `json:"filter_a"`
	FilterB PersonFilter `json:"filter_b"`
}

type FilterResponse struct {
	DataA           *FilterResponseItem `json:"data_a"`
	DataB           *FilterResponseItem `json:"data_b"`
	CalculationTime *int                `json:"calc_time,omitempty"`
}

type GenerateRequest struct {
	FilterA  PersonFilter `json:"filter_a"`
	FilterB  PersonFilter `json:"filter_b"`
	CurTopic string       `json:"cur_topic"`
}
