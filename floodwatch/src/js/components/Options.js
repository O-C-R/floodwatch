// @flow

import React, {Component} from 'react';
import { MenuItem, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import Filters from '../../stubbed_data/filter_response.json';
import {CustomFilter} from './CustomFilter'
import {getCategoryKey, getCategoryOfUserVal, shouldPresetBeDisabled, shouldCustomBeDisabled} from './FindInDemographics'
import type {Filter, Preset, PresetsAndFilters, FilterJSON} from './filtertypes.js'
import type {PersonResponse} from '../api/types';
import _ from 'lodash';

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
  handleFilterClick: (obj: Filter, checked: boolean) => void,
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
    let elems = Filters.filters.map((item: FilterJSON, i: number) => {
      let shouldBeDisabled = shouldCustomBeDisabled(item.name, this.props.userData);

      let thisCategorysSelection;
      const index = _.findIndex(this.props.currentSelection, function(selection) {
        return selection.name == item.name;
      })


      if (index > -1) {
        thisCategorysSelection = this.props.currentSelection[index]
      }
      return <CustomFilter key={i} 
                                shouldBeDisabled={shouldBeDisabled} 
                                handleFilterClick={this.props.handleFilterClick} 
                                filter={item} 
                                mySelection={thisCategorysSelection}/>
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
  handlePresetClick: (item: Preset, side: string) => void,
  handleCustomClick: () => void,
  currentSentence: string,
  filterData: PresetsAndFilters,
  userData: PersonResponse
};

export class OptionDropdown extends Component {
  props: OptionDropdownProps

  render() {
    console.log(this.props)
    let elems = this.props.filterData.presets.map((item: Preset, i: number) => {
      let requirements = shouldPresetBeDisabled(this.props.userData, item)
        // tk
        // var myOverlay = <RequireOverlay myKey={i} requirements={requirements.required}/>

        console.log(requirements)

      if (requirements.disabled == false) {
        return <MenuItem key={i} 
                                disabled={requirements.disabled} 
                                onClick={this.props.handlePresetClick.bind(this, item, this.props.side)}>
                                {item.name}
                    </MenuItem>
      } else {
        return <MenuItem key={i} 
                      disabled={requirements.disabled}>
                      {item.name} (Requires info)
            </MenuItem>
        
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