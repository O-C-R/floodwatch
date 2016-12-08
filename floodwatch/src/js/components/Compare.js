// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {FilterParent} from './FilterParent';
import {ComparisonModal} from './ComparisonModal';
import Filters from '../../stubbed_data/filter_response.json';
import {FWApiClient} from '../api/api';
import TopicKeys from '../../stubbed_data/topic_keys.json';
import type {UnstackedData} from './FilterParent';
import d3 from 'd3';
import _ from 'lodash';

// import '../../Compare.css';

export function createSentence(options: Object): string {
  let sentence = 'Floodwatch users';
  if (options.length == 0) {
    sentence = 'All ' + sentence;
    return sentence
  }

  if (options[0].name == 'data') {
    return 'You'
  }

  options.map((opt: Object): void => {
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

type FilterOptionsType = {
  name: string,
  filters: Array<FilterType>
};

type FilterType = {
  name: string,
  choices: Array<string>,
  logic: string
};

type StateType = {
  leftOptions: FilterOptionsType,
  rightOptions: FilterOptionsType,
  leftData: UnstackedData,
  rightData: UnstackedData,
  currentTopic: string,
  modalVisible: boolean
};

function CompareContainerInitialState(): Object {
  return {
    leftOptions: Filters.presets[0].filters,
    rightOptions: Filters.presets[1].filters,
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

  async componentDidMount(): any {
    const AdBreakdown = await FWApiClient.get().getFilteredAdCounts({ filterA: {}, filterB: {} })
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

  changeCategoriesCustom(side, mouse, info, event) {
    var curInfo;
    console.log(side, mouse, info, event)

    if (side == "left") {
      curInfo = _.cloneDeep(this.state.leftOptions)
    } else if (side == "right") {
      curInfo = _.cloneDeep(this.state.rightOptions)
    }

    const checked = event.target.checked
    let found = false;

    curInfo.map((cur, i) => {
      console.log(cur.name)
      console.log(info.name)
      if (cur.name == info.name)  {
        if (checked == true) {
          curInfo[i].choices = _.union(cur.choices, [info.choices])
          curInfo[i].logic = info.logic
          found = true;
        } else {
           _.remove(curInfo[i].choices, function(n) {
              if (n == info.choices) { return true }
              return false
            })
            found = true;
        }
      }
    })

    if (found == false) {
      info.choices = [info.choices]
      curInfo.push(info)
    }

    // fixing something stupid
    curInfo.map((info, i) => {
      if (info.name == "data") {
        curInfo.splice(i, 1)
      }
    })

    if (side == 'left') {
      this.setState({
        leftOptions: curInfo
      })
    } else if (side == 'right') {
      this.setState({
        rightOptions: curInfo
      })
    }
  }

  changeCategoriesPreset(side, info) {
    if (side == 'left') {
      this.setState({
        leftOptions: info.filters
      })      
    } else if (side == 'right') {
      this.setState({
        rightOptions: info.filters
      })
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
      sentence = `On average, ${createSentence(this.state.leftOptions)} don't see any ${TopicKeys[this.state.currentTopic]} ads, as opposed to ${createSentence(this.state.rightOptions)}`
    } else if (prc == 100) {
      sentence = `On average, ${createSentence(this.state.rightOptions)} don't see any ${TopicKeys[this.state.currentTopic]} ads, as opposed to ${createSentence(this.state.leftOptions)}`
    } else if (prc < 0) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} see ${prc}% less ${TopicKeys[this.state.currentTopic]} ads than ${createSentence(this.state.rightOptions)}`;
    } else if (prc > 0) {
      sentence = `On average, ${createSentence(this.state.leftOptions)} see ${prc}% more ${TopicKeys[this.state.currentTopic]} ads than ${createSentence(this.state.rightOptions)}`;
    } else if (prc == 0) {
      sentence = `${createSentence(this.state.leftOptions)} and ${createSentence(this.state.rightOptions)} see the same amount of ${TopicKeys[this.state.currentTopic]} ads`;
    }

    return sentence;
  }

  toggleComparisonModal(): void {
    const curState = this.state.modalVisible;
    this.setState({
      modalVisible: !curState
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
            <p className="centered"><h3>{sentence}.</h3></p>
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
          userData={this.state.userData}/>
      </Row>
    )
  }
}
