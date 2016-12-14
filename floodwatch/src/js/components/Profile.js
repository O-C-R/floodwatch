// @flow

import React, { Component } from 'react';
import { Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import _ from 'lodash'
import Filters from '../../stubbed_data/filter_response.json';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type {DemographicDictionary} from './FindInDemographics'

import {FWApiClient} from '../api/api';
import type {PersonDemographicRequest} from '../api/types';

type StateType = {
  userData?: PersonDemographicRequest,
  toPick: Array<string>,
  curStatus: string
};

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

export class DemographicContainer extends Component {
  state: StateType

  constructor() {
    super();
    this.state = {
      toPick: ['birth_year', 'twofishes_id', 'demographic_ids'],
      curStatus: ''
    }
  }

  async componentDidMount() {
    const UserData = await FWApiClient.get().getCurrentPerson()
    let filteredUserData = _.pick(UserData, this.state.toPick)

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
      console.log(checked)
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
    this.setState({
      userData: userData,
      curStatus: (this.state.curStatus != 'error') ? '' : 'error'
    })
  }

  updateYear(event: any): void {
    let userData = _.cloneDeep(this.state.userData);
    userData.birth_year = parseInt(event.target.value);
    this.setState({
      userData: userData,
      curStatus: (this.state.curStatus != 'error') ? '' : 'error'
    })
  }

  removeFromDemographicIds(id: number): void {
    let userData = _.cloneDeep(this.state.userData)
    userData.demographic_ids = _.filter(userData.demographic_ids, (o) => {
      return o != id
    })
    this.setState({
      userData: userData,
      curStatus: (this.state.curStatus != 'error') ? '' : 'error'
    })
  }

  render() {
    let elems = Filters.filters.map((filter) => {
      return <DemographicOption updateYear={this.updateYear.bind(this)} 
                                handleClick={this.handleClick.bind(this)} 
                                userData={this.state.userData} filter={filter}/>
    })

    const displayGroup = (this.state.curStatus == '') ? 'none' : 'block'

    return (
      <Row style={{border:'1px solid #e9e9e9', borderRadius:'10px', padding:'20px'}}> 
        <Col xs={12}>
        {elems}
        </Col>
        <Col xs={12}>
        <Button onClick={this.updateUserInfo.bind(this)} style={{backgroundColor:'lightblue', width:'100%'}}>Submit</Button>
        <ListGroup style={{display: displayGroup, textAlign:'center'}}>
          <ListGroupItem bsStyle="success" 
                    style={{display: (this.state.curStatus == 'success') ? 'block' : 'none'}}>
                    Successfully saved changes!
                    </ListGroupItem>
          <ListGroupItem bsStyle="danger" 
                    style={{display: (this.state.curStatus == 'error') ? 'block' : 'none'}}>
                    Error while trying to save changes. Please check your connection.
                    </ListGroupItem>
        </ListGroup>
        </Col>
      </Row>
    )
  }
}

export class DemographicOption extends Component {
  render() {
    let elems;
    if (this.props.userData) {
      if (this.props.filter.name == 'age') {
        let value = this.props.userData.birth_year
        elems = <input onChange={this.props.updateYear} value={value} type="number"/> // can we use type="number"?
      } else if (this.props.filter.name == 'country') {
        //tk
      } else {
        elems = this.props.filter.options.map((opt: string, key: number) => {
          let val = _.find(DemographicKeys.demographic_keys, (o: DemographicDictionary) => {
            return o.name == opt
          })

          let checked = false;
          if (val) {
            checked = (_.indexOf(this.props.userData.demographic_ids, val.id) > -1)
          }

          return <div key={key} className="custom-option">
                      <Button href="#" 
                      active={checked}
                      name={this.props.filter.name}
                      onClick={this.props.handleClick.bind(this, !checked)}>
                      {opt}
                      </Button>
                  </div>
        })
      }
    }

    return (
      <Row>
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          {elems}
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
