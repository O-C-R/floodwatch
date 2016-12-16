// @flow

import React, {Component} from 'react';
import $ from 'jquery';
import { Button, FormGroup, Radio } from 'react-bootstrap';
import _ from 'lodash'

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import FilterResponse from '../../stubbed_data/filter_response.json';

import type {FilterJSON, DisabledCheck, Filter, FilterLogic} from './filtertypes.js'
import type {DemographicDictionary} from './FindInDemographics'

type PropType = {
  handleFilterClick: (obj: Filter, checked: boolean) => void,
  updateSearchLogic: (logic: FilterLogic, filtername: string) => void,
  filter: FilterJSON,
  shouldBeDisabled: DisabledCheck,
  mySelection: Filter,
  side: string
};

export class CustomFilter extends Component {
  props: PropType;

  constructor(props: PropType) {
    super(props);
  }

  updateSearchLogic(event: any) {
    this.props.updateSearchLogic(event.target.value, event.target.name.split(this.props.side)[1])
  }

  render() {
    let elems = [];
    let myOptions;

    if (this.props.filter.category_id) {
      myOptions = _.filter(DemographicKeys.demographic_keys, (opt: DemographicDictionary) => {
        return opt.category_id == this.props.filter.category_id
      })
    }

    if (this.props.filter.name == 'age') { // age has a slightly different structure
      const age = _.filter(FilterResponse.filters, (opt: FilterJSON) => {
        return opt.name == 'age'
      })
      myOptions = _.map(age[0].options, (opt: string) => {
        return {
          name: opt,
        }
      })
    }

    _.forEach(myOptions, (opt: DemographicDictionary, i: number) => {

      const obj = {
        'name': this.props.filter.name,
        'choices': [opt.name],
        'logic': (this.props.mySelection) ? this.props.mySelection.logic : 'or'
      }

      let checked = false;
      if (this.props.mySelection) {
        if ($.inArray(opt.name, this.props.mySelection.choices) > -1) {
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
                    {opt.name}
                    </Button>

                </div>)
      }
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

  generateLogicSelectors(): React$Element<*> {
    const logicSelection = (this.props.mySelection) ? this.props.mySelection.logic : 'or'

    let or, and, nor;
    or = <Radio className="logic-option" checked={logicSelection == 'or'} name={this.props.side + this.props.filter.name} inline readOnly value="or">Any of these</Radio>;
    if (this.props.filter.name != 'age') {
      and = <Radio className="logic-option" checked={logicSelection == 'and'} name={this.props.side + this.props.filter.name} inline readOnly value="and">All of these</Radio>
      nor = <Radio className="logic-option" checked={logicSelection == 'nor'} name={this.props.side + this.props.filter.name} inline readOnly value="nor">None of these</Radio>
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
