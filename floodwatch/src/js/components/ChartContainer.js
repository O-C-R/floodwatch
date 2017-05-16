// @flow

import React, { Component } from 'react';
import { Col } from 'react-bootstrap';

import { Chart } from './Chart';

import type {
  PersonResponse,
  FilterResponse,
  FilterRequestItem,
} from '../api/types';
import type { VisibilityMap } from './Compare.js';

type Props = {
  leftData: ?FilterResponse,
  rightData: ?FilterResponse,
  leftPersonal?: boolean,
  rightPersonal?: boolean,
  leftSentence: string,
  rightSentence: string,
  visibilityMap: VisibilityMap,
  currentTopic: ?string,
  noOutline?: boolean,
  mouseEnterHandler?: (newTopic: string) => void,
  mouseClickHandler?: (newTopic: string) => void,
  mouseLeaveHandler?: () => void,
};

export default class ChartContainer extends Component {
  props: $Exact<Props>;

  render() {
    const {
      leftData,
      rightData,
      leftPersonal,
      rightPersonal,
      leftSentence,
      rightSentence,
      visibilityMap,
      currentTopic,
      noOutline,
      mouseEnterHandler,
      mouseClickHandler,
      mouseLeaveHandler,
    } = this.props;

    return (
      <div className="chart-container">
        <Col sm={5} smOffset={1} xs={10} xsOffset={1} style={{ padding: 0 }}>
          <Chart
            side="left"
            data={leftData}
            sentence={leftSentence}
            visibilityMap={visibilityMap}
            currentTopic={currentTopic}
            noOutline={noOutline}
            isPersonal={leftPersonal || false}
            mouseEnterHandler={mouseEnterHandler}
            mouseClickHandler={mouseClickHandler}
            mouseLeaveHandler={mouseLeaveHandler} />
        </Col>
        <Col sm={5} smOffset={0} xs={10} xsOffset={1} style={{ padding: 0 }}>
          <Chart
            side="right"
            data={rightData}
            sentence={rightSentence}
            visibilityMap={visibilityMap}
            currentTopic={currentTopic}
            noOutline={noOutline}
            isPersonal={rightPersonal || false}
            mouseEnterHandler={mouseEnterHandler}
            mouseClickHandler={mouseClickHandler}
            mouseLeaveHandler={mouseLeaveHandler} />
        </Col>
      </div>
    );
  }
}
