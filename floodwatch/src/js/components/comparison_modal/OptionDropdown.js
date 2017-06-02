// @flow

import React from 'react';
import { MenuItem, ButtonToolbar, DropdownButton } from 'react-bootstrap';

import { extraCategoryNamesRequired } from '../../common/comparisontools';

import type { Preset, FilterPresetsJSON } from '../../common/types';
import type { PersonResponse, FilterRequestItem } from '../../api/types';

const FILTER_PRESETS: FilterPresetsJSON = require('../../../data/filter_presets.json');

type Props = {|
  isPreset: boolean,
  onSelectPreset: (filter: FilterRequestItem) => void,
  onSelectCustom: () => void,
  sentence: string,
  userData: PersonResponse,
|};

const OptionDropdown = ({
  isPreset,
  userData,
  sentence,
  onSelectPreset,
  onSelectCustom,
}: Props) => {
  const elems = FILTER_PRESETS.presets.map((item: Preset) => {
    const categoriesRequired = extraCategoryNamesRequired(
      userData,
      item.filter,
    );
    if (item.always_available || categoriesRequired.length === 0) {
      return (
        <MenuItem
          key={item.name}
          disabled={false}
          onClick={() => {
            onSelectPreset(item.filter);
          }}>
          {item.name}
        </MenuItem>
      );
    }
    return (
      <MenuItem key={item.name} disabled>
        {item.name} (Requires profile information)
      </MenuItem>
    );
  });

  return (
    <div>
      <h4>{sentence}</h4>
      <ButtonToolbar>
        <DropdownButton title={isPreset ? '(preset)' : '(custom)'} id="sup">
          <MenuItem header>Presets</MenuItem>
          {elems}
          <MenuItem header>Custom</MenuItem>
          <MenuItem onClick={onSelectCustom}>
            Make your own filter
          </MenuItem>
        </DropdownButton>
      </ButtonToolbar>
    </div>
  );
};

export default OptionDropdown;
