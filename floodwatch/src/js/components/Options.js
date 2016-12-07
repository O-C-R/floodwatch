// @flow
import React, {Component} from 'react';
import { MenuItem, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import Filters from '../../stubbed_data/filter_response.json';
import {CustomFilter} from './CustomFilter'





//-------------------------------------------------------------------------------------------------------------------
export class RegularOptions extends Component {
  render() {
    return (
      <p>Ads seen by {this.props.currentSentence}.</p>
    )
  }
}





//-------------------------------------------------------------------------------------------------------------------
export class CustomOptions extends Component {
  getIndexOfName(name) {
    for (let i = 0; i < this.props.currentSelection.length; i++) {
      if (this.props.currentSelection[i].name == name) {
        return i
      }
    }
    return -1
  }

  handleFilterClick(arg1, arg2, arg3) {
    console.log(arg1.target)
    console.log(arg2.target)
    console.log(arg3.target)
  }

  render() {
    let elems = []
    Filters.filters.map((item) => {
        // check if this category has anything checked in it
        let thisCategorysSelection;
        const index = this.getIndexOfName(item.name);
        if (index > -1) {
            thisCategorysSelection = this.props.currentSelection[index]
        }
        elems.push(<CustomFilter /*shouldBeDisabled={shouldBeDisabled}*/ handleFilterClick={this.props.handleFilterClick} filter={item} mySelection={thisCategorysSelection}/>)
    })

    // for (let i = 0; i < Filters.filters.length; i++) {
    //   let myKey = Filters.filters[i].name;
    //   console.log(myKey)
    //   // let shouldBeDisabled = this.shouldBeDisabled(myKey);
    //   let index = this.getIndexOfName(myKey);
    //   var mySelection;
    //   if (index > -1) {
    //     mySelection = this.props.currentSelection[index]      
    //   }
    //   console.log(index)
    //   console.log(mySelection)
    //   elems.push(<CustomFilter /*shouldBeDisabled={shouldBeDisabled} handleFilterClick={this.props.handleFilterClick}*/ filter={Filters.filters[i]} mySelection={mySelection}/>)
    // }

    return (
      <div className="custom-filter-container">
      {elems}
      </div>
    )
  }
}







//-------------------------------------------------------------------------------------------------------------------
export class OptionDropdown extends Component {

  // shouldBeDisabled(preset) {
  //   console.log(preset)
  //   if (preset.always_available) {
  //     return {
  //       disabled: false,
  //       required: []
  //     }
  //   }

  //   var matches = [];

  //   for (let i = 0; i < preset.filters.length; i++) {
  //     var thisFilter = {
  //       'name': preset.filters[i].name,
  //       'disabled': true
  //     }

  //     var disabled = true;
  //     for (let y = 0; y < UserInfo.settings.length; y++) {
  //       console.log(UserInfo.settings[y].name)
  //       if (preset.filters[i].name == UserInfo.settings[y].name) {
  //         thisFilter.disabled = false;
  //       }
  //     }
  //     matches.push(thisFilter)
  //   }

  //   var needed = []

  //   for (let i = 0; i < matches.length; i++) {
  //     if (matches[i].disabled) {
  //       needed.push(matches[i])  
  //     }
  //   }
  //   console.log(needed)

  //   return {
  //     disabled: (needed.length == 0) ? false : true,
  //     required: needed
  //   }
  // }

  render() {
    let elems = [];
    this.props.filterData.presets.map((item) => {
        elems.push(<MenuItem onClick={this.props.handlePresetClick.bind(this, item, this.props.side)}>{item.name}</MenuItem>)
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



  // render() {
  //   let elems = []
  //   for (let i = 0; i < FilterJSON.presets.length; i++) {
  //     var requirements = this.shouldBeDisabled(FilterJSON.presets[i])
  //     console.log('my requirements', requirements)
  //     var myOverlay = <RequireOverlay myKey={i} requirements={requirements.required}/>

  //     if (requirements.disabled == false) {
  //       elems.push(<MenuItem disabled={requirements.disabled} onClick={this.props.handlePresetClick.bind(this, FilterJSON.presets[i].filters)}>{FilterJSON.presets[i].name} {(requirements.disabled) ? '(Requires info)' : '' }</MenuItem>)
  //     } else {
  //       elems.push(
  //         <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={myOverlay}>
  //           <MenuItem disabled={requirements.disabled}>{FilterJSON.presets[i].name} {(requirements.disabled) ? '(Requires info)' : '' }</MenuItem>
  //         </OverlayTrigger>
  //       )
  //     }


  //   }

  //   return (
  //     <ButtonToolbar>
  //       <DropdownButton title={this.props.currentSentence} id="sup">
  //         <MenuItem header> Presets </MenuItem>
  //         {elems}
  //         <MenuItem header> Custom </MenuItem>
  //         <MenuItem onClick={this.props.handleCustomClick}>Make your own filter</MenuItem> 
  //       </DropdownButton>
  //     </ButtonToolbar>

  //   )

  // }

}