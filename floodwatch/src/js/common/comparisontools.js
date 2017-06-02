// @flow

import _ from 'lodash';

import { calculatePercentDiff, joinArrEnglish } from './util';
import { UNKNOWN_ID, OTHER_BREAKDOWN } from './constants';

import type {
  VisibilityMap,
  AdCategoriesJSON,
  DemographicCategoriesJSON,
  DemographicCategory,
} from './types';
import type {
  FilterLogic,
  PersonResponse,
  FilterResponse,
  DemographicFilterItem,
  FilterRequestItem,
} from '../api/types';

const AdCategoryData: AdCategoriesJSON = require('../../data/ad_categories.json');
const DEMOGRAPHIC_CATEGORIES: DemographicCategoriesJSON = require('../../data/demographic_categories.json');

// Do some trickery to convince Flow to give us an array of values.
const DEMOGRAPHIC_CATEGORY_ARRAY: Array<DemographicCategory> = ((Object.values(
  DEMOGRAPHIC_CATEGORIES.categories,
): Array<any>): Array<DemographicCategory>);

// Reduce that array down to arrays of objects.
const DEMOGRAPHIC_CATEGORY_OPTIONS: Array<{
  id: ?number,
  name: string,
  options: Array<number>,
}> = DEMOGRAPHIC_CATEGORY_ARRAY.reduce((m, c: DemographicCategory) => {
  if (c.options) {
    m.push({
      id: c.category_id,
      name: c.name,
      options: c.options.map(o => o.id),
    });
  }
  return m;
}, []);

const DEMOGRAPHIC_ID_TO_NAME: {
  [key: number]: string,
} = DEMOGRAPHIC_CATEGORY_ARRAY.reduce((memo, cat) => {
  const newOptions = {};
  if (cat.options) {
    for (const { id, name } of cat.options) {
      // aeslint-disable-next-line no-param-reassign
      newOptions[id] = name;
    }
  }
  return Object.assign({}, memo, newOptions);
}, {});

export function getVisibilityMap(
  lD: FilterResponse,
  rD: FilterResponse,
): VisibilityMap {
  const { categories: ldCategories } = lD;
  const { categories: rdCategories } = rD;

  const visibilityMap = {};

  let comparisonData = {};
  if (_.isEmpty(ldCategories) && !_.isEmpty(rdCategories)) {
    comparisonData = _.cloneDeep(rdCategories);
  } else if (!_.isEmpty(ldCategories)) {
    comparisonData = _.cloneDeep(ldCategories);
  }

  for (const keyStr of Object.keys(comparisonData)) {
    const key = parseInt(keyStr, 10);

    if (key !== UNKNOWN_ID) {
      if (comparisonData[key] >= OTHER_BREAKDOWN) {
        visibilityMap[key] = 'show';
      } else {
        visibilityMap[key] = 'other';
      }
    } else {
      visibilityMap[key] = 'hide';
    }
  }

  return visibilityMap;
}

export function createSentence(
  filter: FilterRequestItem,
  { contextIsImpersonal = false }: {| contextIsImpersonal?: boolean |} = {},
): string {
  const { personal, age, location, demographics } = filter;

  if (personal && !contextIsImpersonal) {
    return 'You';
  } else if (personal) {
    return 'A Floodwatch user';
  }

  const parts = [];

  if (age) {
    const { min, max } = age;

    if (
      min !== null &&
      min !== undefined &&
      max !== null &&
      max !== undefined
    ) {
      parts.push(`are between ${min} and ${max} years old`);
    } else if (min !== null && min !== undefined) {
      parts.push(`are at least ${min} years old`);
    } else if (max !== null && max !== undefined) {
      parts.push(`are at most ${max} years old`);
    }
  }

  if (location) {
    const { country_codes } = location;
    const placeStr = joinArrEnglish(country_codes, 'or');
    if (placeStr) {
      parts.push(`live in ${placeStr}`);
    }
  }

  if (demographics) {
    for (const {
      operator,
      values: categoryIds,
    }: { operator: FilterLogic, values: Array<number> } of demographics) {
      const values = categoryIds.map(cId => DEMOGRAPHIC_ID_TO_NAME[cId]);

      const prefix = operator === 'nor' ? 'Non-' : '';
      const prefixedValues = values.map(v => `${prefix}${v}`);

      const join = operator === 'or' ? 'or' : 'and';
      const joined = joinArrEnglish(prefixedValues, join);

      if (joined) {
        parts.push(`are ${joined}`);
      }
    }
  }

  if (parts.length === 0) {
    return 'All Floodwatch users';
  }

  return `Floodwatch users who ${joinArrEnglish(parts, 'and')}`;
}

export function generateDifferenceSentence(
  leftFilter: FilterRequestItem,
  rightFilter: FilterRequestItem,
  leftVal: number,
  rightVal: number,
  categoryId: number,
): string {
  const { categories } = AdCategoryData;

  const categoryName = categories[categoryId]
    ? categories[categoryId].name
    : '';
  const leftSentence = createSentence(leftFilter);
  const rightSentence = createSentence(rightFilter);

  let sentence = '';
  const prc = Math.floor(calculatePercentDiff(leftVal, rightVal));

  // Math.sign isn't supported on Chromium fwiw
  if (prc === -Infinity) {
    sentence = `On average, ${leftSentence} don't see any ${categoryName} ads, as opposed to ${rightSentence}.`;
  } else if (prc === 100) {
    sentence = `On average, ${rightSentence} don't see any ${categoryName} ads, as opposed to ${leftSentence}.`;
  } else if (prc < 0) {
    sentence = `On average, ${leftSentence} see ${Math.abs(prc)}% fewer ${categoryName} ads than ${rightSentence}.`;
  } else if (prc > 0) {
    sentence = `On average, ${leftSentence} see ${prc}% more ${categoryName} ads than ${rightSentence}.`;
  } else if (prc === 0) {
    sentence = `${leftSentence} and ${rightSentence} see the same amount of ${categoryName} ads.`;
  }

  return sentence;
}

export function extraCategoryNamesRequired(
  userData: PersonResponse,
  filter: FilterRequestItem,
): Array<string> {
  if (filter.personal) {
    return [];
  }

  const categoryNames = [];

  // Special cases
  if (filter.age && !userData.birth_year) {
    categoryNames.push('age');
  }
  if (filter.location && !userData.country_code) {
    categoryNames.push('location');
  }

  // Demographic buckets
  if (filter.demographics) {
    const { demographics: filterDemo } = filter;

    for (const cat of DEMOGRAPHIC_CATEGORY_OPTIONS) {
      const userCat = _.intersection(cat.options, userData.demographic_ids);
      const relevantFilterDemo = filterDemo.find(c => c.category_id === cat.id);
      if (relevantFilterDemo) {
        const filterCat = _.intersection(
          cat.options,
          relevantFilterDemo.values,
        );

        if (filterCat.length > 0 && userCat.length === 0) {
          categoryNames.push(cat.name);
        }
      }
    }
  }

  return categoryNames;
}

export function availableCategoryNames(
  userData: PersonResponse,
): Array<string> {
  const available = [];

  if (userData.birth_year !== null && userData.birth_year !== undefined) {
    available.push('age');
  }
  if (userData.twofishes_id !== null && userData.twofishes_id !== undefined) {
    available.push('location');
  }

  for (const category of DEMOGRAPHIC_CATEGORY_ARRAY) {
    const { options } = category;
    if (options) {
      const optionIds = options.map(o => o.id);
      const intersect = _.intersection(optionIds, userData.demographic_ids);
      if (intersect.length > 0) {
        available.push(category.name);
      }
    }
  }

  return available;
}

export function filterItemByName(
  filter: FilterRequestItem,
  categoryName: string,
): ?DemographicFilterItem {
  return (
    filter.demographics &&
    filter.demographics.find(
      d =>
        d.category_id ===
        DEMOGRAPHIC_CATEGORIES.categories[categoryName].category_id,
    )
  );
}

export function assignDemographics(
  filter: FilterRequestItem,
  categoryName: string,
  operator: ?FilterLogic,
  values: ?Array<number>,
): FilterRequestItem {
  const cpy = _.cloneDeep(filter);
  const item = filterItemByName(cpy, categoryName);
  const categoryId =
    DEMOGRAPHIC_CATEGORIES.categories[categoryName].category_id;

  if (item && operator && values) {
    item.operator = operator;
    item.values = values;
  } else if (item && (!operator || !values)) {
    const { demographics } = cpy;
    if (demographics) {
      const idx = demographics.indexOf(item);
      cpy.demographics = demographics.splice(idx, 1);
    }
  } else if (!item && operator && values) {
    if (categoryId) {
      const op = {
        category_id: categoryId,
        operator,
        values,
      };

      if (cpy.demographics) {
        cpy.demographics.push(op);
      } else {
        cpy.demographics = [op];
      }
    }
  }

  if (cpy.demographics && cpy.demographics.length === 0) {
    delete cpy.demographics;
  }

  return cpy;
}

export function impersonalFilter(filter: FilterRequestItem) {
  const newFilter = _.cloneDeep(filter);
  delete newFilter.personal;
  return newFilter;
}
