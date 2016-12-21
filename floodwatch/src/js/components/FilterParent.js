// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {GraphParent} from './GraphParent';
import _ from 'lodash';
import d3 from 'd3'
import TopicKeys from '../../stubbed_data/topic_keys.json';

const UNKNOWN = _.findKey(TopicKeys, (topic) => {
  return (topic == 'Unknown')
})

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
  data: UnstackedData,
  sentence: string
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

    console.log(data)

    let intermediate = topics.map((key: string): Array<StackedData> => {
      const dTemp = data[key]
      return [{x: 0, y: dTemp, name: key}]
    })

    intermediate.sort(function(a: Array<StackedData>, b: Array<StackedData>) {
      return d3.ascending(a[0].y, b[0].y);
    })

    let unknown = _.remove(intermediate, (topic) => {
      return topic[0].name == UNKNOWN
    })

    intermediate = _.concat(unknown, intermediate)

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
    let elem;
    const data = this.stackData(this.props.data)

    const graph = <GraphParent data={data} side={this.props.side} currentTopic={this.props.currentTopic} updateMouseOver={this.props.updateMouseOver}/>
    const sentence = <h5>{this.props.sentence}</h5>

    if (this.props.side == 'left') {
      elem =
            <div> 
            <Col xs={3}>
              {sentence}
            </Col>
            <Col xs={9}>
              {graph}
            </Col>
            </div>
    } else {
      elem = <div>
            <Col xs={10}>
              {graph}
            </Col>
            <Col xs={2}>
              {sentence}
            </Col>
            </div>
    }

    
    return (
      <Row>
        {elem}
      </Row>
    )
  }
}
