// @flow

import React, { Component } from 'react';
import { Well } from 'react-bootstrap';

import type {
  DemographicCategory,
  DemographicCategoryOption,
} from '../../common/types';

export default class Demographic extends Component {
  props: {
    onUpdate: (toAdd: ?Array<number>, toRemove: ?Array<number>) => void,
    demographicIds: Array<number>,
    categoryInfo: DemographicCategory,
  };
  state: {
    isDescriptionOpen: boolean,
    values: Array<number>,
  };

  state = {
    isDescriptionOpen: false,
  };

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility,
    });
  }

  onCheck(checkboxId: number, isChecked: boolean) {
    const { onUpdate } = this.props;

    if (isChecked) {
      onUpdate([checkboxId], null);
    } else {
      onUpdate(null, [checkboxId]);
    }
  }

  render() {
    const { demographicIds, categoryInfo } = this.props;
    const { options: categoryOptions } = categoryInfo;

    if (!categoryOptions) {
      return <div />;
    }

    const options = categoryOptions.map((o: DemographicCategoryOption) => {
      const checked = demographicIds.includes(o.id);
      const name = `${categoryInfo.name}-${o.name}`;

      return (
        <button
          key={o.id}
          className={`custom-option checkbox ${checked ? 'checked' : ''}`}
          onClick={() => this.onCheck(o.id, !checked)}>
          <label htmlFor={name}>{o.name}</label>
          <input type="checkbox" defaultChecked={checked} />
        </button>
      );
    });

    return (
      <div className="profile-page_option panel-body">
        <div className="profile-page_option_header">
          <h4>
            {categoryInfo.question}
            {' '}
            <button
              onClick={this.toggleDescriptionVisibility.bind(this)}
              className={`profile-page_learnmore ${this.state.isDescriptionOpen ? 'open' : ''}`}>
              <span className="glyphicon glyphicon-info-sign" />
            </button>
          </h4>
          {categoryInfo.instruction &&
            <p className="profile-page_option_header_instruction">
              {categoryInfo.instruction}
            </p>}
          {this.state.isDescriptionOpen &&
            <Well bsSize="small">{categoryInfo.why}</Well>}
        </div>
        {options}
      </div>
    );
  }
}
