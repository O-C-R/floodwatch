// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import {FilterParent} from './FilterParent';
import AdBreakdown from '../../stubbed_data/adbreakdown_response.json';
import Filters from '../../stubbed_data/filter_response.json';

// import '../../Compare.css';

type CompareState = {}
export class Compare extends Component {
  state: CompareState;

  constructor(props) {
    super(props);
  }

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

type CompareContainerState = {
  leftOptions: JSON;
  rightOptions: JSON;
  currentTopic: string;
}

function CompareContainerInitialState() {
  return {
    leftOptions: Filters.presets[0].filters,
    rightOptions: Filters.presets[1].filters,
    leftData: {},
    rightData: {},
    currentTopic: 'Food'
  }
}

export class CompareContainer extends Component {
  state: CompareContainerState;

  constructor(props) {
    super(props);
    this.state = CompareContainerInitialState()
  }

  componentDidMount() {
    this.setState({
      leftData: AdBreakdown.filterA,
      rightData: AdBreakdown.filterB
    })
  }

  createSentence(options) {
    var sentence = 'Floodwatch users';
    if (options.length == 0) {
      sentence = 'All ' + sentence;
      return sentence
    }

    if (options[0].name == 'data') {
      return 'You'
    }

    options.map((opt, key) => {
      let logic = ''
      let choices = ''
      if (opt.logic == 'NOT') { 
        logic = ' Non-';
        choices = opt.choices.join(', non-')
      } else {
        choices = opt.choices.join(', ')
      }
      sentence = logic + choices + ' ' + sentence
    })

    return sentence
  }

  updateMouseOver(newTopic) {
    this.setState({
      currentTopic: newTopic
    })
  }

  calculatePercentDiff(a, b) {
    let abs = (a-b)
    let denom = (Math.abs(a))
    let prc = (abs/denom)*100
    return prc
  }

  generateDifferenceSentence(lVal, rVal) {
    let sentence = '';
    let prc = Math.floor(this.calculatePercentDiff(lVal, rVal))

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
    let lVal = this.state.leftData[this.state.currentTopic];
    let rVal = this.state.rightData[this.state.currentTopic];
    let sentence = this.generateDifferenceSentence(lVal, rVal)

    return (
      <Row className="main">
        <Col xs={12}>
          <Row>
            <Col xs={5} xsOffset={1}>
              <FilterParent className="chart" side="left" data={this.state.leftData} currentSelection={this.state.leftOptions} currentTopic={this.state.currentTopic} updateMouseOver={this.updateMouseOver.bind(this)}/>
            </Col>

            <Col xs={5}>
              <FilterParent className="chart" side="right" data={this.state.rightData} currentSelection={this.state.rightOptions} currentTopic={this.state.currentTopic} updateMouseOver={this.updateMouseOver.bind(this)}/>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
            <p className="centered"><h3>{sentence}.</h3></p>
            </Col>
          </Row>
          <Row>
            <p className="centered">
            <button className="btn btn-default button">Share finding</button><button className="btn btn-primary button">Change comparison</button>
            </p>
          </Row>
        </Col>
      </Row>

    )
  }
}
