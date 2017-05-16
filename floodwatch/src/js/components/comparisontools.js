// @flow

import _ from 'lodash';

import TopicKeys from '../../stubbed_data/topic_keys.json';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';

import type { Preset, Filter, FilterLogic } from './filtertypes';
import type { VisibilityMap } from './Compare';
import type { FilterResponse, FilterRequestItem } from '../api/types';

const UNKNOWN_ID = '16';
const OTHER_BREAKDOWN = 0.02;

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

  for (const key in comparisonData) {
    if (key !== UNKNOWN_ID) {
      // Hide cats (16 is unknown)
      if (
        comparisonData[key] > OTHER_BREAKDOWN ||
        comparisonData[key] > OTHER_BREAKDOWN
      ) {
        // Make sure cats are above some percentage for both side
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

export function generateDifferenceSentence(
  lO: Array<Filter>,
  rO: Array<Filter>,
  lVal: number,
  rVal: number,
  currentTopic: ?string,
): string {
  let sentence = '';
  const prc = Math.floor(calculatePercentDiff(lVal, rVal));

  // Math.sign isn't supported on Chromium fwiw
  if (prc === -Infinity) {
    sentence = `On average, ${createSentence(lO)} don't see any ${TopicKeys[currentTopic]} ads, as opposed to ${createSentence(rO)}.`;
  } else if (prc === 100) {
    sentence = `On average, ${createSentence(rO)} don't see any ${TopicKeys[currentTopic]} ads, as opposed to ${createSentence(lO)}.`;
  } else if (prc < 0) {
    sentence = `On average, ${createSentence(lO)} see ${Math.abs(prc)}% fewer ${TopicKeys[currentTopic]} ads than ${createSentence(rO)}.`;
  } else if (prc > 0) {
    sentence = `On average, ${createSentence(lO)} see ${prc}% more ${TopicKeys[currentTopic]} ads than ${createSentence(rO)}.`;
  } else if (prc === 0) {
    sentence = `${createSentence(lO)} and ${createSentence(rO)} see the same amount of ${TopicKeys[currentTopic]} ads.`;
  }

  return sentence;
}

export function createSentence(
  options: Array<Filter>,
  impersonal: boolean = false,
): string {
  let sentence = 'Floodwatch users';

  if (options[0] == undefined) {
    sentence = `All ${sentence}`;
    return sentence;
  }

  if (options[0].name === 'data') {
    if (!impersonal) {
      return 'You';
    }
    return 'A Floodwatch user';
  }

  sentence += ' who are ';

  _.forEach(options, (opt: Filter, index: number) => {
    if (opt.choices.length == 0) return;

    let logic = '';
    let choices = '';

    let wrappedChoices = opt.choices;

    if (opt.name == 'age') {
      wrappedChoices = wrappedChoices.map(c => `${c} years old`);
    }

    if (opt.name == 'country') {
      wrappedChoices = wrappedChoices.map(c => `currently living in ${c}`);
    }

    if (opt.logic === 'nor') {
      logic = 'Non-';
      choices = wrappedChoices.join(' and Non-');
      choices = logic + choices;
    } else {
      choices = wrappedChoices.join(` ${opt.logic} `);
    }

    sentence = sentence + (index > 0 ? ', and ' : ' ') + choices;
  });

  return sentence;
}

export function decodeFilterRequestItem(
  filter: FilterRequestItem,
): Array<Filter> {
  const keys = _.keys(filter);

  if (filter.personal) {
    return [
      {
        name: 'data',
        logic: 'or',
        choices: ['You'],
      },
    ];
  }

  const optionsArr = [];

  if (filter.age && filter.age.min && filter.age.max) {
    const str = `${filter.age.min}-${filter.age.max}`;
    optionsArr.push({
      name: 'age',
      logic: 'or',
      choices: [str],
    });
  }

  if (filter.location) {
    const countries = filter.location.country_codes;
    optionsArr.push({
      name: 'country',
      logic: 'or',
      choices: countries,
    });
  }

  if (filter.demographics) {
    for (const o of filter.demographics) {
      const newObj = {};

      newObj.logic = o.operator;
      newObj.choices = [];
      o.values.forEach((v) => {
        const choice = _.find(DemographicKeys.demographic_keys, { id: v });
        newObj.choices.push(choice.name);
      });

      // get category of first elem to check what name of category is
      const sampleElem = _.find(
        DemographicKeys.demographic_keys,
        dk => dk.id == o.values[0],
      );
      const category = _.findKey(
        DemographicKeys.category_to_id,
        ci => ci == sampleElem.category_id,
      );

      newObj.name = 'category';

      optionsArr.push(newObj);
    }
  }

  return optionsArr;
}

function calculatePercentDiff(a: number, b: number): number {
  const abs = a - b;
  const denom = Math.abs(b);
  const prc = abs / denom * 100;
  return prc;
}
