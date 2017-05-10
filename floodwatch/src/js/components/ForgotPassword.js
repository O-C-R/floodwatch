// @flow

import React, { Component } from 'react';
import {
  Col,
  Row,
  Button,
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  Alert,
  HelpBlock,
} from 'react-bootstrap';
import { Location } from 'react-router';

import { FWApiClient, AuthenticationError, APIError } from '../api/api';
import history from '../common/history';

type Props = {
  location: Location,
};
type State = {
  email: string,
  message: ?string,
  error: ?string,
};

export class ForgotPassword extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      email: '',
      message: null,
      error: null,
    };
  }

  setFormState(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      const id = e.target.id;
      const stateChange = {};

      if (e.target.type === 'checkbox') {
        stateChange[id] = !!e.target.checked;
      } else {
        stateChange[id] = e.target.value;
      }

      this.setState(stateChange);
    }
  }

  async handleSubmit(e: Event) {
    e.preventDefault();

    try {
      await FWApiClient.get().startPasswordReset(this.state.email);
      this.setState({
        message: 'Request to reset password has been received. If your username or email is in our records and has an associated email address, you will receive a link to change your password.',
        error: null,
      });
    } catch (error) {
      let foundError = false;

      if (error instanceof APIError) {
        const apiError: APIError = error;
        if (apiError.response) {
          const responseStatus = apiError.response.status;
          if (responseStatus == 404) {
            this.setState({
              message: null,
              error: 'No account found.',
            });
            foundError = true;
          }
        }
      }

      if (!foundError) {
        this.setState({
          message: null,
          error: 'An unknown error occurred, please contact us for more support.',
        });
      }
    }
  }

  render() {
    const { email, message, error } = this.state;

    return (
      <Row>
        <Col xs={12} xsOffset={0} sm={6} smOffset={3}>
          {error &&
            <div className="alert alert-danger" role="alert">{error}</div>}
          {message &&
            <div className="alert alert-info" role="alert">{message}</div>}

          <div className="panel">
            <div className="panel-container">
              <h1>Forgot Password</h1>

              <form onSubmit={this.handleSubmit.bind(this)}>
                <FormGroup>
                  <FormControl
                    type="email"
                    id="email"
                    name="email"
                    placeholder="email@domain.com"
                    required
                    value={email}
                    onChange={this.setFormState.bind(this)}
                  />
                </FormGroup>
                <button type="submit" className="btn btn-primary">
                  Request password reset
                </button>
              </form>
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}
