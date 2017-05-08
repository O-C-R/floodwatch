//@flow

const unknownId = "16"
const otherBreakDown = 0.02

import TopicKeys from '../../stubbed_data/topic_keys.json';
import _ from 'lodash';
import type {Preset, Filter, FilterLogic} from './filtertypes'
import type {VisibilityMap} from './Compare'

export function getVisibilityMap(lD, rD): VisibilityMap {
  console.log(lD)
    let visibilityMap = {}

    for (let key in lD) {
      if (key !== unknownId) { // Hide cats (16 is unknown)
        if ((lD[key] > otherBreakDown) || (lD[key] > otherBreakDown)) { // Make sure cats are above some percentage for both side
          visibilityMap[key] = "show"
        } else {
          visibilityMap[key] = "other"
        }
      } else {
        visibilityMap[key] = "hide"
      }
    }
    return visibilityMap;
}

export function generateDifferenceSentence(lO: Array<Filter>, rO: Array<Filter>, lVal: number, rVal: number, currentTopic: string): string {
    let sentence = '';
    const prc = Math.floor(calculatePercentDiff(lVal, rVal))

    // Math.sign isn't supported on Chromium fwiw
    if (prc === -Infinity) {
      sentence = `On average, ${createSentence(lO)} don't see any ${TopicKeys[currentTopic]} ads, as opposed to ${createSentence(rO)}.`
    } else if (prc === 100) {
      sentence = `On average, ${createSentence(rO)} don't see any ${TopicKeys[currentTopic]} ads, as opposed to ${createSentence(lO)}.`
    } else if (prc < 0) {
      sentence = `On average, ${createSentence(lO)} see ${Math.abs(prc)}% less ${TopicKeys[currentTopic]} ads than ${createSentence(rO)}.`;
    } else if (prc > 0) {
      sentence = `On average, ${createSentence(lO)} see ${prc}% more ${TopicKeys[currentTopic]} ads than ${createSentence(rO)}.`;
    } else if (prc === 0) {
      sentence = `${createSentence(lO)} and ${createSentence(rO)} see the same amount of ${TopicKeys[currentTopic]} ads.`;
    }

    return sentence;
}

export function createSentence(options: Array<Filter>): string {
  let sentence = 'Floodwatch users'; 
  
  if (options[0] == undefined) {
    sentence = 'All ' + sentence;
    return sentence;
  }

  if (options[0].name === 'data') {
    return 'You';
  }

  sentence += ' who are '

  _.forEach(options, function(opt: Filter, index: number) {
    if (opt.choices.length == 0) return;

    let logic = ''
    let choices = ''

    let wrappedChoices = opt.choices;

    if (opt.name == 'age') {
      wrappedChoices = wrappedChoices.map(c => `${c} years old`);
    }

    if (opt.name == 'country') {
      wrappedChoices = wrappedChoices.map(c => `currently living in ${c}`);
    }

    if (opt.logic === 'nor') {
      logic = 'Non-';
      choices = wrappedChoices.join(' and Non-')
      choices = logic + choices
    } else {
      choices = wrappedChoices.join(' ' + opt.logic + ' ')
    }

    sentence = sentence + ((index > 0) ? ", and " : " ") + choices;
  })

  return sentence
}

function calculatePercentDiff(a: number, b: number): number {
  const abs = (a-b)
  const denom = Math.abs(b);
  const prc = (abs/denom)*100
  return prc
}

