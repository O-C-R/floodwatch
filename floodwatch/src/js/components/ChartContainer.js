// @flow

import React from 'react';
import { Col } from 'react-bootstrap';

import Chart from './Chart';

import type { FilterResponse } from '../api/types';
import type { VisibilityMap } from '../common/types';

type Props = {
  leftData: ?FilterResponse,
  rightData: ?FilterResponse,
  leftPersonal?: boolean,
  rightPersonal?: boolean,
  leftSentence: string,
  rightSentence: string,
  visibilityMap: VisibilityMap,
  currentCategoryId: ?number,
  mouseEnterHandler?: (newTopicId: number) => void,
  mouseClickHandler?: (newTopicId: number) => void,
  mouseLeaveHandler?: () => void,
};

const ChartContainer = (props: $Exact<Props>) => {
  const {
    leftData,
    rightData,
    leftPersonal,
    rightPersonal,
    leftSentence,
    rightSentence,
    visibilityMap,
    currentCategoryId,
    mouseEnterHandler,
    mouseClickHandler,
    mouseLeaveHandler,
  } = props;

  return (
    <div className="chart-container">
      <Col sm={5} smOffset={1} xs={10} xsOffset={1} style={{ padding: 0 }}>
        <Chart
          side="left"
          data={leftData}
          sentence={leftSentence}
          visibilityMap={visibilityMap}
          currentCategoryId={currentCategoryId}
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
          currentCategoryId={currentCategoryId}
          isPersonal={rightPersonal || false}
          mouseEnterHandler={mouseEnterHandler}
          mouseClickHandler={mouseClickHandler}
          mouseLeaveHandler={mouseLeaveHandler} />
      </Col>
    </div>
  );
};

export default ChartContainer;
