// @flow

import React, { Component } from 'react';
import { Form, FormControl } from 'react-bootstrap';

import type { FilterRequestItem } from '../../api/types';

type Props = {|
  filter: ?FilterRequestItem,
  enabled: boolean,
  onChange: (?{ min?: number, max?: number }) => void,
|};

export default class AgeSelector extends Component {
  props: Props;
  state: {
    min: string,
    max: string,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      min: '',
      max: '',
    };

    const { filter } = props;
    if (filter) {
      const { age } = filter;
      if (age) {
        this.state = {
          min: String(age.min || ''),
          max: String(age.max || ''),
        };
      }
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const { filter } = nextProps;
    if (filter) {
      const { age } = filter;
      if (age) {
        this.setState({
          min: String(age.min || ''),
          max: String(age.max || ''),
        });
      } else {
        this.setState({
          min: '',
          max: '',
        });
      }
    } else {
      this.setState({
        min: '',
        max: '',
      });
    }
  }

  onChange(e: SyntheticInputEvent): void {
    const { onChange } = this.props;
    const { min, max } = this.state;

    const targetName = e.target.name;
    const targetValue = e.target.value;
    const newState = { min, max };
    newState[targetName] = targetValue;

    this.setState(newState);
    const { min: newMin, max: newMax } = newState;

    if (newMin.length > 0 && newMax.length > 0) {
      onChange({ min: parseInt(newMin, 10), max: parseInt(newMax, 10) });
    } else if (newMin.length > 0) {
      onChange({ min: parseInt(newMin, 10) });
    } else if (newMax.length > 0) {
      onChange({ max: parseInt(newMax, 10) });
    } else {
      onChange();
    }
  }

  render() {
    const { enabled } = this.props;
    const { min, max } = this.state;

    return (
      <div className="filter-option">
        <h4>Filter by age</h4>
        <Form inline>
          <FormControl
            name="min"
            disabled={!enabled}
            type="number"
            placeholder="(min)"
            value={min}
            onChange={this.onChange.bind(this)} />
          <FormControl
            name="max"
            disabled={!enabled}
            type="number"
            placeholder="(max)"
            value={max}
            onChange={this.onChange.bind(this)} />
        </Form>
      </div>
    );
  }
}
