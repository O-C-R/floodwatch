// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {FilterParent} from './FilterParent';
import AdBreakdown from '../../stubbed_data/adbreakdown_response.json';
import Filters from '../../stubbed_data/filter_response.json';

// import '../../Compare.css';

export class Compare extends Component {
  render() {
    return (
      <Row>
        <Col xs={12}>
        <CompareContainer/>
        </Col>
      </Row>
    )
  }
}

type StateType = {
  leftOptions: {},
  rightOptions: {},
  currentTopic: string
};

function CompareContainerInitialState(): {} {
  return {
    leftOptions: Filters.presets[0].filters,
    rightOptions: Filters.presets[1].filters,
    leftData: {},
    rightData: {},
    currentTopic: 'Food'
  }
}

export class CompareContainer extends Component {
  state: StateType;

  constructor(): void {
    super();
    this.state = CompareContainerInitialState()
  }

  componentDidMount(): void {
    this.setState({
      leftData: AdBreakdown.filterA,
      rightData: AdBreakdown.filterB
    })
  }

  createSentence(options: {}): string {
    let sentence = 'Floodwatch users';
    if (options.length == 0) {
      sentence = 'All ' + sentence;
      return sentence
    }

    if (options[0].name == 'data') {
      return 'You'
    }

    options.map((opt: {}): void => {
      let logic = ''
      let choices = ''
      if (opt.logic == 'NOR') { 
        logic = ' Non-';
        choices = opt.choices.join(', non-')
      } else {
        choices = opt.choices.join(', ')
      }
      sentence = logic + choices + ' ' + sentence
    })

    return sentence
  }

  updateMouseOver(newTopic: Topic): void {
    this.setState({
      currentTopic: newTopic
    })
  }

  calculatePercentDiff(a: number, b: number): number {
    const abs = (a-b)
    const denom = (Math.abs(a))
    const prc = (abs/denom)*100
    return prc
  }

  generateDifferenceSentence(lVal: number, rVal: number): string {
    let sentence = '';
    const prc = Math.floor(this.calculatePercentDiff(lVal, rVal))

    // Math.sign isn't supported on Chromium fwiw
    if (prc == -Infinity) {
      sentence = `On average, ${this.createSentence(this.state.leftOptions)} don't see any ${this.state.currentTopic} ads, as opposed to ${this.createSentence(this.state.rightOptions)}`
    } else if (prc == 100) {
      sentence = `On average, ${this.createSentence(this.state.rightOptions)} don't see any ${this.state.currentTopic} ads, as opposed to ${this.createSentence(this.state.leftOptions)}`
    } else if (prc < 0) {
      sentence = `On average, ${this.createSentence(this.state.leftOptions)} see ${prc}% less ${this.state.currentTopic} ads than ${this.createSentence(this.state.rightOptions)}`;
    } else if (prc > 0) {
      sentence = `On average, ${this.createSentence(this.state.leftOptions)} see ${prc}% more ${this.state.currentTopic} ads than ${this.createSentence(this.state.rightOptions)}`;
    } else if (prc == 0) {
      sentence = `${this.createSentence(this.state.leftOptions)} and ${this.createSentence(this.state.rightOptions)} see the same amount of ${this.state.currentTopic} ads`;
    }

    return sentence;
  }

  render() {
    const lVal = this.state.leftData[this.state.currentTopic];
    const rVal = this.state.rightData[this.state.currentTopic];
    const sentence = this.generateDifferenceSentence(lVal, rVal)

    return (
      <Row className="main">
        <Col xs={12}>
          <Row>
            <Col xs={5} xsOffset={1}>
              <FilterParent 
                className="chart" 
                side="left" 
                data={this.state.leftData} 
                currentSelection={this.state.leftOptions} 
                currentTopic={this.state.currentTopic} 
                updateMouseOver={this.updateMouseOver.bind(this)}/>
            </Col>

            <Col xs={5}>
              <FilterParent 
                className="chart" 
                side="right" 
                data={this.state.rightData} 
                currentSelection={this.state.rightOptions} 
                currentTopic={this.state.currentTopic} 
                updateMouseOver={this.updateMouseOver.bind(this)}/>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
            <p className="centered"><h3>{sentence}.</h3></p>
            </Col>
          </Row>
          <Row>
            <p className="centered">
              <button className="btn btn-default button">Share finding</button>
              <button className="btn btn-primary button">Change comparison</button>
            </p>
          </Row>
        </Col>
      </Row>

    )
  }
}
