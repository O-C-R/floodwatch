// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import url from 'url';

import ChartContainer from '../components/ChartContainer';

import type {
  FilterResponse,
  GalleryImageData,
  FilterRequestItem,
} from '../api/types';
import type { VisibilityMap } from '../common/filtertypes';

import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
  decodeFilterRequestItem,
} from '../common/comparisontools';

type StateType = {
  dataA: ?FilterResponse,
  dataB: ?FilterResponse,
  filterA: ?FilterRequestItem,
  filterB: ?FilterRequestItem,
  curTopic: ?string,
  visibilityMap: VisibilityMap,
  lSentence: string,
  rSentence: string,
  sentence: string,
};

function initialState(): StateType {
  let curData: GalleryImageData;

  const location = url.parse(window.location.href, true);
  if (location.query && location.query.data) {
    const parsed: GalleryImageData = JSON.parse(location.query.data);
    curData = parsed;
  } else {
    throw new Error('Bad data!');
  }

  const {
    data_a: dataA,
    data_b: dataB,
    cur_topic: curTopic,
    filter_a: filterA,
    filter_b: filterB,
  } = curData;

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
    dataA,
    dataB,
    filterA,
    filterB,
    curTopic,
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
    const {
      dataA,
      dataB,
      filterA,
      filterB,
      curTopic,
      visibilityMap,
      lSentence,
      rSentence,
      sentence,
    } = this.state;

    return (
      <Row className="main generate container-fluid">
        <Col xs={12}>
          {dataA &&
            dataB &&
            <ChartContainer
              currentTopic={curTopic}
              leftPersonal={filterA ? filterA.personal : false}
              rightPersonal={filterB ? filterB.personal : false}
              leftSentence={lSentence}
              rightSentence={rSentence}
              leftData={dataA}
              rightData={dataB}
              visibilityMap={visibilityMap} />}

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
