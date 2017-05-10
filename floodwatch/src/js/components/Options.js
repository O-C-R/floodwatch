// @flow

import React, { Component } from 'react';
import { MenuItem, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import _ from 'lodash';

import { CustomFilter } from './CustomFilter';
import {
  shouldPresetBeDisabled,
  shouldCustomBeDisabled,
} from './FindInDemographics';

import type {
  Filter,
  FilterLogic,
  Preset,
  PresetsAndFilters,
  FilterJSON,
} from './filtertypes.js';
import type { PersonResponse } from '../api/types';

import Filters from '../../stubbed_data/filter_response.json';

//-------------------------------------------------------------------------------------------------------------------
export class RegularOptions extends Component {
  render() {
    return <p>Ads seen by {this.props.currentSentence}.</p>;
  }
}

//-------------------------------------------------------------------------------------------------------------------
type CustomOptionsProps = {
  currentSelection: Array<Filter>,
  handleFilterClick: (obj: Filter, checked: boolean) => void,
  updateSearchLogic: (logic: FilterLogic, filtername: string) => void,
  userData: PersonResponse,
  side: string,
};

export class CustomOptions extends Component {
  props: CustomOptionsProps;

  render() {
    const elems = Filters.filters.map((item: FilterJSON, i: number) => {
      const shouldBeDisabled = shouldCustomBeDisabled(
        item.name,
        this.props.userData,
      );

      let thisCategorysSelection;
      const index = _.findIndex(
        this.props.currentSelection,
        selection => selection.name === item.name,
      );

      if (index > -1) {
        thisCategorysSelection = this.props.currentSelection[index];
      }
      return (
        <CustomFilter
          key={i}
          side={this.props.side}
          shouldBeDisabled={shouldBeDisabled}
          updateSearchLogic={this.props.updateSearchLogic}
          handleFilterClick={this.props.handleFilterClick}
          filter={item}
          mySelection={thisCategorysSelection} />
      );
    });

    return (
      <div className="custom-filter-container">
        {elems}
      </div>
    );
  }
}

//-------------------------------------------------------------------------------------------------------------------
type OptionDropdownProps = {
  side: string,
  handlePresetClick: (item: Preset, side: string) => void,
  handleCustomClick: () => void,
  currentSentence: string,
  filterData: PresetsAndFilters,
  userData: PersonResponse,
};

export class OptionDropdown extends Component {
  props: OptionDropdownProps;

  render() {
    const elems = this.props.filterData.presets.map(
      (item: Preset, i: number) => {
        const requirements = shouldPresetBeDisabled(this.props.userData, item);
        // tk
        // var myOverlay = <RequireOverlay myKey={i} requirements={requirements.required}/>
        if (requirements.disabled === false) {
          return (
            <MenuItem
              key={i}
              disabled={requirements.disabled}
              onClick={this.props.handlePresetClick.bind(
                this,
                item,
                this.props.side,
              )}>
              {item.name}
            </MenuItem>
          );
        }
        return (
          <MenuItem key={i} disabled={requirements.disabled}>
            {item.name} (Requires profile information)
          </MenuItem>
        );
      },
    );
    return (
      <ButtonToolbar>
        <DropdownButton title={this.props.currentSentence} id="sup">
          <MenuItem header> Presets </MenuItem>
          {elems}
          <MenuItem header> Custom </MenuItem>
          <MenuItem onClick={this.props.handleCustomClick}>
            Make your own filter
          </MenuItem>
        </DropdownButton>
      </ButtonToolbar>
    );
  }
}
