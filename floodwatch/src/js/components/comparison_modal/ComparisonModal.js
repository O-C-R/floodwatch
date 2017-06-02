// @flow

import React, { Component } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import _ from 'lodash';

import { createSentence } from '../../common/comparisontools';
import FilterColumn from './FilterColumn';

import type { FilterRequestItem, PersonResponse } from '../../api/types';

type Props = {|
  visible: boolean,
  currentSelectionLeft: FilterRequestItem,
  currentSelectionRight: FilterRequestItem,
  toggleModal: () => void,
  setFilters: (left: ?FilterRequestItem, right: ?FilterRequestItem) => void,
  userData: PersonResponse,
|};

type State = {
  leftFilter: FilterRequestItem,
  rightFilter: FilterRequestItem,
  leftIsCustom: boolean,
  rightIsCustom: boolean,
};

export default class ChangeComparisonModal extends Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      leftFilter: _.cloneDeep(props.currentSelectionLeft),
      rightFilter: _.cloneDeep(props.currentSelectionRight),
      leftIsCustom: false,
      rightIsCustom: false,
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({
      leftFilter: _.cloneDeep(nextProps.currentSelectionLeft),
      rightFilter: _.cloneDeep(nextProps.currentSelectionRight),
    });
  }

  handleCustomClick(side: string, isCustom: boolean): void {
    if (side === 'right') {
      this.setState({ rightIsCustom: isCustom });
    } else if (side === 'left') {
      this.setState({ leftIsCustom: isCustom });
    }
  }

  changeFilter(side: string, filter: FilterRequestItem): void {
    if (side === 'right') {
      this.setState({ rightFilter: filter });
    } else if (side === 'left') {
      this.setState({ leftFilter: filter });
    }
  }

  onDone() {
    const { leftFilter, rightFilter } = this.state;

    this.props.setFilters(leftFilter, rightFilter);
    this.props.toggleModal();
  }

  render() {
    const { visible, userData } = this.props;
    const { leftIsCustom, rightIsCustom, leftFilter, rightFilter } = this.state;

    const leftSentence = createSentence(leftFilter);
    const rightSentence = createSentence(rightFilter);

    const sentence = `${leftSentence} compared to ${rightSentence}.`;

    return (
      <Modal show={visible} className="static-modal" bsSize="lg">
        <Modal.Header>
          <Modal.Title>Change Comparison</Modal.Title>
          <p>
            Select new demographic groups to compare. Try one of our presets,
            or select Custom to make your own.
          </p>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col xs={12} md={6} className="col-md-border">
              <FilterColumn
                userData={userData}
                filter={leftFilter}
                isCustom={leftIsCustom}
                sentence={leftSentence}
                onSelectCustom={() => this.handleCustomClick('left', true)}
                onSelectPreset={(filter) => {
                  this.handleCustomClick('left', false);
                  this.changeFilter('left', filter);
                }}
                onChangeCustom={filter => this.changeFilter('left', filter)} />
            </Col>
            <Col xs={6} md={6} className="col-md-border">
              <FilterColumn
                userData={userData}
                filter={rightFilter}
                isCustom={rightIsCustom}
                sentence={rightSentence}
                onSelectCustom={() => this.handleCustomClick('right', true)}
                onSelectPreset={(filter) => {
                  this.handleCustomClick('right', false);
                  this.changeFilter('right', filter);
                }}
                onChangeCustom={filter => this.changeFilter('right', filter)} />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <span className="pull-left">{sentence}</span>
          <Button bsStyle="primary" onClick={this.onDone.bind(this)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
