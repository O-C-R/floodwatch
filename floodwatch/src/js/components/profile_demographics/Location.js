// @flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import { Well } from 'react-bootstrap';

import FWApiClient from '../../api/api';

import type { DemographicCategory } from '../../common/types';

type Props = {
  onUpdate: (val: ?string) => void,
  twofishesId: ?string,
  categoryInfo: DemographicCategory,
};

type State = {
  value: string,
  items: Array<Object>,
  loading: boolean,
  isDescriptionOpen: boolean,
};

export default class LocationOption extends Component {
  state: State;
  props: Props;

  state = {
    value: '',
    items: [],
    loading: false,
    isDescriptionOpen: false,
  };

  componentWillReceiveProps(nextProps: Props) {
    const { twofishesId: oldTwofishesId } = this.props;
    const { twofishesId: newTwofishesId } = nextProps;

    if (oldTwofishesId !== newTwofishesId) {
      if (newTwofishesId) {
        this.decodeTwoFishes(newTwofishesId);
      } else {
        this.setState({ value: '' });
      }
    }
  }

  async updateList(value: string) {
    this.setState({ value, loading: true });

    if (value.length === 0) {
      this.props.onUpdate(null);
      this.setState({ items: [], loading: false });
      return;
    }

    try {
      const val = await FWApiClient.get().getLocationOptions(value);
      this.setState({ items: val.interpretations });
    } finally {
      this.setState({ loading: false });
    }
  }

  async decodeTwoFishes(id: string) {
    const place = await FWApiClient.get().getDecodedLocation(id);

    if (place.interpretations.length > 0) {
      const value = place.interpretations[0].feature.displayName;
      this.setState({ value });
    } else {
      this.setState({ value: '' });
    }
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({ isDescriptionOpen: !curVisibility });
  }

  render() {
    const { categoryInfo } = this.props;
    const { isDescriptionOpen, value, items } = this.state;

    return (
      <div className="profile-page_option panel-body">
        <div className="profile-page_option_header">
          <h4>
            {categoryInfo.question}
            {' '}
            <button
              onClick={this.toggleDescriptionVisibility.bind(this)}
              className={`profile-page_learnmore ${isDescriptionOpen ? 'open' : ''}`}>
              <span className="glyphicon glyphicon-info-sign" />
            </button>
          </h4>
          {categoryInfo.instruction &&
            <p className="profile-page_option_header_instruction">
              {categoryInfo.instruction}
            </p>}
          {isDescriptionOpen && <Well bsSize="small">{categoryInfo.why}</Well>}
        </div>
        <Autocomplete
          menuStyle={{ zIndex: 1000 }}
          inputProps={{
            name: 'country',
            id: 'location-autocomplete',
            className: 'autocomplete_input form-control',
          }}
          value={value}
          items={items}
          wrapperProps={{ className: 'autocomplete' }}
          getItemValue={item => item.feature.displayName}
          onChange={(event, v) => {
            this.updateList(v);
          }}
          onSelect={(v, item) => {
            this.setState({ value: v, items: [item] });
            this.props.onUpdate(item.feature.longId);
          }}
          renderItem={(item, isHighlighted) => (
            <div
              className={`autocomplete_options ${isHighlighted ? 'current' : ''}`}>
              {item.feature.displayName}
            </div>
          )}
          renderMenu={(menuItems, curValue, style) => (
            <div className="items" style={style}>
              {menuItems}
            </div>
          )} />
      </div>
    );
  }
}
