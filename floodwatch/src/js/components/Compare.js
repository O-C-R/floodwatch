// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import d3 from 'd3';
import _ from 'lodash';

//import {FilterParent} from './FilterParent';
import {Chart} from './Chart';
import {ComparisonModal} from './ComparisonModal';
import {FWApiClient} from '../api/api';

import type {Preset, Filter, FilterLogic} from './filtertypes'
import type {PersonResponse, FilterRequestItem} from '../api/types';

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import Filters from '../../stubbed_data/filter_response.json';
import TopicKeys from '../../stubbed_data/topic_keys.json';

export type VisibilityMap = {
  [catId : string]: "show" | "hide" | "other"
}

export type UnstackedData = {
  [key: string]: number
};

const unknownId = "16"
const otherBreackDown = 0.02

export function createSentence(options: Array<Filter>): string {
  let sentence = 'Floodwatch users';
  if (options.length === 0) {
    sentence = 'All ' + sentence;
    return sentence
  }

  if (options[0].name === 'data') {
    return 'You'
  }

  _.forEach(options, function(opt: Filter) {
    let logic = ''
    let choices = ''

    let wrappedChoices = opt.choices;
    if (opt.name == 'age') {
      wrappedChoices = wrappedChoices.map(c => `${c} year old`);
    }

    if (opt.logic === 'NOR') {
      logic = ' Non-';
      choices = wrappedChoices.join(', non-')
    } else {
      choices = wrappedChoices.join(', ')
    }
    sentence = logic + choices + ' ' + sentence
  })

  return sentence
}

export class Compare extends Component {
  render() {
    return (
      <Row>
        <Col xs={12}>
        <CompareContainer/>
        </Col>
      </Row>
    )
  }
}

type StateType = {
  leftOptions: Array<Filter>,
  rightOptions: Array<Filter>,
  visibilityMap: VisibilityMap,
  leftData: UnstackedData,
  rightData: UnstackedData,
  currentTopic: ?string,
  modalVisible: boolean,
  userData: PersonResponse
};

function CompareContainerInitialState(): Object {
  return {
    leftOptions: Filters.presets[0].filters,
    rightOptions: Filters.presets[1].filters,
    leftData: {},
    rightData: {},
    visibilityMap: {},
    currentTopic: null,
    modalVisible: false
  }
}

export class CompareContainer extends Component {
  state: StateType;

  constructor(): void {
    super();
    this.state = CompareContainerInitialState()
  }

  componentDidMount() {
    const init = async () => {
      const filterA = this.generateFilterRequestItem(this.state.leftOptions)
      const filterB = this.generateFilterRequestItem(this.state.rightOptions)
      const cleanedFilterA = this.cleanFilterRequest(filterA)
      const cleanedFilterB = this.cleanFilterRequest(filterB)

      const AdBreakdown = await FWApiClient.get().getFilteredAdCounts({ filterA: cleanedFilterA, filterB: cleanedFilterB })

      let visibilityMap = {}
      let leftData = AdBreakdown.filterA.categories
      let rightData = AdBreakdown.filterB.categories

      for (let key in leftData) {
        if (key !== unknownId) { // Hide cats (16 is unknown)
          if ((leftData[key] > otherBreackDown) || (leftData[key] > otherBreackDown)) { // Make sure cats are above some percentage for both side
            visibilityMap[key] = "show"
          } else {
            visibilityMap[key] = "other"
          }
        } else {
          visibilityMap[key] = "hide"
        }
      }

      const FilterATopic = d3.entries(AdBreakdown.filterA.categories).sort(function(a, b) {
        return d3.descending(a.value, b.value);
      })[0]

      const UserData = await FWApiClient.get().getCurrentPerson()

      this.setState({
        leftData,
        rightData,
        visibilityMap,
        currentTopic: null,
        userData: UserData
      })
    }
    init();
  }

  mouseEnterHandler(newTopic: string): void {
    if (newTopic !== "Other") {
      this.setState({
        currentTopic: newTopic
      })
    }
  }

  mouseLeaveHandler() {
    this.setState({
      currentTopic: null
    })
  }

  updateSearchLogic(side: string, logic: FilterLogic, filtername: string) {
    let curInfo = []
    if (side === 'left') {
      curInfo = _.cloneDeep(this.state.leftOptions)
    } else if (side === 'right') {
      curInfo = _.cloneDeep(this.state.rightOptions)
    }

    let found = false;
    for (let i = 0; i < curInfo.length; i++) {
      if (curInfo[i].name === filtername)  {
        curInfo[i].logic = logic
        found = true;
      }
    }
    if (found === false) {
      curInfo.push({name: filtername, logic: logic, choices: []})
    }

    if (side === 'left') {
      this.updateData(curInfo, this.state.rightOptions)
    } else if (side === 'right') {
      this.updateData(this.state.leftOptions, curInfo)
    }
  }

  generateFilterRequestItem(filter: Array<Filter>): FilterRequestItem {
    const isPersonal = _.find(filter, f => f.name === 'data' && f.choices[0] === 'You');
    if (isPersonal) {
      return { personal: true };
    }

    const obj: FilterRequestItem = {
      demographics: []
    };

    for (const f of filter) {
      if (f.name === 'age') {
        if (f.choices[0]) {
          const min = parseInt(f.choices[0].split('-')[0], 10)
          const max = parseInt(f.choices[0].split('-')[1], 10)
          obj.age = {
            min: min,
            max: max
          }
        }
      } else if (f.name === 'country') {
        // TK
      } else {
        const arr = [];
        const myCategoryId = DemographicKeys.category_to_id[f.name];
        for (const choice of f.choices) {
          for (const key of DemographicKeys.demographic_keys) {
            if (key.name === choice && key.category_id === myCategoryId) {
              arr.push(key.id)
            }
          }
        }
        if (obj.demographics) {
          obj.demographics.push({ operator: f.logic, values: arr });
        }
      }
    }

    return obj
  }

  cleanFilterRequest(filter: FilterRequestItem): FilterRequestItem {
    if (!filter.demographics) {
      return filter
    }

    if (filter.demographics.length === 0) {
      return filter
    }

    for (let i = filter.demographics.length - 1; i >= 0; i--) {
      if (filter.demographics[i].values.length === 0) {
        filter.demographics.splice(i, 1)
      }
    }
    return filter
  }

  changeCategoriesCustom(side: string, info: Filter, checked: boolean): void {
    let curInfo = [];
    if (side === 'left') {
      curInfo = _.cloneDeep(this.state.leftOptions)
    } else if (side === 'right') {
      curInfo = _.cloneDeep(this.state.rightOptions)
    }

    let found = false;

    for (let i = 0; i < curInfo.length; i++) {
      if (curInfo[i].name === info.name)  {
        if (checked) {
          if (info.name === 'age') { // special case for age
            curInfo[i].choices = info.choices // treat it like a radio button: only 1 choice allowed
          } else {
            curInfo[i].choices = _.union(curInfo[i].choices, info.choices)
            curInfo[i].logic = info.logic
          }
        } else {
          curInfo[i].choices = _.filter(curInfo[i].choices, function(n: string) {
            return n !== info.choices[0]
          })
        }

        found = true;
      }
    }

    if (!found && checked) {
      curInfo.push(info)
    }

    // fixing something stupid for when the filter is You
    for (let [index: number, info: Filter] of curInfo.entries()) {
      if (info.name === 'data') {
        curInfo.splice(index, 1)
      } else if (info.choices.length === 0) { // this feels like it should be handled by the above _.filter but it's not...
        curInfo.splice(index, 1)
      }
    }

    if (side === 'left') {
      this.updateData(curInfo, this.state.rightOptions)
    } else if (side === 'right') {
      this.updateData(this.state.leftOptions, curInfo)
    }
  }

  changeCategoriesPreset(side: string, info: Preset): void {
    if (side === 'left') {
      this.updateData(info.filters, this.state.rightOptions)
    } else if (side === 'right') {
      this.updateData(this.state.leftOptions, info.filters)
    }
  }

  calculatePercentDiff(a: number, b: number): number {
    const abs = (a-b)
    const denom = (Math.abs(a))
    const prc = (abs/denom)*100
    return prc
  }

  generateDifferenceSentence(lVal: number, rVal: number): string {
    let sentence = '';
    const prc = Math.floor(this.calculatePercentDiff(lVal, rVal))

    // Math.sign isn't supported on Chromium fwiw
    if (prc === -Infinity) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} don't see any ${TopicKeys[this.state.currentTopic]} ads, as opposed to ${createSentence(this.state.rightOptions)}.`
    } else if (prc === 100) {
      sentence = `On average, ${createSentence(this.state.rightOptions)} don't see any ${TopicKeys[this.state.currentTopic]} ads, as opposed to ${createSentence(this.state.leftOptions)}.`
    } else if (prc < 0) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} see ${Math.abs(prc)}% less ${TopicKeys[this.state.currentTopic]} ads than ${createSentence(this.state.rightOptions)}.`;
    } else if (prc > 0) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} see ${prc}% more ${TopicKeys[this.state.currentTopic]} ads than ${createSentence(this.state.rightOptions)}.`;
    } else if (prc === 0) {
      sentence = `${createSentence(this.state.leftOptions)} and ${createSentence(this.state.rightOptions)} see the same amount of ${TopicKeys[this.state.currentTopic]} ads.`;
    }

    return sentence;
  }

  toggleComparisonModal(): void {
    const curState = this.state.modalVisible;
    this.setState({
      modalVisible: !curState
    })
  }

  async updateData(left: Array<Filter>, right: Array<Filter>) {
    const filterA = this.generateFilterRequestItem(left)
    const filterB = this.generateFilterRequestItem(right)

    const cleanedFilterA = this.cleanFilterRequest(filterA)
    const cleanedFilterB = this.cleanFilterRequest(filterB)

    const AdBreakdown = await FWApiClient.get().getFilteredAdCounts({ filterA: cleanedFilterA, filterB: cleanedFilterB })

    this.setState({
      leftData: (AdBreakdown.filterA.totalCount > 0) ? AdBreakdown.filterA.categories : {},
      rightData: (AdBreakdown.filterB.totalCount > 0) ? AdBreakdown.filterB.categories : {},
      leftOptions: left,
      rightOptions: right
    })
  }

  render() {
    const lVal = this.state.currentTopic ? this.state.leftData[this.state.currentTopic] : 0;
    const rVal = this.state.currentTopic ? this.state.rightData[this.state.currentTopic] : 0;
    const sentence = this.generateDifferenceSentence(lVal, rVal)

    const lSentence = createSentence(this.state.leftOptions);
    const rSentence = createSentence(this.state.rightOptions);

    return (
      <div className="main compare">
        <Row className="chart-container">
          <Col sm={5} smOffset={1} xs={10} xsOffset={1} style={{ padding:0 }}>
            <Chart
              side="left"
              data={this.state.leftData}
              sentence={lSentence}
              visibilityMap={this.state.visibilityMap}
              currentTopic={this.state.currentTopic}
              mouseEnterHandler={this.mouseEnterHandler.bind(this)}
              mouseLeaveHandler={this.mouseLeaveHandler.bind(this)}/>
          </Col>
          <Col sm={5} smOffset={0} xs={10} xsOffset={1} style={{ padding:0 }}>
            <Chart
              side="right"
              data={this.state.rightData}
              sentence={rSentence}
              visibilityMap={this.state.visibilityMap}
              currentTopic={this.state.currentTopic}
              mouseEnterHandler={this.mouseEnterHandler.bind(this)}
              mouseLeaveHandler={this.mouseLeaveHandler.bind(this)}/>
          </Col>
        </Row>

        <Row>
          <Col xs={10} xsOffset={1} md={8} mdOffset={2}>
            <h3 className="chart-sentence">{sentence}</h3>

            <div className="chart-actions">
              <button className="chart-actions_toggleCompare btn btn-primary button" onClick={this.toggleComparisonModal.bind(this)}>Change comparison</button>
            </div>
          </Col>
        </Row>

        <ComparisonModal
          visible={this.state.modalVisible}
          toggleModal={this.toggleComparisonModal.bind(this)}
          currentSelectionLeft={this.state.leftOptions}
          currentSelectionRight={this.state.rightOptions}
          changeCategoriesPreset={this.changeCategoriesPreset.bind(this)}
          changeCategoriesCustom={this.changeCategoriesCustom.bind(this)}
          updateSearchLogic={this.updateSearchLogic.bind(this)}
          userData={this.state.userData}/>
      </div>
    )
  }
}
