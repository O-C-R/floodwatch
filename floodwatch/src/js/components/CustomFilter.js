// @flow

import React, {Component} from 'react';
import $ from 'jquery';
import { Button, FormGroup, Radio } from 'react-bootstrap';
import _ from "lodash"

import type {FilterJSON, DisabledCheck, Filter} from './filtertypes.js'


type PropType = {
  handleFilterClick: (obj: Filter, checked: boolean) => void,
  updateSearchLogic: (logic: string, filtername: string) => void,
  filter: FilterJSON,
  shouldBeDisabled: DisabledCheck,
  mySelection: Filter,
  side: string
};

export class CustomFilter extends Component {
  props: PropType;
  state: StateType;

  constructor(props: PropType) {
    super(props);
  }

  updateSearchLogic(event: any) {
    this.props.updateSearchLogic(event.target.value, event.target.name.split(this.props.side)[1])
  }

  render() {
    let elems = [];

    _.forEach(this.props.filter.options, (opt: string, i: number) => {
      const obj = {
        'name': this.props.filter.name,
        'choices': [opt],
        'logic': (this.props.mySelection) ? this.props.mySelection.logic : 'or'
      }
      
      let checked = false;
      if (this.props.mySelection) {
        if ($.inArray(opt, this.props.mySelection.choices) > -1) {
          checked = true;
        }
      }

      let disabled = false;
      if (this.props.shouldBeDisabled.disabled) {
        disabled = true
      }
      if (!disabled) {
        elems.push(<div key={i} className="custom-option">
                    <Button href="#" active={checked}
                            disabled={disabled} 
                            onClick={this.props.handleFilterClick.bind(this, obj, !checked)} 
                            name={this.props.filter.name}>
                    {opt}
                    </Button>
                  
                </div>)
      }
      return
    }) 

    let select = this.generateLogicSelectors();

    if (elems.length == 0) {
      elems.push(`Unlock by adding your ${this.props.filter.name} information to your profile.`)
    } else {
      elems.unshift(select)
    }

    return (
      <div className="filter-option">
      <h4>Filter by {this.props.filter.name}</h4>
      <div>
      {elems}
      </div>
      </div>
    )

  }

  generateLogicSelectors(): Element {
    const logicSelection = (this.props.mySelection) ? this.props.mySelection.logic : 'or' 
    
    let or, and, nor;
    or = <Radio className="logic-option" checked={logicSelection == 'or'} name={this.props.side + this.props.filter.name} inline value="or">Any of these</Radio>;
    if (this.props.filter.name != "age") {
      and = <Radio className="logic-option" checked={logicSelection == 'and'} name={this.props.side + this.props.filter.name} inline value="and">All of these</Radio>
      nor = <Radio className="logic-option" checked={logicSelection == 'nor'} name={this.props.side + this.props.filter.name} inline value="nor">None of these</Radio>
    }

    let select = <div>
                  <p>Show me people who chose</p>
                  <FormGroup onChange={this.updateSearchLogic.bind(this)}>
                    {or}
                    {and}
                    {nor}
                  </FormGroup>
                </div>

    return select
  }

}
