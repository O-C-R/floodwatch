// @flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import { Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import _ from 'lodash'
import Filters from '../../stubbed_data/filter_response.json';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type {DemographicDictionary} from './FindInDemographics'
//@flow

import {FWApiClient} from '../api/api';
import type {PersonDemographics} from '../api/types';
import {AgeOption, LocationOption, DefaultOption} from './ProfileOptions'

const ToPick = ['birth_year', 'twofishes_id', 'demographic_ids']; // stripping out admin, timestamp, etc.--other things that are set on the backend

export class Profile extends Component {
  render() {
    return (
      <Row style={{backgroundColor:'white', borderRadius:'10px', padding:'20px'}}>
        <Col xs={12}>
          <h3>My Profile</h3>
          <p>Donate your data to help us discover discriminatory patterns in advertising, and reverse the power relationship between people and advertisers.</p>
          <p>Wondering why your demographic data matters? <Button bsSize="xsmall">Read more</Button></p>
        </Col>
        <Col xs={12}>
        <DemographicContainer/>
        <AccountOptionsContainer/>
        </Col>
      </Row>
    )   
  }

}

type StateType = {
  userData?: PersonDemographics,
  curStatus: null | "success" | "error"
};

function setInitialState() {
  return {
    curStatus: null
  }
}

export class DemographicContainer extends Component {
  state: StateType

  constructor() {
    super();
    this.state = setInitialState();
  }

  async componentDidMount() {
    const UserData = await FWApiClient.get().getCurrentPerson()
    let filteredUserData = _.pick(UserData, ToPick)

    this.setState({
      userData: filteredUserData
    })
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
      this.setState({curStatus: 'success'})
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

  updateLocation(loc) {
    let userData = _.cloneDeep(this.state.userData)
    userData.twofishes_id = loc
    this.updateStateAndMessages(userData)
  }

  updateStateAndMessages(userData) {
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
      <Row style={{border:'1px solid #e9e9e9', borderRadius:'10px', padding:'20px'}}> 
        <Col xs={12}>
        {elems}
        </Col>
        <Col xs={12}>
        <Button onClick={this.updateUserInfo.bind(this)} style={{backgroundColor:'lightblue', width:'100%'}}>Submit</Button>
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
      <div></div>
    )
  }

}
