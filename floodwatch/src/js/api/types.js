// @flow

export type PersonResponse = {
  username: string,
  admin: boolean,
  birth_year?: number,
  twofishes_id?: string,
  country_code?: string,
  demographic_ids: Array<number>,
  last_seen: string,
  created_at?: string,
};

export type PersonDemographicsRequest = {
  birth_year: ?number,
  twofishes_id: ?string,
  demographic_ids: ?Array<number>,
};

export type FilterLogic = 'or' | 'nor' | 'and';

export type DemographicFilterItem = {
  category_id: number,
  operator: FilterLogic,
  values: Array<number>,
};

// Set either personal: true, or some set of the other options.
export type FilterRequestItem = {
  personal?: boolean,
  age?: {
    min?: number,
    max?: number,
  },
  location?: {
    country_codes: Array<string>,
  },
  demographics?: Array<DemographicFilterItem>,
};

export type FilterPair = {
  filter_a: FilterRequestItem,
  filter_b: FilterRequestItem,
};

export type AdCategoryId = number;

export type FilterResponse = {
  categories: { [key: AdCategoryId]: number },
  total_count: number,
};

export type FiltersResponse = {
  data_a: FilterResponse,
  data_b: FilterResponse,
};

export type GalleryImageRequest = {
  filter_a: FilterRequestItem,
  filter_b: FilterRequestItem,
  cur_category_id: ?number,
};

export type GalleryImageData = {
  filter_a: FilterRequestItem,
  filter_b: FilterRequestItem,
  data_a: FilterResponse,
  data_b: FilterResponse,
  cur_category_id: ?number,
};

export type GalleryImageResponse = {
  slug: string,
  data: GalleryImageData,
  url: string,
  created_at: string,
};

export type ImpressionsRequest = {
  before?: string,
  limit?: number,
};

export type ImpressionResponseItem = {
  id: string,
  ad_id: string,
  category_id: number,
  classifier_output: {
    tags?: { [key: string]: number },
    'is ad'?: number,
    'is not ad'?: number,
  },
  top_url: string,
  timestamp: string,
};

export type ImpressionsResponse = {
  impressions: ImpressionResponseItem[],
};
