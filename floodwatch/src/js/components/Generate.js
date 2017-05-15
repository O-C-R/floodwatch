// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';

import url from 'url';

import type { FilterResponse, FilterRequestItem } from '../api/types';
import type { VisibilityMap } from './Compare';

import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
  decodeFilterRequestItem,
} from './comparisontools';
import { Chart } from './Chart';

type StateType = {
  filterA: FilterRequestItem,
  filterB: FilterRequestItem,
  dataA: FilterResponse,
  dataB: FilterResponse,
  curTopic: ?string,
  visibilityMap: VisibilityMap,
  lSentence: string,
  rSentence: string,
  sentence: string,
};

function initialState(): StateType {
  let curData = null;
  const location = url.parse(window.location.href, true);
  if (location.query && location.query.data) {
    curData = JSON.parse(location.query.data);
  } else {
    curData = {};
  }

  const { dataA, dataB, curTopic, filterA, filterB } = curData;

  const visibilityMap = getVisibilityMap(dataA, dataB);
  const lVal = curTopic ? dataA.categories[curTopic] : 0;
  const rVal = curTopic ? dataB.categories[curTopic] : 0;

  const decodedA = decodeFilterRequestItem(filterA);
  const decodedB = decodeFilterRequestItem(filterB);

  const lSentence = createSentence(decodedA);
  const rSentence = createSentence(decodedB);

  const sentence = generateDifferenceSentence(
    decodedA,
    decodedB,
    lVal,
    rVal,
    curTopic,
  );

  return {
    dataA: dataA || { categories: {}, totalCount: 0 },
    dataB: dataB || { categories: {}, totalCount: 0 },
    filterA: filterA || {},
    filterB: filterB || {},
    curTopic: curTopic || null,
    visibilityMap,
    lSentence,
    rSentence,
    sentence,
  };
}

export default class Generate extends Component {
  state: StateType;

  constructor(props: any) {
    super(props);
    this.state = initialState();
  }

  render() {
    return (
      <Row className="main generate container-fluid">
        <Col xs={12}>
          <Row className="chart-container">
            <Col
              sm={5}
              smOffset={1}
              xs={10}
              xsOffset={1}
              style={{ padding: 0 }}>
              <Chart
                data={this.state.dataA}
                visibilityMap={this.state.visibilityMap}
                currentTopic={this.state.curTopic}
                side={'left'}
                sentence={this.state.lSentence}
                mouseEnterHandler={() => {}}
                mouseClickHandler={() => {}}
                mouseLeaveHandler={() => {}} />
            </Col>
            <Col
              sm={5}
              smOffset={0}
              xs={10}
              xsOffset={1}
              style={{ padding: 0 }}>
              <Chart
                data={this.state.dataB}
                visibilityMap={this.state.visibilityMap}
                currentTopic={this.state.curTopic}
                side={'right'}
                sentence={this.state.rSentence}
                mouseEnterHandler={() => {}}
                mouseClickHandler={() => {}}
                mouseLeaveHandler={() => {}} />
            </Col>
          </Row>
          <Row>
            <Col xs={10} xsOffset={1} style={{ padding: 0 }}>
              <Row>
                <Col md={8} mdOffset={2}>
                  <h3 className="chart-sentence">{this.state.sentence}</h3>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}
