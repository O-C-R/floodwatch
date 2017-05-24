// @flow

import type { FilterRequestItem } from '../api/types';

export type AdCategoryData = {
  id: string,
  name: string,
  colors: [string, string],
};

export type AdCategoriesJSON = {
  categories: { [key: number]: AdCategoryData },
};

export type DemographicCategoryOption = {
  id: number,
  name: string,
};

export type DemographicCategory = {
  category_id?: number,
  name: string,
  question: string,
  instruction?: string,
  why: string,
  options?: Array<DemographicCategoryOption>,
};

export type DemographicCategoriesJSON = {|
  categories: {| [name: string]: DemographicCategory |},
|};

export type Preset = {
  name: string,
  filter: FilterRequestItem,
  always_available?: boolean,
};

export type FilterPresetsJSON = {
  presets: Array<Preset>,
};

export type DisabledCheck = {
  disabled: boolean,
  name: string,
};

export type VisibilityMap = {
  [catId: number]: 'show' | 'hide' | 'other',
};
