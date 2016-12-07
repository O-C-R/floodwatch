// @flow

import React, {Component} from 'react';
import Filters from '../../stubbed_data/filter_response.json';
import {Modal, Button, Row, Col } from 'react-bootstrap'
import {ModalSegment} from './ModalSegment';
import type {FilterOptionsType} from './Compare'
import {createSentence} from './Compare'

console.log(createSentence)

type PropsType = {
  visible: boolean,
  currentSelectionLeft: FilterOptionsType,
  currentSelectionRight: FilterOptionsType,
  toggleModal: Function
};

type StateType = {
  leftIsCustom: boolean,
  rightIsCustom: boolean
};

function ComparisonModalInitialState(): Object {
  return {
    leftIsCustom: false,
    rightIsCustom: false
  }
}


export class ComparisonModal extends Component {
  constructor(props: PropsType){
    super(props);
    this.state = ComparisonModalInitialState()
  }

  handleCustomClick(side) {
    if (side == "right") {
      const curState = this.state.rightIsCustom;
      this.setState({
        rightIsCustom: true
      })
    } else if (side == "left") {
      const curState = this.state.leftIsCustom;
      this.setState({
        leftIsCustom: true
      })
    }
  }

  changeCategoriesPreset(side, obj) {
    if (side == "right") {
      this.setState({
        rightIsCustom: false
      })
    } else if (side == "left") {
      this.setState({
        leftIsCustom: false
      })
    }

    this.props.changeCategoriesPreset(side, obj);
  }

  render() {
    let sentence = "hi"
    return (
      <Modal show={this.props.visible} className="static-modal" bsSize="lg">
        <Modal.Header>
          <Modal.Title>Change Comparison</Modal.Title>
          <p>Select new demographic groups to compare. Try one of our presets, or select Custom to make your own.</p>
        </Modal.Header>

        <Modal.Body>
          <Row>
          <Col xs={5}>
          <ModalSegment side="left" 
            currentSelection={this.props.currentSelectionLeft} 
            isCustom={this.state.leftIsCustom} 
            filterData={Filters}
            currentSentence={createSentence(this.props.currentSelectionLeft)}
            handlePresetClick={this.changeCategoriesPreset.bind(this)}
            handleCustomClick={this.handleCustomClick.bind(this, 'left')} 
            handleFilterClick={this.props.changeCategoriesCustom.bind(this, 'left')}/>
            </Col>
            <Col xs={2}>
          <div style={{textAlign:"center"}}>vs</div>
          </Col>
          <Col xs={5}>
          <ModalSegment side="right" 
            currentSelection={this.props.currentSelectionRight} 
            isCustom={this.state.rightIsCustom} 
            filterData={Filters}
            currentSentence={createSentence(this.props.currentSelectionRight)}
            handlePresetClick={this.changeCategoriesPreset.bind(this)}
            handleCustomClick={this.handleCustomClick.bind(this, 'right')} 
            handleFilterClick={this.props.changeCategoriesCustom.bind(this, 'right')}/>
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