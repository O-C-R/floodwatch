// @flow

export type PersonResponse = {
  username: string,
  demographic_ids: Array<number>
};

export type PersonDemographics = {
  birth_year: number,
  twofishes_id: string,
  demographic_ids: Array<number>
};

export type DemographicFilterItem = {
  operator: 'nor' | 'and' | 'or',
  values: Array<number>
};

// Set either personal: true, or some set of the other options.
export type FilterRequestItem = {
  personal?: boolean,
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
    categories: { [key: AdCategoryId]: number },
    totalCount: number
  },
  filterB: {
    categories: { [key: AdCategoryId]: number },
    totalCount: number
  }
};
