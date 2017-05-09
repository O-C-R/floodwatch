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
	CountryCodes []string `json:"countryCodes"`
}

type PersonFilter struct {
	Personal     *bool               `json:"personal"`
	Age          *RangeFilter        `json:"age"`
	Location     *LocationFilter     `json:"location"`
	Demographics []DemographicFilter `json:"demographics"`
}

type FilterResponseItem struct {
	Categories map[int]float32 `json:"categories"`
	TotalCount int             `json:"totalCount"`
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
	CalculationTime *int                `json:"calcTime,omitempty"`
}

type GenerateRequest struct {
	FilterA  PersonFilter `json:"filterA"`
	FilterB  PersonFilter `json:"filterB"`
	CurTopic int          `json:"curTopic"`
}

type GenerateData struct {
	FilterA  PersonFilter        `json:"filterA"`
	FilterB  PersonFilter        `json:"filterB"`
	DataA    *FilterResponseItem `json:"dataA"`
	DataB    *FilterResponseItem `json:"dataB"`
	CurTopic int                 `json:"curTopic"`
}
