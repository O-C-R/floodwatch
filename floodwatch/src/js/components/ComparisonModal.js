// @flow

import React, {Component} from 'react';
import {Modal, Button, Row, Col } from 'react-bootstrap'

import {createSentence} from './Compare'
import {ModalSegment} from './ModalSegment';

import type {Filter, Preset, FilterLogic} from './filtertypes'
import type {PersonResponse} from '../api/types';

import Filters from '../../stubbed_data/filter_response.json';

type PropsType = {
  visible: boolean,
  currentSelectionLeft: Array<Filter>,
  currentSelectionRight: Array<Filter>,
  toggleModal: () => void,
  changeCategoriesCustom: (side: string, obj: Filter, checked: boolean) => void,
  changeCategoriesPreset: (side: string, obj: Preset) => void,
  updateSearchLogic: (logic: string, filtername: FilterLogic, side: string) => void,
  userData: PersonResponse
};

type StateType = {
  leftIsCustom: boolean,
  rightIsCustom: boolean
};

function ComparisonModalInitialState(): StateType {
  return {
    leftIsCustom: false,
    rightIsCustom: false
  }
}


export class ComparisonModal extends Component {
  state: StateType;
  props: PropsType;

  constructor(props: PropsType){
    super(props);
    this.state = ComparisonModalInitialState()
  }

  handleCustomClick(side: string): void {
    if (side === 'right') {
      this.setState({
        rightIsCustom: true
      })
    } else if (side === 'left') {
      this.setState({
        leftIsCustom: true
      })
    }
  }

  changeCategoriesPreset(side: string, obj: Preset): void {
    if (side === 'right') {
      this.setState({
        rightIsCustom: false
      })
    } else if (side === 'left') {
      this.setState({
        leftIsCustom: false
      })
    }

    this.props.changeCategoriesPreset(side, obj);
  }

  render() {

    let sentence = `${createSentence(this.props.currentSelectionLeft)} compared to ${createSentence(this.props.currentSelectionRight)}.`
    return (
      <Modal show={this.props.visible} className="static-modal" bsSize="lg">
        <Modal.Header>
          <Modal.Title>Change Comparison</Modal.Title>
          <p>Select new demographic groups to compare. Try one of our presets, or select Custom to make your own.</p>
        </Modal.Header>

        <Modal.Body>
          <Row>
          <Col xs={5}>
          <ModalSegment userData={this.props.userData}
            side="left"
            currentSelection={this.props.currentSelectionLeft}
            isCustom={this.state.leftIsCustom}
            filterData={Filters}
            currentSentence={createSentence(this.props.currentSelectionLeft)}
            handlePresetClick={this.changeCategoriesPreset.bind(this)}
            handleCustomClick={this.handleCustomClick.bind(this, 'left')}
            handleFilterClick={this.props.changeCategoriesCustom.bind(this, 'left')}
            updateSearchLogic={this.props.updateSearchLogic.bind(this, 'left')}
            />
            </Col>
            <Col xs={2}>
          <div style={{textAlign:'center'}}>vs</div>
          </Col>
          <Col xs={5}>
          <ModalSegment side="right"
            userData={this.props.userData}
            currentSelection={this.props.currentSelectionRight}
            isCustom={this.state.rightIsCustom}
            filterData={Filters}
            currentSentence={createSentence(this.props.currentSelectionRight)}
            handlePresetClick={this.changeCategoriesPreset.bind(this)}
            handleCustomClick={this.handleCustomClick.bind(this, 'right')}
            handleFilterClick={this.props.changeCategoriesCustom.bind(this, 'right')}
            updateSearchLogic={this.props.updateSearchLogic.bind(this, 'right')}
            />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <span className="pull-left">{sentence}</span>
          <Button bsStyle="primary" onClick={this.props.toggleModal}>Done</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
