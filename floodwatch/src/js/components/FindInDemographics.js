// @flow
import _ from 'lodash';

import type {PersonResponse} from '../api/types';
import type {Preset, Filter, DisabledCheck} from './filtertypes'

import DemographicKeys from '../../stubbed_data/demographic_keys.json';

type DemographicDictionary = {
  id: number,
  category_id: number,
  name: string
};

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
      const myKey = DemographicKeys.category_to_id[filter.name];
      const thisKey = _.find(DemographicKeys.demographic_keys, function(dk) {
        return dk.category_id == myKey
      })
      if (thisKey) {
        thisFilter.disabled = false;
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
  const myKey = DemographicKeys.category_to_id[category]

  const userVal = _.forEach(DemographicKeys.demographic_keys, function(dk) {
    if (dk.category_id == myKey) {
      return dk.category_id
    }
  })

  if (userVal && myKey) {
    disabled = false
  }

  return {
    disabled: disabled,
    name: category
  }
}
