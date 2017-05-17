// @flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import { Well } from 'react-bootstrap';
import _ from 'lodash';

import FWApiClient from '../api/api';
import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import type { DemographicDictionary } from './FindInDemographics';
import type { PersonDemographics } from '../api/types';
import type { FilterJSON } from '../common/filtertypes';

// age ------------------------------------------------------------------------------------------------------------------------

type AgePropsType = {
  updateYear: Function,
  userData: PersonDemographics,
  filter: FilterJSON,
};

type AgeStateType = {
  isDescriptionOpen: boolean,
};

function getInitialStateAge() {
  return {
    isDescriptionOpen: false,
  };
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
      isDescriptionOpen: !curVisibility,
    });
  }

  render() {
    const value = this.props.userData ? this.props.userData.birth_year : '';
    const elem = (
      <input
        min="0"
        className="form-control text-center"
        onChange={this.props.updateYear}
        value={value}
        placeholder="YYYY"
        type="number" />
    );
    return (
      <div className="profile-page_option panel-body">
        <div className="profile-page_option_header">
          <h4>
            {this.props.filter.question} <a
              onClick={this.toggleDescriptionVisibility.bind(this)}
              className={`profile-page_learnmore ${this.state.isDescriptionOpen ? 'open' : ''}`}>
              <span className="glyphicon glyphicon-info-sign" />
            </a>
          </h4>
          {this.props.filter.instruction &&
            <p className="profile-page_option_header_instruction">
              {this.props.filter.instruction}
            </p>}
          {this.state.isDescriptionOpen &&
            <Well bsSize="small">{this.props.filter.why}</Well>}
        </div>
        {elem}
      </div>
    );
  }
}

// location ------------------------------------------------------------------------------------------------------------------------

type LocationStateType = {
  value: string,
  items: Array<Object>,
  highlightedStyle: {
    fontWeight: number,
  },
  regularStyle: {
    fontWeight: number,
  },
  loading?: boolean,
  isDescriptionOpen: boolean,
};

type LocationPropsType = {
  updateLocation: Function,
  handleClick: Function,
  userData: PersonDemographics,
  filter: FilterJSON,
};

function setInitialStateLocation() {
  return {
    value: '',
    items: [],
    highlightedStyle: {
      fontWeight: 700,
    },
    regularStyle: {
      fontWeight: 400,
    },
    isDescriptionOpen: false,
  };
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
      this.decodeTwoFishes(nextProps.userData.twofishes_id);
    }
  }

  async updateList(value: string) {
    const val = await FWApiClient.get().getLocationOptions(value);
    if (val.interpretations.length > 0) {
      this.setState({ items: val.interpretations, loading: false });
    } else if (value.length == 0) {
      this.props.updateLocation(null);
    }
  }

  async decodeTwoFishes(id: string) {
    const place = await FWApiClient.get().getDecodedLocation(id);
    if (place.interpretations.length > 0) {
      this.setState({
        value: place.interpretations[0].feature.displayName,
      });
    } else {
      this.setState({
        value: '',
      });
    }
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility,
    });
  }

  render() {
    return (
      <div className="profile-page_option panel-body">
        <div className="profile-page_option_header">
          <h4>
            {this.props.filter.question}
            {' '}
            <a
              onClick={this.toggleDescriptionVisibility.bind(this)}
              className={`profile-page_learnmore ${this.state.isDescriptionOpen ? 'open' : ''}`}>
              <span className="glyphicon glyphicon-info-sign" />
            </a>
          </h4>
          {this.props.filter.instruction &&
            <p className="profile-page_option_header_instruction">
              {this.props.filter.instruction}
            </p>}
          {this.state.isDescriptionOpen &&
            <Well bsSize="small">{this.props.filter.why}</Well>}
        </div>
        <Autocomplete
          menuStyle={{ zIndex: 1000 }}
          inputProps={{
            name: 'country',
            id: 'location-autocomplete',
            className: 'autocomplete_input form-control',
          }}
          value={this.state.value}
          items={this.state.items}
          wrapperProps={{ className: 'autocomplete' }}
          getItemValue={item => item.feature.displayName}
          onChange={(event, value) => {
            this.setState({ value, loading: true });
            this.updateList(value);
          }}
          onSelect={(value, item) => {
            this.setState({ value, items: [item] });
            this.props.updateLocation(item.feature.longId);
          }}
          renderItem={(item, isHighlighted) => (
            <div
              className={`autocomplete_options ${isHighlighted && 'current'}`}>
              {item.feature.displayName}
            </div>
          )} />
      </div>
    );
  }
}

// default ------------------------------------------------------------------------------------------------------------------------

type DefaultStateType = {
  isDescriptionOpen: boolean,
};

function getInitialStateDefault() {
  return {
    isDescriptionOpen: false,
  };
}

export class DefaultOption extends Component {
  state: DefaultStateType;

  constructor() {
    super();
    this.state = getInitialStateDefault();
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility,
    });
  }

  render() {
    let elems;
    if (this.props.userData) {
      const myOptions = _.filter(
        DemographicKeys.demographic_keys,
        key => key.category_id === this.props.filter.category_id,
      );
      elems = myOptions.map((opt: DemographicDictionary, key: number) => {
        const val = _.find(
          DemographicKeys.demographic_keys,
          (o: DemographicDictionary) => o.id === opt.id,
        );

        let checked = false;
        if (val) {
          checked = _.indexOf(this.props.userData.demographic_ids, val.id) > -1;
        }

        return (
          <div
            key={key}
            className={`custom-option checkbox ${checked ? 'checked' : ''}`}>
            <label>
              <input
                type="checkbox"
                defaultChecked={checked}
                name={this.props.filter.name}
                onClick={this.props.handleClick.bind(this, !checked, opt.id)} />
              {' '}
              {opt.name}
            </label>
          </div>
        );
      });
    }

    return (
      <div className="profile-page_option panel-body">
        <div className="profile-page_option_header">
          <h4>
            {this.props.filter.question} <a
              onClick={this.toggleDescriptionVisibility.bind(this)}
              className={`profile-page_learnmore ${this.state.isDescriptionOpen ? 'open' : ''}`}>
              <span className="glyphicon glyphicon-info-sign" />
            </a>
          </h4>
          {this.props.filter.instruction &&
            <p className="profile-page_option_header_instruction">
              {this.props.filter.instruction}
            </p>}
          {this.state.isDescriptionOpen &&
            <Well bsSize="small">{this.props.filter.why}</Well>}
        </div>
        {elems}
      </div>
    );
  }
}
