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
import type { VisibilityMap } from '../common/types';

import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
} from '../common/comparisontools';

type State = {
  dataA: ?FilterResponse,
  dataB: ?FilterResponse,
  filterA: ?FilterRequestItem,
  filterB: ?FilterRequestItem,
  currentCategoryId: ?number,
  visibilityMap: VisibilityMap,
  lSentence: string,
  rSentence: string,
  sentence: ?string,
};

function initialState(): State {
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
    cur_category_id: currentCategoryId,
    filter_a: filterA,
    filter_b: filterB,
  } = curData;

  const visibilityMap = getVisibilityMap(dataA, dataB);
  const lVal = currentCategoryId ? dataA.categories[currentCategoryId] : 0;
  const rVal = currentCategoryId ? dataB.categories[currentCategoryId] : 0;

  const lSentence = createSentence(filterA);
  const rSentence = createSentence(filterB);

  let sentence: ?string;
  if (currentCategoryId !== undefined && currentCategoryId !== null) {
    sentence = generateDifferenceSentence(
      filterA,
      filterB,
      lVal,
      rVal,
      currentCategoryId,
    );
  }

  return {
    dataA,
    dataB,
    filterA,
    filterB,
    currentCategoryId,
    visibilityMap,
    lSentence,
    rSentence,
    sentence,
  };
}

export default class Generate extends Component {
  state: State;

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
      currentCategoryId,
      visibilityMap,
      lSentence,
      rSentence,
    } = this.state;

    return (
      <Row className="main generate container-fluid">
        <Col xs={12}>
          {dataA &&
            dataB &&
            <ChartContainer
              currentCategoryId={currentCategoryId}
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
