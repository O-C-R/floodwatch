// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import d3 from 'd3';
import _ from 'lodash';

import {FilterParent} from './FilterParent';
import {ComparisonModal} from './ComparisonModal';
import {FWApiClient} from '../api/api';

import type {UnstackedData} from './FilterParent';
import type {PresetsAndFilters, Preset, Filter} from './filtertypes'
import type {PersonResponse, FilterRequest, FilterRequestItem} from '../api/types';

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import Filters from '../../stubbed_data/filter_response.json';
import TopicKeys from '../../stubbed_data/topic_keys.json';

// import '../../Compare.css';


export function createSentence(options: Array<Filter>): string {
  let sentence = 'Floodwatch users';
  if (options.length == 0) {
    sentence = 'All ' + sentence;
    return sentence
  }

  if (options[0].name == 'data') {
    return 'You'
  }

  _.forEach(options, function(opt: Filter) {
    let logic = ''
    let choices = ''
    if (opt.logic == 'NOR') { 
      logic = ' Non-';
      choices = opt.choices.join(', non-')
    } else {
      choices = opt.choices.join(', ')  
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
  leftData: UnstackedData,
  rightData: UnstackedData,
  currentTopic: string,
  modalVisible: boolean,
  userData: PersonResponse
};

function CompareContainerInitialState(): Object {
  return {
    leftOptions: Filters.presets[1].filters,
    rightOptions: Filters.presets[3].filters,
    leftData: {},
    rightData: {},
    currentTopic: '1',
    modalVisible: false
  }
}

export class CompareContainer extends Component {
  state: StateType;

  constructor(): void {
    super();
    this.state = CompareContainerInitialState()
  }

  async componentDidMount() {
    const filterA = this.generateFilterRequestItem(this.state.leftOptions)
    const filterB = this.generateFilterRequestItem(this.state.rightOptions)

    const cleanedFilterA = this.cleanFilterRequest(filterA)
    const cleanedFilterB = this.cleanFilterRequest(filterB)

    const AdBreakdown = await FWApiClient.get().getFilteredAdCounts({ filterA: cleanedFilterA, filterB: cleanedFilterB })
    const FilterATopic = d3.entries(AdBreakdown.filterA.categories).sort(function(a, b) {
      return d3.descending(a.value, b.value);
    })[0]

    const UserData = await FWApiClient.get().getCurrentPerson()

    this.setState({
      leftData: AdBreakdown.filterA.categories,
      rightData: AdBreakdown.filterB.categories,
      currentTopic: FilterATopic.key,
      userData: UserData
    })
  }

  updateMouseOver(newTopic: string): void {
    this.setState({
      currentTopic: newTopic
    })
  }

  updateSearchLogic(side: string, logic: string, filtername: string) {
    let curInfo = []
    if (side == 'left') {
      curInfo = _.cloneDeep(this.state.leftOptions)
    } else if (side == 'right') {
      curInfo = _.cloneDeep(this.state.rightOptions)
    }

    let found = false;
    for (let i = 0; i < curInfo.length; i++) {
      if (curInfo[i].name == filtername)  {
        curInfo[i].logic = logic
        found = true;
      }
    }
    if (found == false) {
      curInfo.push({name: filtername, logic: logic, choices: []})
    }

    if (side == 'left') {
      this.updateData(curInfo, this.state.rightOptions)
    } else if (side == 'right') {
      this.updateData(this.state.leftOptions, curInfo)
    }
  }

  generateFilterRequestItem(filter: Array<Filter>): FilterRequestItem {
    let obj = {
      demographics: [],
      age: {}
    };
    _.forEach(filter, (f: Filter) => {
      if (f.name != 'age' && f.name != 'country') {
        let arr = []
        _.forEach(f.choices, (choice) => {
          for (let key of DemographicKeys.demographic_keys) {
            if (key.name == choice) {
              arr.push(key.id)
            }
          }
        })
        obj.demographics.push({
          operator: f.logic.toLowerCase(),
          values: arr
        })
      }

      if (f.name == 'age') {
        if (f.choices[0]) {
          const min = parseInt(f.choices[0].split('-')[0])
          const max = parseInt(f.choices[0].split('-')[1])
          obj.age = {
            min: min,
            max: max
          }
        }
      }

      if (f.name == 'country') {
        // tk
      }
    })

    return obj
  }

  cleanFilterRequest(filter: FilterRequestItem): FilterRequestItem {
    if (!filter.demographics) {
      return filter
    }

    if (filter.demographics.length == 0) {
      return filter
    }

    for (let i = filter.demographics.length - 1; i >= 0; i--) {
      if (filter.demographics[i].values.length == 0) {
        filter.demographics.splice(i, 1)
      }
    }
    return filter

  }

  changeCategoriesCustom(side: string, info: Filter, checked: boolean): void {
    let curInfo = [];
    if (side == 'left') {
      curInfo = _.cloneDeep(this.state.leftOptions)
    } else if (side == 'right') {
      curInfo = _.cloneDeep(this.state.rightOptions)
    }

    let found = false;

    for (let i = 0; i < curInfo.length; i++) {
      if (curInfo[i].name == info.name)  {
          if (checked == true) {
            if (info.name == "age") { // special case for age
              curInfo[i].choices = info.choices // treat it like a radio button: only 1 choice allowed
            } else {
              curInfo[i].choices = _.union(curInfo[i].choices, info.choices)
              curInfo[i].logic = info.logic
            }
            found = true;
          } else {
            _.remove(curInfo[i].choices, function(n: string) {
              return n == info.choices[0]
            })
            found = true;
          }
      }
    }

    if (found == false) {
      curInfo.push(info)
    }

    // fixing something stupid for when the filter is You
    for (let [index: number, info: Filter] of curInfo.entries()) {
      if (info.name == 'data') {
        curInfo.splice(index, 1)
      }
    }


    if (side == 'left') {
      this.updateData(curInfo, this.state.rightOptions)
    } else if (side == 'right') {
      this.updateData(this.state.leftOptions, curInfo)
    }
  }

  changeCategoriesPreset(side: string, info: Preset): void {
    if (side == 'left') {
      this.updateData(info.filters, this.state.rightOptions)
    } else if (side == 'right') {
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
    if (prc == -Infinity) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} don't see any ${TopicKeys[this.state.currentTopic]} ads, as opposed to ${createSentence(this.state.rightOptions)}.`
    } else if (prc == 100) {
      sentence = `On average, ${createSentence(this.state.rightOptions)} don't see any ${TopicKeys[this.state.currentTopic]} ads, as opposed to ${createSentence(this.state.leftOptions)}.`
    } else if (prc < 0) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} see ${prc}% less ${TopicKeys[this.state.currentTopic]} ads than ${createSentence(this.state.rightOptions)}.`;
    } else if (prc > 0) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} see ${prc}% more ${TopicKeys[this.state.currentTopic]} ads than ${createSentence(this.state.rightOptions)}.`;
    } else if (prc == 0) {
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
    const lVal = this.state.leftData[this.state.currentTopic];
    const rVal = this.state.rightData[this.state.currentTopic];
    const sentence = this.generateDifferenceSentence(lVal, rVal)

    return (
      <Row className="main">
        <Col xs={12}>
          <Row>
            <Col xs={5} xsOffset={1}>
              <FilterParent 
                className="chart" 
                side="left" 
                data={this.state.leftData} 
                currentSelection={this.state.leftOptions} 
                currentTopic={this.state.currentTopic} 
                updateMouseOver={this.updateMouseOver.bind(this)}/>
            </Col>

            <Col xs={5}>
              <FilterParent 
                className="chart" 
                side="right" 
                data={this.state.rightData} 
                currentSelection={this.state.rightOptions} 
                currentTopic={this.state.currentTopic} 
                updateMouseOver={this.updateMouseOver.bind(this)}/>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
            <p className="centered"><h3>{sentence}</h3></p>
            </Col>
          </Row>
          <Row>
            <p className="centered">
              <button className="btn btn-default button">Share finding</button>
              <button className="btn btn-primary button" onClick={this.toggleComparisonModal.bind(this)}>Change comparison</button>
            </p>
          </Row>
        </Col>
        <ComparisonModal 
          visible={this.state.modalVisible} 
          toggleModal={this.toggleComparisonModal.bind(this)}
          currentSelectionLeft={this.state.leftOptions} 
          currentSelectionRight={this.state.rightOptions}
          changeCategoriesPreset={this.changeCategoriesPreset.bind(this)}
          changeCategoriesCustom={this.changeCategoriesCustom.bind(this)}
          updateSearchLogic={this.updateSearchLogic.bind(this)}
          userData={this.state.userData}/>
      </Row>
    )
  }
}
