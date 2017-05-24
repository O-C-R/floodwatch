// @flow

import React, { Component } from 'react';
import { Row, Col, Well } from 'react-bootstrap';
import moment from 'moment';

import type { DemographicCategory } from '../../common/types';

type Props = {|
  onUpdate: (year: ?number) => void,
  birthYear: ?number,
  categoryInfo: DemographicCategory,
|};

export default class Age extends Component {
  props: Props;
  state: {
    isDescriptionOpen: boolean,
  };

  state = {
    isDescriptionOpen: false,
  };

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility,
    });
  }

  onUpdate(e: Event) {
    const { onUpdate } = this.props;
    if (e.target instanceof HTMLSelectElement) {
      const value = e.target.value;
      if (value === 'null') {
        onUpdate(null);
      } else {
        const year = parseInt(value, 10);
        onUpdate(year);
      }
    }
  }

  render() {
    const { birthYear, categoryInfo } = this.props;

    const yearOptions = [];
    for (let year = moment().year(); year >= 1901; --year) {
      if (year === birthYear) {
        yearOptions.push(
          <option key={year} value={year} selected>{year}</option>,
        );
      } else {
        yearOptions.push(<option key={year} value={year}>{year}</option>);
      }
    }

    return (
      <div className="profile-page_option panel-body">
        <div className="profile-page_option_header">
          <h4>
            {categoryInfo.question}{' '}
            <button
              onClick={this.toggleDescriptionVisibility.bind(this)}
              className={`profile-page_learnmore ${this.state.isDescriptionOpen ? 'open' : ''}`}>
              <span className="glyphicon glyphicon-info-sign" />
            </button>
          </h4>
          {categoryInfo.instruction &&
            <p className="profile-page_option_header_instruction">
              {categoryInfo.instruction}
            </p>}
          {this.state.isDescriptionOpen &&
            <Well bsSize="small">{categoryInfo.why}</Well>}
        </div>
        <Row>
          <Col xs={12} sm={8} md={4}>
            <select
              className="form-control text-center input-small"
              onChange={this.onUpdate.bind(this)}>
              <option value="null">None selected</option>
              {yearOptions}
            </select>
          </Col>
        </Row>
      </div>
    );
  }
}
