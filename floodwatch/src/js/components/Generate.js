import d3 from 'd3';
// import _ from 'lodash';
import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Chart } from './Chart';
import {render} from 'react-dom';
import url from 'url';

import {getVisibilityMap, generateDifferenceSentence, createSentence} from './comparisontools';
import type {VisibilityMap} from './Compare'


export class Generate extends Component {
  render() {
    let curData;
    if (url.parse(window.location.href, true).query.data) {
        curData = JSON.parse(url.parse(window.location.href, true).query.data);
    }

    let visibilityMap = getVisibilityMap(curData.dataA, curData.dataB)
    const lVal = curData.curTopic ? curData.dataA[curData.curTopic] : 0;
    const rVal = curData.curTopic ? curData.dataB[curData.curTopic] : 0;

    const lSentence = createSentence(curData.filterA);
    const rSentence = createSentence(curData.filterB);

    const sentence = generateDifferenceSentence(curData.filterA, curData.filterB, lVal, rVal, curData.curTopic)

    return (
      <Row className="main generate">
        <Col xs={12}>
        <Row className="chart-container">
          <Col sm={5} smOffset={1} xs={10} xsOffset={1} style={{ padding:0 }}>
            <Chart
              data={curData.dataA}
              visibilityMap={visibilityMap}
              currentTopic={curData.curTopic}
              side={"left"}
              sentence={lSentence}
              mouseEnterHandler={()=>{}}
              mouseLeaveHandler={()=>{}}
              />
          </Col>
          <Col sm={5} smOffset={0} xs={10} xsOffset={1} style={{ padding:0 }}>
            <Chart
              data={curData.dataB}
              visibilityMap={visibilityMap}
              currentTopic={curData.curTopic}
              side={"right"}
              sentence={rSentence}
              mouseEnterHandler={()=>{}}
              mouseLeaveHandler={()=>{}}
              />
          </Col>
        </Row>
        <Row>
          <Col xs={10} xsOffset={1} style={{ padding:0 }}>
            <Row>
              <Col md={8} mdOffset={2}>
                <h3 className="chart-sentence">{sentence}</h3>
              </Col>
            </Row>
          </Col>
        </Row>
        </Col>
      </Row>
    )
  }
}
