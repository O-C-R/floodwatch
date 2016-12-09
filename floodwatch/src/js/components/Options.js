// @flow
import React, {Component} from 'react';
import { MenuItem, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import Filters from '../../stubbed_data/filter_response.json';
import {CustomFilter} from './CustomFilter'
import {getCategoryKey, getCategoryOfUserVal, shouldPresetBeDisabled, shouldCustomBeDisabled} from './FindInDemographics'
import type {Filter, PresetsAndFilters} from './filtertypes.js'
import type {PersonResponse} from '../api/types';


//-------------------------------------------------------------------------------------------------------------------
export class RegularOptions extends Component {
  render() {
    return (
      <p>Ads seen by {this.props.currentSentence}.</p>
    )
  }
}

//-------------------------------------------------------------------------------------------------------------------
type CustomOptionsProps = {
    currentSelection: Array<Filter>,
    handleFilterClick: Function,
    userData: PersonResponse
};


export class CustomOptions extends Component {
  props: CustomOptionsProps

  getIndexOfName(name: string): number {
    for (let i = 0; i < this.props.currentSelection.length; i++) {
      if (this.props.currentSelection[i].name == name) {
        return i
      }
    }
    return -1
  }

  render() {
    let elems = []
    Filters.filters.map((item) => {
      let shouldBeDisabled = shouldCustomBeDisabled(this, item.name, this.props.userData);

      let thisCategorysSelection;
      const index = this.getIndexOfName(item.name);
      if (index > -1) {
        thisCategorysSelection = this.props.currentSelection[index]
      }
      elems.push(<CustomFilter shouldBeDisabled={shouldBeDisabled} handleFilterClick={this.props.handleFilterClick} filter={item} mySelection={thisCategorysSelection}/>)
    })

    return (
      <div className="custom-filter-container">
      {elems}
      </div>
    )
  }
}

//-------------------------------------------------------------------------------------------------------------------
type OptionDropdownProps = {
    side: string,
    handlePresetClick: Function,
    handleCustomClick: Function,
    currentSentence: string,
    filterData: PresetsAndFilters
};

export class OptionDropdown extends Component {
    props: OptionDropdownProps

  render() {
    let elems = [];
    this.props.filterData.presets.map((item) => {
      let requirements = shouldPresetBeDisabled(this, item)

        // var myOverlay = <RequireOverlay myKey={i} requirements={requirements.required}/>

      if (requirements.disabled == false) {
        elems.push(<MenuItem disabled={requirements.disabled} onClick={this.props.handlePresetClick.bind(this, item, this.props.side)}>{item.name} {(requirements.disabled) ? '(Requires info)' : '' }</MenuItem>)
      } else {
        elems.push(
              // <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={myOverlay}>
                <MenuItem disabled={requirements.disabled}>{item.name} {(requirements.disabled) ? '(Requires info)' : '' }</MenuItem>
              // </OverlayTrigger>
            )
      }
    })
    return (
        <ButtonToolbar>
         <DropdownButton title={this.props.currentSentence} id="sup">
           <MenuItem header> Presets </MenuItem>
           {elems}
           <MenuItem header> Custom </MenuItem>
           <MenuItem onClick={this.props.handleCustomClick}>Make your own filter</MenuItem> 
         </DropdownButton>
       </ButtonToolbar>
    )

  }
}
