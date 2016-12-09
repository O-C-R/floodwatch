// @flow

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type {PersonResponse} from '../api/types';
import type {Preset, Filter, DisabledCheck} from './filtertypes'

export function getCategoryKey(category: string): string {
  if (DemographicKeys.category_to_id[category] == undefined) {
    return ''
  }
  return DemographicKeys.category_to_id[category].toString();
}

type DemographicDictionary = {
  id: string,
  category_id: string,
  name: string
};

export function getCategoryOfUserVal(key: number): string {
  let k = '';

  DemographicKeys.demographic_keys.map((demo: DemographicDictionary) => {
    if (key == parseInt(demo.id)) {
      k = demo.category_id
    }
  })
  return k
}

export function shouldPresetBeDisabled(t: any, preset: Preset) {
  let ctx = t;
  if (preset.always_available) {
    return {
      disabled: false,
      required: []
    }
  }

  var matches = [];

  preset.filters.map((filter: Filter) => {
    let thisFilter = {
      'name': filter.name,
      'disabled': true
    }

    if (filter.name == 'age') {
      if (ctx.props.userData.birth_year) {
        thisFilter.disabled = false
      }
    } else {
      const myKey = getCategoryKey(filter.name)
      const values = ctx.props.userData.demographic_ids
      values.map((val: number) => {
        const thisKey = getCategoryOfUserVal(val)
        if (thisKey == myKey) {
          thisFilter.disabled = false
        }
      })
    }
    matches.push(thisFilter)
  })

  let needed = []
  matches.map((m: DisabledCheck) => {
    if (m.disabled) {
      needed.push(m)
    }
  })

  return {
    disabled: (needed.length == 0) ? false : true,
    required: needed
  }
}

export function shouldCustomBeDisabled(t: any, category: string, userData: PersonResponse) {
  let disabled = true;
  const ctx = t;

  // age works a lil differently 
  if (category == 'age') {
    if (ctx.props.userData.birth_year) {
      return {
        disabled: false,
        name: 'age'
      }
    }
  }

  // and now the rest
  const myKey = getCategoryKey(category)
  const userVal = getCategoryOfUserVal(parseInt(myKey))

  if (userVal != '' && myKey != '') {
    disabled = false
  }

  return {
    disabled: disabled,
    name: category
  }
}
