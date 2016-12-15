//@flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import { Row, Col, Button } from 'react-bootstrap';
import {FWApiClient} from '../api/api';
import _ from 'lodash'
import DemographicKeys from '../../stubbed_data/demographic_keys.json';

export class AgeOption extends Component {
  render() {
    let value = (this.props.userData) ? this.props.userData.birth_year : ""
    let elem = <input onChange={this.props.updateYear} value={value} type="number"/> // can we use type="number"?

    return (
      <Row>
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          {elem}
        </Col>
      </Row>
    )
  }
}

export class LocationOption extends Component {
  constructor() {
    super();
    this.state = {
      value: null,
      items: [],
      highlightedStyle: {
        fontWeight:700
      },
      regularStyle: {
        fontWeight:400
      }
    }
  }
  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.userData) {
      this.decodeTwoFishes(nextProps.userData.twofishes_id)    
    }
  }

  async updateList(value) {
    const val = await FWApiClient.get().getLocationOptions(value);
    this.setState({items: val.interpretations, loading: false});
  }

  async decodeTwoFishes(id: string) {
    const place = await FWApiClient.get().getDecodedLocation(id);
    this.setState({
      value: place.interpretations[0].feature.displayName
    })

  }

  render() {
    return (
      <Row style={{marginBottom:"30px"}}>
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          <Autocomplete
            menuStyle={{zIndex: 1000}}
            inputProps={{name:"country", id: "location-autocomplete"}}
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
        </Col>
      </Row>
    )
  }
}

export class DefaultOption extends Component {
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
      <Row>
        <Col xs={12}>
          <h4>{this.props.filter.question}</h4>
          {elems}
        </Col>
      </Row>
    )
  }

}