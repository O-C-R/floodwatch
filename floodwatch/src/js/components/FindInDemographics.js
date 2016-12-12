// @flow

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type {PersonResponse} from '../api/types';
import type {Preset, Filter, DisabledCheck} from './filtertypes'

export function getCategoryKey(category: string): number {
  if (DemographicKeys.category_to_id[category] == undefined) {
    return -1
  }
  return DemographicKeys.category_to_id[category]
}

type DemographicDictionary = {
  id: number,
  category_id: number,
  name: string
};

export function getCategoryOfUserVal(key: number): number {
  let k = -1;

  DemographicKeys.demographic_keys.map((demo: DemographicDictionary) => {
    if (key == demo.id) {
      k = demo.category_id
    }
  })
  return k
}

export function shouldPresetBeDisabled(userData: PersonResponse, preset: Preset) {
  if (preset.always_available) {
    return {
      disabled: false,
      required: []
    }
  }

  let matches = preset.filters.map((filter: Filter) => {
    let thisFilter = {
      'name': filter.name,
      'disabled': true
    }

    if (filter.name == 'age') {
      if (userData.birth_year) {
        thisFilter.disabled = false
      }
    } else {
      const myKey = getCategoryKey(filter.name)
      const values = userData.demographic_ids
      for (let val of values) {
        const thisKey = getCategoryOfUserVal(val)
        if (thisKey == myKey && myKey != -1) {
          thisFilter.disabled = false
        }
      }
    }
    return thisFilter
  })

  let needed = matches.filter(function(m: DisabledCheck) {
    if (m.disabled) {
      return m
    }
  })

  return {
    disabled: (needed.length == 0) ? false : true,
    required: needed
  }
}

export function shouldCustomBeDisabled(category: string, userData: PersonResponse) {
  let disabled = true;

  // age works a lil differently 
  if (category == 'age') {
    if (userData.birth_year) {
      return {
        disabled: false,
        name: 'age'
      }
    }
  }

  // and now the rest
  const myKey = getCategoryKey(category)
  const userVal = getCategoryOfUserVal(myKey)

  if (userVal > -1 && myKey > -1) {
    disabled = false
  }

  return {
    disabled: disabled,
    name: category
  }
}
