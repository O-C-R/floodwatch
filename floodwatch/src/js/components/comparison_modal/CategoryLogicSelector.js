// @flow

import React, { Component } from 'react';
import { Button, FormGroup, Radio, Well } from 'react-bootstrap';
import _ from 'lodash';

import type { FilterLogic, DemographicFilterItem } from '../../api/types';
import type { DemographicCategory } from '../../common/types';

type Props = {
  filterItem: ?DemographicFilterItem,
  category: DemographicCategory,
  enabled: boolean,
  onChange: (operator: FilterLogic, values: ?Array<number>) => void,
};

export default class CategoryLogicSelector extends Component {
  props: Props;
  state: {
    operator: FilterLogic,
    values: Array<number>,
  };
  operatorGroupName: string;

  constructor(props: Props) {
    super(props);
    this.operatorGroupName = _.uniqueId('category_logic_');
    this.state = {
      operator: props.filterItem ? props.filterItem.operator : 'and',
      values: props.filterItem ? props.filterItem.values : [],
    };
  }

  onOperatorChange(e: SyntheticInputEvent): void {
    const { onChange } = this.props;
    const { values } = this.state;

    const newOp: FilterLogic = ((e.target.value: any): FilterLogic);

    this.setState({ operator: newOp });
    onChange(newOp, values);
  }

  onOptionToggle(optionId: number): void {
    const { onChange } = this.props;
    const { values, operator } = this.state;

    const idx = values.indexOf(optionId);
    if (idx >= 0) {
      values.splice(idx, 1);
    } else {
      values.push(optionId);
    }

    this.setState({ values });
    onChange(operator, values);
  }

  render() {
    const { filterItem, category, enabled } = this.props;

    return (
      <div className="filter-option">
        <h4>Filter by {category.name}</h4>
        <div>
          <Well bsSize="small">
            Show me people who chose
            {' '}
            <FormGroup
              bsClass="m-0"
              onChange={this.onOperatorChange.bind(this)}>
              <Radio
                bsClass="logic-option"
                checked={filterItem && filterItem.operator === 'or'}
                value="or"
                inline
                name={this.operatorGroupName}
                disabled={!enabled}>
                any
              </Radio>
              <Radio
                bsClass="logic-option"
                checked={filterItem && filterItem.operator === 'and'}
                value="and"
                inline
                name={this.operatorGroupName}
                disabled={!enabled}>
                all
              </Radio>
              <Radio
                bsClass="logic-option"
                checked={filterItem && filterItem.operator === 'nor'}
                value="nor"
                inline
                name={this.operatorGroupName}
                disabled={!enabled}>
                none
              </Radio>
            </FormGroup>
            {' '}
            of the following
          </Well>
          {category.options &&
            category.options.map((o) => {
              const checked = filterItem && filterItem.values.includes(o.id);

              return (
                <div
                  key={o.id}
                  className={`custom-option checkbox ${checked ? 'checked' : ''}`}>
                  <Button
                    href="#"
                    active={checked}
                    onClick={() => this.onOptionToggle(o.id)}
                    disabled={!enabled}>
                    {o.name}
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
    );
  }
}
