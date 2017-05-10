// @flow

import React, { Component } from 'react';
import { RegularOptions, OptionDropdown, CustomOptions } from './Options';
import type { PersonResponse } from '../api/types';
import type {
  PresetsAndFilters,
  Filter,
  Preset,
  FilterLogic,
} from './filtertypes';

type PropsType = {
  filterData: PresetsAndFilters,
  userData: PersonResponse,
  currentSentence: string,
  handlePresetClick: (side: string, info: Preset) => void,
  side: string,
  handleCustomClick: () => void,
  handleFilterClick: (obj: Filter, checked: boolean) => void,
  updateSearchLogic: (logic: FilterLogic, filtername: string) => void,
  currentSelection: Array<Filter>,
};

export class ModalSegment extends Component {
  props: PropsType;

  render() {
    let elem;
    if (!this.props.isCustom) {
      elem = <RegularOptions currentSentence={this.props.currentSentence} />;
    } else {
      elem = (
        <CustomOptions
          side={this.props.side}
          userData={this.props.userData}
          handleFilterClick={this.props.handleFilterClick}
          updateSearchLogic={this.props.updateSearchLogic}
          currentSelection={this.props.currentSelection}
        />
      );
    }

    return (
      <div className="comparison-container">
        <OptionDropdown
          userData={this.props.userData}
          filterData={this.props.filterData}
          currentSentence={this.props.currentSentence}
          handlePresetClick={this.props.handlePresetClick.bind(
            this,
            this.props.side,
          )}
          side={this.props.side}
          handleCustomClick={this.props.handleCustomClick}
        />
        {elem}
      </div>
    );
  }
}
