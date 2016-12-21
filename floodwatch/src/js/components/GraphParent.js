// @flow

import React, { Component } from 'react';
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

  render() {
    return (
      <div className="chart_chart">
        <Chart barData={this.props.data} currentTopic={this.props.currentTopic} side={this.props.side} updateMouseOver={this.props.updateMouseOver}/>
      </div>
    )
  }
}
