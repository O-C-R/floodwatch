// @flow

import React, { Component } from 'react';
import { Col, Row, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import _ from 'lodash';
import scrollTo from 'scroll-to';
import log from 'loglevel';

import FWApiClient from '../../api/api';

import Age from './Age';
import Demographic from './Demographic';
import Location from './Location';

import type { DemographicCategoriesJSON } from '../../common/types';

const DEMOGRAPHIC_CATEGORIES: DemographicCategoriesJSON = require('../../../data/demographic_categories');

type Props = {
  onSuccess: ?() => void,
};

type State = {
  birthYear: ?number,
  twofishesId: ?string,
  demographicIds: Array<number>,

  successMsg: ?string,
  errorMsg: ?string,
  curStatus: null | 'success' | 'error',
};

export default class ProfileDemographics extends Component {
  props: Props;
  state: State;

  static defaultProps: {
    onSuccess: ?() => void,
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      birthYear: null,
      twofishesId: null,
      demographicIds: [],

      successMsg: null,
      errorMsg: null,
      curStatus: null,
    };
  }

  componentDidMount() {
    const init = async () => {
      try {
        const userData = await FWApiClient.get().getCurrentPerson();
        this.setState({
          birthYear: userData.birth_year,
          twofishesId: userData.twofishes_id,
          demographicIds: userData.demographic_ids,
        });
      } catch (e) {
        this.setState({ curStatus: 'error' });
        log.error(e);
      }
    };
    init();
  }

  statusHandler(status: 'success' | 'error', message: string) {
    scrollTo(0, 0, {
      ease: 'linear',
      duration: 200,
    });

    const successMsg = status === 'success' ? message : null;
    const errorMsg = status === 'error' ? message : null;
    this.setState({ curStatus: status, errorMsg, successMsg });
  }

  async updateUserInfo() {
    const { onSuccess } = this.props;
    const { birthYear, twofishesId, demographicIds } = this.state;

    try {
      const userData = await FWApiClient.get().updatePersonDemographics({
        birth_year: birthYear,
        twofishes_id: twofishesId,
        demographic_ids: demographicIds,
      });
      this.setState({
        birthYear: userData.birth_year,
        twofishesId: userData.twofishes_id,
        demographicIds: userData.demographic_ids,
      });

      if (onSuccess) {
        onSuccess();
      }

      this.statusHandler('success', 'Successfully saved changes!');
    } catch (e) {
      this.statusHandler(
        'error',
        'Error while trying to save changes. Please check your connection.',
      );
    }
  }

  updateYear(year: ?number): void {
    this.setState({ birthYear: year });
  }

  updateDemographics(added: ?Array<number>, removed: ?Array<number>) {
    const { demographicIds } = this.state;

    if (added) {
      demographicIds.push(...added);
    }
    if (removed) {
      _.pull(demographicIds, ...removed);
    }

    this.setState({ demographicIds });
  }

  updateLocation(twofishesId: ?string) {
    this.setState({ twofishesId });
  }

  render() {
    const { categories } = DEMOGRAPHIC_CATEGORIES;
    const {
      successMsg,
      errorMsg,
      birthYear,
      twofishesId,
      demographicIds,
    } = this.state;

    return (
      <div>
        {(successMsg || errorMsg) &&
          <ListGroup>
            {successMsg &&
              <ListGroupItem bsStyle="success">
                {successMsg}
              </ListGroupItem>}
            {errorMsg &&
              <ListGroupItem bsStyle="danger">
                {errorMsg}
              </ListGroupItem>}
          </ListGroup>}

        <Row>
          <Col xs={12}>
            <Age
              onUpdate={this.updateYear.bind(this)}
              birthYear={birthYear}
              categoryInfo={categories.age} />
            <Demographic
              onUpdate={this.updateDemographics.bind(this)}
              demographicIds={demographicIds}
              categoryInfo={categories.gender} />
            <Demographic
              onUpdate={this.updateDemographics.bind(this)}
              demographicIds={demographicIds}
              categoryInfo={categories.race} />
            <Demographic
              onUpdate={this.updateDemographics.bind(this)}
              demographicIds={demographicIds}
              categoryInfo={categories.religion} />
            <Location
              onUpdate={this.updateLocation.bind(this)}
              twofishesId={twofishesId}
              categoryInfo={categories.location} />
          </Col>

          <Col xs={12} className="profile-page_actions">
            <Button
              className="profile-page_actions_submit"
              bsSize="large"
              bsStyle="primary"
              onClick={this.updateUserInfo.bind(this)}
              id="submit-button">
              Save
            </Button>
          </Col>
        </Row>
      </div>
    );
  }
}
