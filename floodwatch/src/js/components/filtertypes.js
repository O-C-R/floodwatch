// @flow

export type PresetsAndFilters = { //FilterObject
  presets: Array<Preset>,
  filters: Array<Filter>
};

export type Preset = { // FilterOptionsType
  name: string,
  filters: Array<Filter>,
  always_available?: boolean
};

export type FilterLogic = 'or' | 'nor' | 'and';

export type Filter = { // FilterType
  name: string,
  choices: Array<string>,
  logic: FilterLogic
};

export type DemographicEntry = {
  name: string,
  category_id: number,
  id: number
};

export type FilterJSON = {
  name: string,
  options: Array<string>,
  question: string,
  type: string,
  why: string,
  category_id?: number
};

export type DisabledCheck = {
  disabled: boolean,
  name: string
};
