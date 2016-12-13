// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {GraphParent} from './GraphParent';
import _ from 'lodash';
import d3 from 'd3'

type StateType = {
  dataStackLayout: (data: Array<Array<StackedData>>) => Array<Array<StackedData>>
};

function initialState(): Object {
  return {
    dataStackLayout: d3.layout.stack()
  }
}

type PropsType = {
  side: string,
  currentTopic: string,
  updateMouseOver: (topic: string) => void,
  data: UnstackedData
};

export type StackedData = {
  x: number,
  y: number,
  name: string
};

export type UnstackedData = {
  [key: string]: number
};

export class FilterParent extends Component {
  props: PropsType;
  state: StateType;

  constructor(props: PropsType): void {
    super(props);
    this.state = initialState()
  }

  stackData(data: Object): Array<Array<StackedData>> {
    const topics = Object.keys(data);
    let intermediate = topics.map((key: string): Array<StackedData> => {
      const dTemp = data[key]
      return [{x: 0, y: dTemp, name: key}]
    })

    intermediate.sort(function(a: Array<StackedData>, b: Array<StackedData>) {
      return d3.ascending(a[0].y, b[0].y);
    })

    const stack = this.state.dataStackLayout(intermediate)
    return stack;
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    if (_.isEqual(nextProps.data, this.props.data) && this.props.currentTopic == nextProps.currentTopic) {
      return false;
    }
    return true;
  }

  render() {
    const data = this.stackData(this.props.data)
    return (
      <Row>
        <Col xs={12}>
          <GraphParent data={data} side={this.props.side} currentTopic={this.props.currentTopic} updateMouseOver={this.props.updateMouseOver}/>
        </Col>
      </Row>
    )
  }
}
