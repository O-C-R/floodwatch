// @flow

import React, {Component} from 'react';
import $ from 'jquery';
import { Button, FormGroup, Radio } from 'react-bootstrap';
import _ from 'lodash'

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import FilterResponse from '../../stubbed_data/filter_response.json';

import type {FilterJSON, DisabledCheck, Filter, FilterLogic} from './filtertypes.js'
import type {DemographicDictionary} from './FindInDemographics'
import Autocomplete from 'react-autocomplete';

import {FWApiClient} from '../api/api';

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

  updateSearchLogic(event: any) {
    this.props.updateSearchLogic(event.target.value, event.target.name.split(this.props.side)[1])
  }

  render() {
    let elems = [];

    if (this.props.shouldBeDisabled.disabled) {
      elems.push(`Unlock by adding your ${this.props.filter.name} information to your profile.`)
      return (
        <div className="filter-option">
        <h4>Filter by {this.props.filter.name}</h4>
        <div>
        {elems}
        </div>
        </div>
      )
    }

    let myOptions;
    

    if (this.props.filter.name === 'country') {
      return (
        <div className="filter-option">
        <h4>Filter by {this.props.filter.name} code</h4>
        <p>Use a two-letter country code (e.g. US, FR, DE)</p>
        <div>
        <CountryFilter selection={this.props.mySelection} handleFilterClick={this.props.handleFilterClick}/>
        </div>
        </div>
      )
    } else if (this.props.filter.name === 'age') {
      const age = _.find(FilterResponse.filters, (opt: FilterJSON) => {
        return opt.name == 'age'
      })
      myOptions = _.map(age.options, (opt: string) => {
        return {
          name: opt,
        }
      })
    } else {
      if (this.props.filter.category_id) {
        myOptions = _.filter(DemographicKeys.demographic_keys, (opt: DemographicDictionary) => {
          return opt.category_id === this.props.filter.category_id
        })
      }
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

      elems.push(<div key={i} className="custom-option">
                  <Button href="#" active={checked}
                          disabled={this.props.shouldBeDisabled.disabled}
                          onClick={this.props.handleFilterClick.bind(this, obj, !checked)}
                          name={this.props.filter.name}>
                  {opt.name}
                  </Button>

              </div>)
      
    })

    let select = this.generateLogicSelectors();
    elems.unshift(select)

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
    
    if (this.props.filter.name !== 'age' && this.props.filter.name !== 'country') {
      or = <Radio className="logic-option" checked={logicSelection === 'or'} name={this.props.side + this.props.filter.name} inline readOnly value="or">Any of these</Radio>;
      and = <Radio className="logic-option" checked={logicSelection === 'and'} name={this.props.side + this.props.filter.name} inline readOnly value="and">All of these</Radio>
      nor = <Radio className="logic-option" checked={logicSelection === 'nor'} name={this.props.side + this.props.filter.name} inline readOnly value="nor">None of these</Radio>
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



type LocationStateType = {
  value: string,
  items: Array<Object>,
  highlightedStyle: {
    fontWeight: number
  },
  regularStyle: {
    fontWeight: number
  },
  loading?: boolean,
  isDescriptionOpen: boolean
};

type LocationPropsType = {
  handleFilterClick: (obj: Filter, checked: boolean) => void,
  selection: Filter
};

function setInitialStateLocation(props: LocationPropsType) {
  return {
    value: '',
    items: [],
    highlightedStyle: {
      fontWeight:700
    },
    regularStyle: {
      fontWeight:400
    },
    isDescriptionOpen: false
  }
}



export class CountryFilter extends Component {
  state: LocationStateType;
  props: LocationPropsType;

  constructor(props: LocationPropsType) {
    super(props);
    this.state = setInitialStateLocation(props);
  }

  componentWillReceiveProps(nextProps: LocationPropsType) {
    if (nextProps.selection) {
      this.setState({value: nextProps.selection.choices[0]})
    }
  }

  async updateList(value: string) {
    const val = await FWApiClient.get().getLocationOptions(value);
    if (val.interpretations.length > 0) {
      this.setState({items: val.interpretations, loading: false});
    }
  }

  render() {
    return (
      <div className="profile-page_option panel-body">
        <Autocomplete
          menuStyle={{zIndex: 1000}}
          inputProps={{name:'country', id: 'location-autocomplete', className: 'autocomplete_input form-control'}}
          value={this.state.value}
          items={this.state.items}
          wrapperProps={{className:"autocomplete"}}
          getItemValue={(item) => item.feature.cc}

          onChange={(event, value) => {
            this.setState({ value, loading:true})
            this.updateList(value);
          }}

          onSelect={(value, item) => {
            this.setState({value: value, items: [item]})
            const filterObj = {
              name: 'country',
              choices: [item.feature.cc],
              logic: 'or',
            }
            this.props.handleFilterClick(filterObj, true)
          }}

          renderItem={(item, isHighlighted) => (
            <div className={"autocomplete_options " + (isHighlighted && "current")}>
            {item.feature.cc}
            </div>
          )}
        />
      </div>
    )
  }
}
