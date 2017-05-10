// @flow
import _ from 'lodash';

import type {PersonResponse} from '../api/types';
import type {Preset, Filter, DisabledCheck, FilterJSON, DemographicEntry} from './filtertypes'

import DemographicKeys from '../../stubbed_data/demographic_keys.json';

export type DemographicDictionary = {
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

    if (filter.name === 'age') {
      if (userData.birth_year) {
        return {
          'name': filter.name,
          'disabled': false
        }
      }
    } else if (filter.name === 'country') {
      if (userData.twofishes_id) {
        return {
          'name': filter.name,
          'disabled': false
        }
      }
    }

    const filteredDemographics = _.filter(DemographicKeys.demographic_keys, function(dk) {
      return _.find(userData.demographic_ids, function(di: DemographicEntry) {
        if (dk.id === di) {
          return di
        }
      })
    })

    const thisKey = DemographicKeys.category_to_id[filter.name]
    const found = _.find(filteredDemographics, function(fd: FilterJSON) {
      return (fd.category_id == thisKey)
    })

    if (found) {
      thisFilter.disabled = false;
    }

    return thisFilter
  })

  let needed = matches.filter(function(m: DisabledCheck) {
    if (m.disabled) {
      return m
    }
    return false
  })

  return {
    disabled: (needed.length === 0) ? false : true,
    required: needed
  }
}

export function shouldCustomBeDisabled(category: string, userData: PersonResponse) {
  let disabled = true;

  if (!userData) {
    return
  }

  // age works a lil differently
  if (category === 'age') {
    if (userData.birth_year) {
      return {
        disabled: false,
        name: category
      }
    }
  } else if (category === 'country') {
    if (userData.twofishes_id) {
      return {
        disabled: false,
        name: category
      }
    }

  }

  // and now the rest
  const filteredDemographics = _.filter(DemographicKeys.demographic_keys, function(dk) {
    return _.find(userData.demographic_ids, function(di: string) {
      if (dk.id === di) {
        return di
      }
    })
  })

  const thisKey = DemographicKeys.category_to_id[category]
  const found = _.find(filteredDemographics, function(fd: FilterJSON) {
    return (fd.category_id == thisKey)
  })

  if (found) {
    disabled = false;
  }

  return {
    disabled: disabled,
    name: category
  }
}
