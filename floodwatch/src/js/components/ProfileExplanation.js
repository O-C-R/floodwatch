// @flow

import React, { Component } from 'react';
import { Well } from 'react-bootstrap';

export default class ProfileExplanation extends Component {
  state: { isDescriptionOpen: boolean };

  constructor() {
    super();
    this.state = { isDescriptionOpen: false };
  }

  toggleDescriptionVisibility() {
    const curVisibility = this.state.isDescriptionOpen;
    this.setState({
      isDescriptionOpen: !curVisibility,
    });
  }

  render() {
    const { isDescriptionOpen } = this.state;
    return (
      <div>
        <p>
          Donate your data to help us discover discriminatory patterns in
          advertising, and reverse the power relationship between people
          and advertisers.
        </p>
        <p>
          Wondering why your demographic data matters?
          {' '}
          <button
            className={`learnmore ${isDescriptionOpen ? 'active' : ''}`}
            onClick={this.toggleDescriptionVisibility.bind(this)}>
            Learn more
          </button>
        </p>
        {isDescriptionOpen &&
          <Well bsSize="small">
            <p>
              The reason why we ask for demographic information is because
              advertisers base their advertising decisions on what
              demographic they believe you to be--a practice that can easily
              turn discriminatory.
            </p>
            <p>
              Without being able to show advertising trends as experienced by
              large groups, it’s hard to prove that these discriminatory behaviors
              are happening. This is why Floodwatch asks for your demographic data:
              because knowing who’s getting served what ads helps our researchers
              uncover large-scale trends of discriminatory practices. The more
              demographic information you volunteer, the more information our
              researchers have to find these connections.
            </p>
          </Well>}
        <p>Remember, all of this information is completely optional!</p>
      </div>
    );
  }
}
