// @flow

export type PersonResponse = {
  username: string,
  demographic_ids: Array<number>
};

export type DemographicFilterItem = {
  operator: 'nor' | 'and' | 'or',
  values: Array<number>
};

export type FilterRequestItem = {
  age?: {
    min?: number,
    max?: number
  },
  location?: {
    countryCodes: Array<number>
  },
  demographics?: Array<DemographicFilterItem>
};

export type FilterRequest = {
  filterA: FilterRequestItem,
  filterB: FilterRequestItem
};

export type AdCategoryId = string;

export type FilterResponse = {
  filterA: {
    categories: { [key: AdCategoryId]: number }
  },
  filterB: {
    categories: { [key: AdCategoryId]: number }
  }
};
