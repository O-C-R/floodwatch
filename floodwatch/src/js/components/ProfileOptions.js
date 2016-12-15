//@flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import { Row, Col, Button, Well } from 'react-bootstrap';
import {FWApiClient} from '../api/api';
import _ from 'lodash'
import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type {DemographicDictionary} from './FindInDemographics'
import type {PersonDemographics} from '../api/types';
import type {FilterJSON} from './filtertypes'

import '../../css/Profile.css';

// age ------------------------------------------------------------------------------------------------------------------------

type AgePropsType = {
  updateYear: Function,
  userData: PersonDemographics,
  filter: FilterJSON
};

type AgeStateType = {
  isDescriptionOpen: boolean
};

function getInitialStateAge() {
  return {
    isDescriptionOpen: false
  }
}

export class AgeOption extends Component {
  props: AgePropsType;
  state: AgeStateType;

  constructor(props: AgePropsType) {
    super(props);
    this.state = getInitialStateAge();
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility
    })
  }

  render() {
    let value = (this.props.userData) ? this.props.userData.birth_year : ''
    let elem = <input onChange={this.props.updateYear} value={value} type="number"/>
    return (
      <Row className="demographic-category">
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          <div className="input-wrapper">
          {elem}
          </div>
          <br/>
          <Button className="learn-more" bsSize="xsmall" onClick={this.toggleDescriptionVisibility.bind(this)}>Learn more</Button>
          <p style={{
            display: (this.state.isDescriptionOpen)? 'block' : 'none'
          }}>
            <Well bsSize="small">{this.props.filter.why}</Well>
          </p>
        </Col>
      </Row>
    )
  }
}

// location ------------------------------------------------------------------------------------------------------------------------

type LocationStateType = {
  value: string,
  items: Array<Object>,
  highlightedStyle: {
    fontWeight: number
  },
  regularStyle: {
    fontWeight: number
  },
  loading?: boolean,
  isDescriptionOpen: boolean
};

type LocationPropsType = {
  updateLocation: Function,
  handleClick: Function,
  userData: PersonDemographics,
  filter: FilterJSON
};

function setInitialStateLocation() {
  return {
    value: '',
    items: [],
    highlightedStyle: {
      fontWeight:700
    },
    regularStyle: {
      fontWeight:400
    },
    isDescriptionOpen: false
  }
}

export class LocationOption extends Component {
  state: LocationStateType;
  props: LocationPropsType;

  constructor(props: LocationPropsType) {
    super(props);
    this.state = setInitialStateLocation();
  }

  componentWillReceiveProps(nextProps: LocationPropsType) {
    if (nextProps.userData) {
      this.decodeTwoFishes(nextProps.userData.twofishes_id)    
    }
  }

  async updateList(value: string) {
    const val = await FWApiClient.get().getLocationOptions(value);
    this.setState({items: val.interpretations, loading: false});
  }

  async decodeTwoFishes(id: string) {
    const place = await FWApiClient.get().getDecodedLocation(id);
    this.setState({
      value: place.interpretations[0].feature.displayName
    })

  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility
    })
  }

  render() {
    return (
      <Row className="demographic-category">
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          <div className="input-wrapper">
          <Autocomplete
            menuStyle={{zIndex: 1000}}
            inputProps={{name:'country', id: 'location-autocomplete'}}
            value={this.state.value}
            items={this.state.items}
            getItemValue={(item) => item.feature.displayName}

            onChange={(event, value) => {
              this.setState({ value, loading:true})
              this.updateList(value);
            }}

            onSelect={(value, item) => {
              this.setState({value: value, items: [item]})
              this.props.updateLocation(item.feature.longId)
            }}

            renderItem={(item, isHighlighted) => (
              <div style={(isHighlighted) ? this.state.highlightedStyle : this.state.regularStyle}>
              {item.feature.displayName}
              </div>
            )}
          />
          </div>
          <br/>
          <Button className="learn-more" bsSize="xsmall" onClick={this.toggleDescriptionVisibility.bind(this)}>Learn more</Button>
          <p style={{
            display: (this.state.isDescriptionOpen)? 'block' : 'none'
          }}>
            <Well bsSize="small">{this.props.filter.why}</Well>
          </p>
        </Col>
      </Row>
    )
  }
}

// default ------------------------------------------------------------------------------------------------------------------------

type DefaultStateType = {
  isDescriptionOpen: boolean
};

function getInitialStateDefault() {
  return {
    isDescriptionOpen: false
  }
}

export class DefaultOption extends Component {
  state: DefaultStateType

  constructor() {
    super();
    this.state = getInitialStateDefault();
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility
    })
  }

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
                      <Button
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
      <Row className="demographic-category">
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          {elems}

          <br/>
          <Button className="learn-more" bsSize="xsmall" onClick={this.toggleDescriptionVisibility.bind(this)}>Learn more</Button>
          <p style={{
            display: (this.state.isDescriptionOpen)? 'block' : 'none'
          }}>
            <Well bsSize="small">{this.props.filter.why}</Well>
          </p>
        </Col>
      </Row>
    )
  }

}
