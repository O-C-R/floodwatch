// @flow

import React, {Component} from 'react';
import {RegularOptions, OptionDropdown, CustomOptions} from './Options'
import type {PersonResponse} from '../api/types';
import type {PresetsAndFilters, Filter, Preset} from './filtertypes';

type PropsType = {
    filterData: PresetsAndFilters,
    userData: PersonResponse,
    currentSentence: string,
    handlePresetClick: (side: string, info: Preset) => void,
    side: string,
    handleCustomClick: () => void,
    handleFilterClick: (event: Event, obj: Filter) => void,
    currentSelection: Array<Filter>
};


export class ModalSegment extends Component {
  props: PropsType;
  constructor(){
    super();
  }

  render() {
    var elem;
    if (!this.props.isCustom) {
      elem = <RegularOptions currentSentence={this.props.currentSentence}/>
    } else {
      elem = <CustomOptions userData={this.props.userData} handleFilterClick={this.props.handleFilterClick} currentSelection={this.props.currentSelection}/>
    }

    return (
      <div className="comparison-container">
      <OptionDropdown userData={this.props.userData} filterData={this.props.filterData} currentSentence={this.props.currentSentence} handlePresetClick={this.props.handlePresetClick.bind(this, this.props.side)} side={this.props.side} handleCustomClick={this.props.handleCustomClick}/>
      {elem}
      </div>
    )
  }
}
