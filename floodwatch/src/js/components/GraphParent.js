// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import * as d3 from 'd3';
import _ from 'lodash'
import {Chart} from './Chart'
import type {StackedData} from './FilterParent'

type PropsType = {
  data: Array<Array<StackedData>>,
  currentTopic: string,
  side: string,
  updateMouseOver: (topic: string) => void
};

export class GraphParent extends Component {
  props: PropsType;

  constructor(props: PropsType): void {
    super(props);
  }

  render() {
    return (
      <Chart barData={this.props.data} currentTopic={this.props.currentTopic} side={this.props.side} updateMouseOver={this.props.updateMouseOver}/>
    )
  }
}
