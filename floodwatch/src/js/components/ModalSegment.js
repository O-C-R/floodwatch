// @flow

import React, {Component} from 'react';
import {RegularOptions, OptionDropdown, CustomOptions} from './Options'

export class ModalSegment extends Component {
  constructor(){
    super();
  }


  render() {
    var elem;
    if (!this.props.isCustom) {
      elem = <RegularOptions currentSentence={this.props.currentSentence}/>
    } else {
      elem = <CustomOptions handleFilterClick={this.props.handleFilterClick} currentSelection={this.props.currentSelection}/>
    }

    return (
      <div className="comparison-container">
      <OptionDropdown filterData={this.props.filterData} currentSentence={this.props.currentSentence} handlePresetClick={this.props.handlePresetClick.bind(this, this.props.side)} handleCustomClick={this.props.handleCustomClick}/>
      {elem}
      </div>
    )
  }
}