// @flow

import React, { Component } from 'react';
import Autocomplete from 'react-autocomplete';
import CountryData from 'country-data';

import type { FilterRequestItem } from '../../api/types';

type Country = {
  name: string,
  alpha2: string,
  alpha3: string,
  status: 'assigned' | 'reserved' | 'user assigned' | 'deleted',
  currencies: Array<string>,
  languages: Array<string>,
  countryCallingCodes: Array<number>,
  ioc: string,
  emoji: string,
};

const COUNTRIES: Array<Country> = CountryData.countries.all.filter(
  c => c.status === 'assigned',
);

function matchCountryToTerm(country: Country, value: string) {
  return (
    country.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 ||
    country.alpha2.toLowerCase().indexOf(value.toLowerCase()) !== -1
  );
}

type State = {
  value: ?string,
  countryCode: ?string,
};

type Props = {|
  onChange: (countryCodes: ?Array<string>) => void,
  filter: FilterRequestItem,
  enabled: boolean,
|};

export default class CountrySelector extends Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);

    const { filter } = props;
    const { location } = filter;

    let countryCodes;
    if (location) {
      countryCodes = location.country_codes;
    }

    this.state = {
      value: countryCodes ? CountryData.countries[countryCodes[0]].name : '',
      countryCode: countryCodes ? countryCodes[0] : null,
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    const { filter } = nextProps;
    const { location } = filter;

    let countryCodes;
    if (location) {
      countryCodes = location.country_codes;
    }

    this.state = {
      value: countryCodes ? CountryData.countries[countryCodes[0]].name : '',
      countryCode: countryCodes ? countryCodes[0] : null,
    };
  }

  render() {
    const { enabled } = this.props;
    const { value } = this.state;

    return (
      <div className="filter-option">
        <h4>Filter by country</h4>
        {enabled &&
          <Autocomplete
            menuStyle={{ zIndex: 1000 }}
            inputProps={{
              name: 'country',
              id: 'location-autocomplete',
              className: 'autocomplete_input form-control',
            }}
            value={value}
            items={COUNTRIES}
            shouldItemRender={matchCountryToTerm}
            sortItems={(a: Country, b: Country) => a.name.localeCompare(b.name)}
            wrapperProps={{ className: 'autocomplete' }}
            getItemValue={(item: Country) => item.name}
            onChange={(e, newValue) => {
              this.setState({ value: newValue });
            }}
            onSelect={(newValue, item: Country) => {
              this.setState({ value: item.name });
              this.props.onChange([item.alpha2]);
            }}
            renderItem={(item: Country, isHighlighted: boolean) => (
              <div
                key={item.alpha2}
                className={`autocomplete_options ${isHighlighted ? 'current' : ''}`}>
                {item.name} ({item.alpha2})
              </div>
            )}
            renderMenu={(items, curValue, style) => (
              <div className="items" style={style}>
                {items}
              </div>
            )} />}
        {!enabled &&
          <div>
            <input
              disabled
              type="text"
              className="autocomplete"
              value="(disabled)" />
          </div>}
      </div>
    );
  }
}
