// @flow

import React, { Component } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import _ from 'lodash'
import Filters from '../../stubbed_data/filter_response.json';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';

import {FWApiClient} from '../api/api';

export class Profile extends Component {

  render() {
    return (
      <Row style={{backgroundColor:"white", borderRadius:"10px", padding:"20px"}}>
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
  constructor() {
    super();
    this.state = {
      userData: {},
      toPick: ["birth_year", "twofishes_id", "demographic_ids"]
    }
  }

  async componentDidMount() {
    const UserData = await FWApiClient.get().getCurrentPerson()
    let filteredUserData = _.pick(UserData, this.state.toPick)

    this.setState({
      userData: filteredUserData
    })
  }

  handleClick(checked, event) {
    let demo = event.target.textContent;
    let demo_id = _.find(DemographicKeys.demographic_keys, (o: string) => {
      return o.name == demo
    })

    if (event.target.name != "age" && event.target.name != "country_code") {
      console.log(checked)
      if (checked) {
        this.addToDemographicIds(demo_id.id)
      } else {
        this.removeFromDemographicIds(demo_id.id)
      }
    }
  }

  async updateUserInfo() {
    const reply = await FWApiClient.get().updatePersonDemographics(this.state.userData)
    console.log("reply",reply)
  }

  addToDemographicIds(id) {
    let userData = _.cloneDeep(this.state.userData);
    userData.demographic_ids.push(id)
    console.log(userData)
    this.setState({
      userData: userData
    })
  }

  removeFromDemographicIds(id) {
    let userData = _.cloneDeep(this.state.userData)
    userData.demographic_ids = _.filter(userData.demographic_ids, (o) => {
      return o != id
    })
    this.setState({
      userData: userData
    })
  }

  render() {
    let elems = Filters.filters.map((filter) => {
      return <DemographicOption handleClick={this.handleClick.bind(this)} userData={this.state.userData} filter={filter}/>
    })


    return (
      <Row style={{border:"1px solid #e9e9e9", borderRadius:"10px", padding:"20px"}}> 
        <Col xs={12}>
        {elems}
        </Col>
        <Col xs={12}>
        <Button onClick={this.updateUserInfo.bind(this)} style={{backgroundColor:"lightblue", width:"100%"}}>Submit</Button>
        </Col>
      </Row>
    )
  }
}

export class DemographicOption extends Component {
  getCurrentUserValue(name) {
    return this.props.userData.name
  }

  render() {
    let elems;
    if (this.props.filter.name == "age" || this.props.filter.name == "country") {
      // let checked = this.props.userData.birth_year
      // elems = <input placeholder={checked} type={this.props.filter.type}/>
    } else {
      elems = this.props.filter.options.map((opt, key) => {
        let val = _.find(DemographicKeys.demographic_keys, (o: string) => {
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