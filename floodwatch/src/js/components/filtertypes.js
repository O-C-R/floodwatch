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

export type Filter = { // FilterType
  name: string,
  choices: Array<string>,
  logic: string
};

export type FilterJSON = {
  name: string,
  options: Array<string>,
  question: string,
  type: string,
  why: string

};

export type DisabledCheck = {
  disabled: boolean,
  name: string
};
