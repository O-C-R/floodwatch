// @flow

import React, { Component } from 'react';
import { Link } from 'react-router';
import { Row, Col } from 'react-bootstrap';

import FWApiClient, { AuthenticationError } from '../api/api';
import history from '../common/history';

type Props = {
  loginChanged: () => void,
  showMessage: (msg: string, timeout: number) => void,
};

type State = {
  username: string,
  password: string,
  error: ?string,
};

export default class Login extends Component {
  props: Props;
  state: State;

  state: State = {
    username: '',
    password: '',
    error: null,
  };

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

    const { showMessage, loginChanged } = this.props;

    try {
      await FWApiClient.get().login(this.state.username, this.state.password);

      showMessage('Logged in!', 2000);
      loginChanged();

      history.push('/compare');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        this.setState({ error: 'Username or password incorrect.' });
      } else {
        this.setState({ error: 'An unknown error occurred.' });
      }
    }
  }

  render() {
    return (
      <Row>
        <Col xs={10} xsOffset={1} md={6} mdOffset={3}>
          {this.state.error &&
            <div className="alert alert-danger" role="alert">
              Login failed. {this.state.error}
            </div>}

          <div className="panel">
            <div className="panel-container">
              <h1>Login</h1>

              <form onSubmit={this.handleSubmit.bind(this)}>
                <div className="form-group">
                  <input
                    type="name"
                    className="form-control"
                    id="username"
                    placeholder="Username"
                    required
                    value={this.state.username}
                    onChange={this.setFormState.bind(this)} />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    required
                    value={this.state.password}
                    onChange={this.setFormState.bind(this)} />
                </div>
                <Row>
                  <Col xs={12} sm={6}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      id="loginInput">
                      Login
                    </button>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="pull-right">
                      <Link to="/forgot_password">Forgot your password?</Link>
                    </div>
                  </Col>
                </Row>
              </form>
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}
