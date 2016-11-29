// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import * as d3 from 'd3';
import _ from 'lodash'
import {Chart} from './Chart'

type Props = {
  barData: Array;
  currentTopic: string;
  side: string;
  updateMouseOver: Function;
}

export class GraphParent extends Component {
  props: Props;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <div className="chart_chart">
        <Chart barData={this.props.data} currentTopic={this.props.currentTopic} side={this.props.side} updateMouseOver={this.props.updateMouseOver}/>
      </div>
    )
  }
}
