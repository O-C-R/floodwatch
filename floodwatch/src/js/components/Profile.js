// @flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import { Row, Col, Button, ListGroup, ListGroupItem, Well } from 'react-bootstrap';
import _ from 'lodash'
import Filters from '../../stubbed_data/filter_response.json';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type {DemographicDictionary} from './FindInDemographics'

import {FWApiClient} from '../api/api';
import type {PersonDemographics} from '../api/types';
import {AgeOption, LocationOption, DefaultOption} from './ProfileOptions'

const ToPick = ['birth_year', 'twofishes_id', 'demographic_ids']; // stripping out admin, timestamp, etc.--other things that are set on the backend


type ProfileStateType = {
  isDescriptionOpen: boolean
};

function setInitialStateProfile() {
  return {
    isDescriptionOpen: false
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

  render() {
    return (
      <Row id="profile">
        <Col xs={12} id="profile-explanation" >
          <h3>My Profile</h3>
          <p>Donate your data to help us discover discriminatory patterns in advertising, and reverse the power relationship between people and advertisers.</p>
          <p>Wondering why your demographic data matters? <Button bsSize="xsmall" onClick={this.toggleDescriptionVisibility.bind(this)}>Learn more</Button></p>
          <p style={{
            display: (this.state.isDescriptionOpen)? 'block' : 'none'
          }}>
            <Well bsSize="small">
              <p>The reason why we ask for demographic information is because advertisers base their advertising decisions on what demographic they believe you to be--a practice that can easily turn discriminatory.</p>
              <p>Without being able to show advertising trends as experienced by large groups, it’s hard to prove that these discriminatory behaviors are happening. This is why Floodwatch asks for your demographic data: because knowing who’s getting served what ads helps our researchers uncover large-scale trends of discriminatory practices. The more demographic information you volunteer, the more information our researchers have to find these connections.</p>
            </Well>
          </p>
        </Col>
        <Col xs={12}>
        <hr/>
        <DemographicContainer/>
        <AccountOptionsContainer/>
        </Col>
      </Row>
    )   
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

  async componentDidMount() {
    try {
      const UserData = await FWApiClient.get().getCurrentPerson()
      let filteredUserData = _.pick(UserData, ToPick)
      this.setState({
        userData: filteredUserData,
      })  
    } catch (e) {
      this.setState({curStatus: 'error'})
      console.error(e)
    }
  }

  handleClick(checked: boolean, event: any): void {
    let demo = event.target.textContent;
    let demo_id = _.find(DemographicKeys.demographic_keys, (o: DemographicDictionary) => {
      return o.name == demo
    })

    if (event.target.name != 'age' && event.target.name != 'country_code') {
      if (checked) {
        this.addToDemographicIds(demo_id.id)
      } else {
        this.removeFromDemographicIds(demo_id.id)
      }
    }
  }

  async updateUserInfo() {
    try {
      const reply = await FWApiClient.get().updatePersonDemographics(this.state.userData)  
      let filteredUserData = _.pick(reply, ToPick)
      this.setState({
        userData: filteredUserData,
        curStatus: 'success'
      })  
    } catch (e) {
      console.error(e)
      this.setState({curStatus: 'error'})
    }
  }

  addToDemographicIds(id: number): void {
    let userData = _.cloneDeep(this.state.userData);
    userData.demographic_ids.push(id)
    this.updateStateAndMessages(userData)
  }

  updateYear(event: any): void {
    let userData = _.cloneDeep(this.state.userData);
    userData.birth_year = parseInt(event.target.value);
    this.updateStateAndMessages(userData)
  }

  removeFromDemographicIds(id: number): void {
    let userData = _.cloneDeep(this.state.userData)
    userData.demographic_ids = _.filter(userData.demographic_ids, (o) => {
      return o != id
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
      curStatus: (this.state.curStatus != 'error') ? null : 'error'
    })
  }

  render() {
    let elems = Filters.filters.map((filter) => {
      if (filter.name == 'age') {
        return <AgeOption updateYear={this.updateYear.bind(this)}
                          handleClick={this.handleClick.bind(this)} 
                          userData={this.state.userData} filter={filter}/>

      } else if (filter.name == 'country') {
        return <LocationOption
                          updateLocation={this.updateLocation.bind(this)}
                          handleClick={this.handleClick.bind(this)} 
                          userData={this.state.userData} filter={filter}/>
      } else {
        return <DefaultOption  
                          handleClick={this.handleClick.bind(this)} 
                          userData={this.state.userData} filter={filter}/>        
      }


    })

    const displayGroup = (this.state.curStatus == null) ? 'none' : 'block'

    return (
      <Row> 
        <Col xs={12}>
        {elems}
        </Col>
        <Col xs={12}>
        <Button onClick={this.updateUserInfo.bind(this)} id="submit-button">Submit</Button>
        <ListGroup style={{display: displayGroup, textAlign:'center'}}>
          { this.state.curStatus == 'success' &&
            <ListGroupItem bsStyle="success">
              Successfully saved changes!
            </ListGroupItem> 
          }
          { this.state.curStatus == 'error' &&
            <ListGroupItem bsStyle="danger">
              Error while trying to save changes. Please check your connection.
            </ListGroupItem> 
          }
        </ListGroup>
        </Col>
      </Row>
    )
  }
}

export class AccountOptionsContainer extends Component {
  render() {
    return (
      <Row style={{padding:'20px'}}>
        <hr/>
        <Col xs={12} >
          <p>If you would like to download your data, reset your password, or delete your account, please email us at floodwatch@ocr.nyc.</p>
        </Col>
      </Row>
    )
  }

}
