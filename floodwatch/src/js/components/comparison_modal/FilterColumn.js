// @flow

import React from 'react';

import OptionDropdown from './OptionDropdown';
import CountrySelector from './CountrySelector';
import AgeSelector from './AgeSelector';

import CategoryLogicSelector from './CategoryLogicSelector';
import {
  filterItemByName,
  availableCategoryNames,
  assignDemographics,
  impersonalFilter,
} from '../../common/comparisontools';

import type {
  FilterLogic,
  PersonResponse,
  FilterRequestItem,
} from '../../api/types';
import type { DemographicCategoriesJSON } from '../../common/types';

const DEMOGRAPHIC_CATEGORIES: DemographicCategoriesJSON = require('../../../data/demographic_categories.json');

type Props = {|
  isCustom: boolean,
  userData: PersonResponse,
  sentence: string,
  filter: FilterRequestItem,
  onSelectCustom: () => void,
  onSelectPreset: (filter: FilterRequestItem) => void,
  onChangeCustom: (filter: FilterRequestItem) => void,
|};

const DemographicOption = ({
  filter,
  categoryName,
  enabled,
  onChange,
}: {
  filter: FilterRequestItem,
  categoryName: string,
  enabled: boolean,
  onChange: (filter: FilterRequestItem) => void,
}) => (
  <CategoryLogicSelector
    filterItem={filterItemByName(filter, categoryName)}
    category={DEMOGRAPHIC_CATEGORIES.categories[categoryName]}
    enabled={enabled}
    onChange={(operator: FilterLogic, values: ?Array<number>) => {
      const newFilter = impersonalFilter(
        assignDemographics(filter, categoryName, operator, values),
      );
      onChange(newFilter);
    }} />
);

const CustomOptions = ({
  userData,
  onChange,
  filter,
}: {
  userData: PersonResponse,
  onChange: (filter: FilterRequestItem) => void,
  filter: FilterRequestItem,
}) => {
  // Which categories have we filled out demographics for?
  const categoryNames = availableCategoryNames(userData);

  return (
    <div>
      <AgeSelector
        filter={filter}
        enabled={categoryNames.includes('age')}
        onChange={(f: ?{ min?: number, max?: number }) => {
          const newFilter: FilterRequestItem = impersonalFilter(filter);
          if (f) {
            newFilter.age = f;
          } else {
            delete newFilter.age;
          }
          onChange(newFilter);
        }} />
      <DemographicOption
        filter={filter}
        categoryName="gender"
        enabled={categoryNames.includes('gender')}
        onChange={onChange} />
      <DemographicOption
        filter={filter}
        categoryName="race"
        enabled={categoryNames.includes('race')}
        onChange={onChange} />
      <DemographicOption
        filter={filter}
        categoryName="religion"
        enabled={categoryNames.includes('religion')}
        onChange={onChange} />
      <CountrySelector
        filter={filter}
        enabled={categoryNames.includes('location')}
        onChange={(countryCodes: ?Array<string>) => {
          const newFilter: FilterRequestItem = impersonalFilter(filter);
          if (countryCodes) {
            newFilter.location = { country_codes: countryCodes };
          } else {
            delete newFilter.location;
          }
          onChange(newFilter);
        }} />
    </div>
  );
};

export default (props: Props) => {
  const {
    isCustom,
    filter,
    sentence,
    userData,
    onSelectCustom,
    onSelectPreset,
    onChangeCustom,
  } = props;

  return (
    <div className="comparison-container">
      <OptionDropdown
        isPreset={!isCustom}
        userData={userData}
        sentence={sentence}
        onSelectPreset={onSelectPreset}
        onSelectCustom={onSelectCustom} />
      {isCustom &&
        <CustomOptions
          userData={userData}
          onChange={onChangeCustom}
          filter={filter} />}
    </div>
  );
};
