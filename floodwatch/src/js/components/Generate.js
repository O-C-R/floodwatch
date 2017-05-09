//@flow

import type {Filter, FilterLogic} from './filtertypes'
import type {PersonResponse, FilterRequestItem} from '../api/types';
import type {VisibilityMap} from './Compare'

import {getVisibilityMap, generateDifferenceSentence, createSentence} from './comparisontools';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Chart } from './Chart';
import {render} from 'react-dom';
import url from 'url';
import _ from 'lodash';


type StateType = {
  filterA: any,
  filterB: any,
  dataA: any,
  dataB: any,
  curTopic: string,
  visibilityMap: VisibilityMap,
  lSentence: string,
  rSentence: string,
  sentence: string
}

function initialState(): StateType {
  let curData = null;
  if (url.parse(window.location.href, true).query.data) {
    curData = JSON.parse(url.parse(window.location.href, true).query.data);
  } else {
    curData = {}
  }

  let visibilityMap = getVisibilityMap(curData.dataA, curData.dataB)
  const lVal = curData.curTopic ? curData.dataA[curData.curTopic] : 0;
  const rVal = curData.curTopic ? curData.dataB[curData.curTopic] : 0;

  const lSentence = createSentence(decodeFilterRequestItem(curData.filterA));
  const rSentence = createSentence(decodeFilterRequestItem(curData.filterB));

  const sentence = generateDifferenceSentence(curData.filterA, curData.filterB, lVal, rVal, curData.curTopic)

  return {
    dataA: (curData.dataA) ? curData.dataA : {},
    dataB: (curData.dataB) ? curData.dataB : {},
    filterA: (curData.filterA) ? curData.filterA : {},
    filterB: (curData.filterB) ? curData.filterB : {},
    curTopic: (curData.curTopic) ? curData.curTopic : null,
    visibilityMap: visibilityMap,
    lSentence: lSentence,
    rSentence: rSentence,
    sentence: sentence
  }
}

export class Generate extends Component {
  state: StateType

  constructor(props: PropsType) {
    super(props);
    this.state = initialState()
  }

  render() {
    return (
      <Row className="main generate">
        <Col xs={12}>
        <Row className="chart-container">
          <Col sm={5} smOffset={1} xs={10} xsOffset={1} style={{ padding:0 }}>
            <Chart
              data={this.state.dataA}
              visibilityMap={this.state.visibilityMap}
              currentTopic={this.state.curTopic}
              side={'left'}
              sentence={this.state.lSentence}
              mouseEnterHandler={()=>{}}
              mouseClickHandler={()=>{}}
              mouseLeaveHandler={()=>{}}
              />
          </Col>
          <Col sm={5} smOffset={0} xs={10} xsOffset={1} style={{ padding:0 }}>
            <Chart
              data={this.state.dataB}
              visibilityMap={this.state.visibilityMap}
              currentTopic={this.state.curTopic}
              side={'right'}
              sentence={this.state.rSentence}
              mouseEnterHandler={()=>{}}
              mouseClickHandler={()=>{}}
              mouseLeaveHandler={()=>{}}
              />
          </Col>
        </Row>
        <Row>
          <Col xs={10} xsOffset={1} style={{ padding:0 }}>
            <Row>
              <Col md={8} mdOffset={2}>
                <h3 className="chart-sentence">{this.state.sentence}</h3>
              </Col>
            </Row>
          </Col>
        </Row>
        </Col>
      </Row>
    )
  }
}

function decodeFilterRequestItem(filter: FilterRequestItem): Array<Filter> {
  const keys = _.keys(filter)
  const isPersonal = (_.indexOf(keys, 'personal') > -1);

  if (isPersonal) {
    return [{
      name: 'data',
      logic: 'or',
      choices: ['You']
    }]
  }

  let optionsArr = []

  for (const k of keys) {
    if (k == 'age') {
      const str = filter[k].min + '-' + filter[k].max;
      optionsArr.push({
        name: 'age',
        logic: 'or',
        choices: [str]
      })
    } 
    else if (k == 'location') {
      let countries = filter[k].countryCodes;
      optionsArr.push({
        name: 'country',
        logic: 'or',
        choices: countries
      })
    } 
    else if (k == 'demographics') {
      if (filter[k].length > 0) {
        filter[k].forEach((o) => {
          let newObj = {};

          newObj.logic = o.operator;
          newObj.choices = [];
          o.values.forEach((v) => {
            let choice = _.find(DemographicKeys.demographic_keys, (dk) => {
              return dk.id == v
            })
            newObj.choices.push(choice.name);
          })

          //get category of first elem to check what name of category is
          let sampleElem = _.find(DemographicKeys.demographic_keys, (dk) => {
            return dk.id == o.values[0]
          })
          let category = _.findKey(DemographicKeys.category_to_id, (ci) => {
            return (ci == sampleElem.category_id)
          })

          newObj.name = 'category'

          optionsArr.push(newObj)
        })

      }
    }

  }
  return optionsArr
}
