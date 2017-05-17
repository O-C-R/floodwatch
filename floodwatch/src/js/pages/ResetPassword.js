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

import FWApiClient, { AuthenticationError, APIError } from '../api/api';
import history from '../common/history';

type Props = {
  location: Location,
  loginChanged: () => void,
};
type State = {
  token: string,
  password: string,
  passwordRepeated: string,
  passwordFeedback: ?string,
  error: ?string,
};

export default class ResetPassword extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    const token: ?string = props.location.query.token;
    if (!token) {
      history.push('/');
    }

    this.state = {
      token: token || '',
      password: '',
      passwordRepeated: '',
      passwordFeedback: null,
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

    if (this.state.password != this.state.passwordRepeated) {
      this.setState({ passwordFeedback: 'Passwords do not match.' });
      return;
    }

    try {
      await FWApiClient.get().completePasswordReset(
        this.state.token,
        this.state.password,
      );
    } catch (error) {
      let foundError = false;
      if (error instanceof APIError) {
        const apiError: APIError = error;
        if (apiError.response) {
          const responseStatus = apiError.response.status;
          if (responseStatus == 404) {
            this.setState({
              error: "Your password reset token wasn't found, or that account was deleted.",
            });
            foundError = true;
          } else if (responseStatus == 403) {
            this.setState({
              error: 'Your password reset token expired, you should request another password reset.',
            });
            foundError = true;
          }
        }
      }

      if (!foundError) {
        this.setState({
          error: 'An unknown error occurred, please contact us for more support.',
        });
      }

      return;
    }

    try {
      FWApiClient.get().onLogout();
      this.props.loginChanged();

      history.push('/login');
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <Row>
        <Col xs={12} xsOffset={0} sm={6} smOffset={3}>
          {this.state.error &&
            <div className="alert alert-danger" role="alert">
              {this.state.error}
            </div>}

          <div className="panel">
            <div className="panel-container">
              <h1>Reset Password</h1>

              <form onSubmit={this.handleSubmit.bind(this)}>
                <FormGroup
                  className={this.state.passwordFeedback ? 'has-danger' : ''}>
                  <FormControl
                    type="password"
                    className={
                      this.state.passwordFeedback ? 'form-control-danger' : ''
                    }
                    id="password"
                    placeholder="Password"
                    name="password"
                    required
                    minLength={10}
                    value={this.state.password}
                    onChange={this.setFormState.bind(this)} />
                </FormGroup>
                <FormGroup
                  className={this.state.passwordFeedback ? 'has-danger' : ''}>
                  <FormControl
                    type="password"
                    className={
                      this.state.passwordFeedback ? 'form-control-danger' : ''
                    }
                    id="passwordRepeated"
                    name="passwordRepeated"
                    placeholder="Retype Password"
                    required
                    value={this.state.passwordRepeated}
                    onChange={this.setFormState.bind(this)} />
                  {this.state.passwordFeedback &&
                    <HelpBlock>{this.state.passwordFeedback}</HelpBlock>}
                </FormGroup>
                <button type="submit" className="btn btn-primary">
                  Complete
                </button>
              </form>
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}
