// @flow

import React, { Component } from 'react';
import { Col, Row, Button, ListGroup, ListGroupItem, Well } from 'react-bootstrap';
import _ from 'lodash'
import Filters from '../../stubbed_data/filter_response.json';

import {FWApiClient} from '../api/api';
import type {PersonDemographics} from '../api/types';
import {AgeOption, LocationOption, DefaultOption} from './ProfileOptions';
import scrollTo from 'scroll-to';

const TO_PICK = ['birth_year', 'twofishes_id', 'demographic_ids']; // stripping out admin, timestamp, etc.--other things that are set on the backend


type ProfileStateType = {
  isDescriptionOpen: boolean,
  success: string,
  errors: string,
  status: string
};

function setInitialStateProfile() {
  return {
    isDescriptionOpen: false,
    success : null,
    errors : null
  }
}


export class Profile extends Component {
  state: ProfileStateType

  constructor() {
    super();
    this.state = setInitialStateProfile();
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility
    })
  }

  statusHandler(status, message){

    scrollTo(0, 0, {
      ease: 'linear',
      duration: 200
    });

    let success = (status === 'success' ? message : null)
    let errors = (status === 'error' ? message : null)

    this.setState({
      errors,
      success
    })
  }

  render() {
    return (
      <div>

        {(this.state.success || this.state.errors) &&
          <ListGroup>
            {(this.state.success &&
              <ListGroupItem bsStyle="success">{this.state.success}</ListGroupItem>
            )}
            {(this.state.errors &&
              <ListGroupItem bsStyle="danger">{this.state.errors}</ListGroupItem>
            )}
          </ListGroup>
        }
      
        <div className="profile-page panel">
          <div className="panel-container">
            <h1>My Profile</h1>
            <p>Donate your data to help us discover discriminatory patterns in advertising, and reverse the power relationship between people and advertisers.</p>
            <p>Wondering why your demographic data matters? <a onClick={this.toggleDescriptionVisibility.bind(this)}>Learn more</a></p>
            { this.state.isDescriptionOpen &&
              <p>
                <Well bsSize="small">
                  <p>The reason why we ask for demographic information is because advertisers base their advertising decisions on what demographic they believe you to be--a practice that can easily turn discriminatory.</p>
                  <p>Without being able to show advertising trends as experienced by large groups, it’s hard to prove that these discriminatory behaviors are happening. This is why Floodwatch asks for your demographic data: because knowing who’s getting served what ads helps our researchers uncover large-scale trends of discriminatory practices. The more demographic information you volunteer, the more information our researchers have to find these connections.</p>
                </Well>
              </p>
            }
          </div>

          <DemographicContainer statusHandler={this.statusHandler.bind(this)}/>
          <AccountOptionsContainer/>
        </div>

      </div>
    );
  }

}

type DemographicContainerStateType = {
  userData?: PersonDemographics,
  curStatus: null | "success" | "error"
};

function setInitialStateDemographicContainer() {
  return {
    curStatus: null
  }
}

export class DemographicContainer extends Component {
  state: DemographicContainerStateType

  constructor() {
    super();
    this.state = setInitialStateDemographicContainer();
  }

  componentDidMount() {
    const init = async () => {
      try {
        const UserData = await FWApiClient.get().getCurrentPerson()
        let filteredUserData = _.pick(UserData, TO_PICK)
        this.setState({
          userData: filteredUserData,
        })
      } catch (e) {
        this.setState({curStatus: 'error'})
        console.error(e)
      }
    };
    init();
  }

  handleClick(checked: boolean, id: number, event: any): void {
    if (event.target.name !== 'age' && event.target.name !== 'country_code') {
      if (checked) {
        this.addToDemographicIds(id)
      } else {
        this.removeFromDemographicIds(id)
      }
    }
  }

  async updateUserInfo() {
    try {
      if (this.state.userData) {
        const userData = this.state.userData;
        const reply = await FWApiClient.get().updatePersonDemographics(userData);
        let filteredUserData = _.pick(reply, TO_PICK)
        this.setState({
          userData: filteredUserData
        })

        this.props.statusHandler("success","Successfully saved changes!")

      } else {
        this.setState({curStatus: "error"});
      }
    } catch (e) {
      this.props.statusHandler("error", "Error while trying to save changes. Please check your connection.")
    }
  }

  addToDemographicIds(id: number): void {
    let userData = _.cloneDeep(this.state.userData);
    userData.demographic_ids.push(id)
    this.updateStateAndMessages(userData)
  }

  updateYear(event: any): void {
    let userData = _.cloneDeep(this.state.userData);
    userData.birth_year = parseInt(event.target.value, 10);
    this.updateStateAndMessages(userData)
  }

  removeFromDemographicIds(id: number): void {
    let userData = _.cloneDeep(this.state.userData)
    userData.demographic_ids = _.filter(userData.demographic_ids, (o) => {
      return o !== id
    })
    this.updateStateAndMessages(userData)
  }

  updateLocation(loc: string) {
    let userData = _.cloneDeep(this.state.userData)
    userData.twofishes_id = loc
    this.updateStateAndMessages(userData)
  }

  updateStateAndMessages(userData: PersonDemographics) {
    this.setState({
      userData: userData,
      curStatus: (this.state.curStatus !== 'error') ? null : 'error'
    })
  }

  render() {
    let elems = Filters.filters.map((filter, i) => {
      if (filter.name === 'age') {
        return <AgeOption updateYear={this.updateYear.bind(this)}
                          handleClick={this.handleClick.bind(this)}
                          userData={this.state.userData} filter={filter}
                          key={i}/>

      } else if (filter.name === 'country') {
        return <LocationOption
                          updateLocation={this.updateLocation.bind(this)}
                          handleClick={this.handleClick.bind(this)}
                          userData={this.state.userData} filter={filter}
                          key={i}/>
      } else {
        return <DefaultOption
                          handleClick={this.handleClick.bind(this)}
                          userData={this.state.userData} filter={filter}
                          key={i}/>
      }


    })

    return (
      <Row>
        <Col xs={12}>
        {elems}
        </Col>

        <Col xs={12} className="profile-page_actions">
          <Button className="profile-page_actions_submit" bsSize="large" bsStyle="primary" onClick={this.updateUserInfo.bind(this)} id="submit-button">Save</Button>
        </Col>
      </Row>
    )
  }
}

export class AccountOptionsContainer extends Component {
  render() {
    return (
      <div className="panel-container">
        <p>If you would like to download your data, reset your password, or delete your account, please email us at <a href="mailto:floodwatch@ocr.nyc">floodwatch@ocr.nyc</a></p>
      </div>
    )
  }

}
