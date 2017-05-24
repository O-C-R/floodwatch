// @flow

import React, { Component } from 'react';
import { Col } from 'react-bootstrap';

import history from '../common/history';
import ProfileExplanation from '../components/ProfileExplanation';
import ProfileDemographics
  from '../components/profile_demographics/ProfileDemographics';

type State = {
  saving: boolean,
};

function initialState(): State {
  return {
    saving: false,
  };
}

export default class RegisterDemographics extends Component {
  state: State;

  constructor() {
    super();
    this.state = initialState();
  }

  render() {
    return (
      <Col xs={10} xsOffset={1} md={8} mdOffset={2}>
        <div className="profile-page panel">
          <div className="panel-container">
            <h1>Your profile</h1>
            <ProfileExplanation />
          </div>

          <ProfileDemographics
            onSuccess={() => {
              history.push('/compare');
            }} />
        </div>s
      </Col>
    );
  }
}
