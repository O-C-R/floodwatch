// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {GraphParent} from './GraphParent';
import _ from 'lodash';
import d3 from 'd3'

type Props = {
  side: string;
  currentTopic: string;
  updateMouseOver: Function;
}

export class FilterParent extends Component {
  props: Props;

  constructor(props: Props) {
    super(props);
  }

  stackData(data) {
    let topics = Object.keys(data);
    let intermediate = topics.map(function(key) {
      let dTemp = data[key]
      return [{x: 0, y: dTemp, name: key}]
    })

    let dataStackLayout = d3.layout.stack()
    let stack = dataStackLayout(intermediate)
    return stack;
  }

  render() {
    let data = this.stackData(this.props.data)
    return (
      <Row>
        <Col xs={12}>
          <GraphParent data={data} side={this.props.side} currentTopic={this.props.currentTopic} updateMouseOver={this.props.updateMouseOver}/>
        </Col>
      </Row>
    )
  }
}
