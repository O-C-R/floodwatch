// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {GraphParent} from './GraphParent';
import _ from 'lodash';
import d3 from 'd3'

type StateType = {
  dataStackLayout: () => void
};

function initialState(): Object {
  return {
    dataStackLayout: d3.layout.stack()
  }
}

type PropsType = {
  side: string,
  currentTopic: string,
  updateMouseOver: (topic: Topic) => void
};

export class FilterParent extends Component {
  props: PropsType;
  state: StateType;

  constructor(props: Props): void {
    super(props);
    this.state = initialState()
  }

  stackData(data: Object): [] {
    const topics = Object.keys(data);
    const intermediate = topics.map((key: string): [] => {
      const dTemp = data[key]
      return [{x: 0, y: dTemp, name: key}]
    })

    const stack = this.state.dataStackLayout(intermediate)
    return stack;
  }

  // shouldComponentUpdate() {
    
  // }

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
