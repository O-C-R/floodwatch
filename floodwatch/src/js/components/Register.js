// @flow

import React, {Component} from 'react';
import { Col, Row, Button, Form, FormGroup, FormControl, ControlLabel, Alert, HelpBlock } from 'react-bootstrap';

import {FWApiClient} from '../api/api';
import history from '../common/history';

type State = {
  username: string,
  usernameFeedback: ?string,
  password: string,
  passwordRepeated: string,
  passwordFeedback: ?string,
  email: ?string,
  error: ?string
};

function initialState() {
  return {
    username: '',
    usernameFeedback: '',
    password: '',
    passwordRepeated: '',
    passwordFeedback: '',
    email: '',
    error: null
  };
}

type Props = {
  showMessage: (msg: string, timeout?: number) => void,
  loginChanged: () => Promise<void>
};

export class Register extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = initialState();
  }

  setFormState(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      const id = e.target.id;
      const stateChange = {};

      if(e.target.type === 'checkbox') {
        stateChange[id] = e.target.checked ? true : false;
      } else {
        stateChange[id] = e.target.value;
      }
      this.setState(stateChange);
    }
  }

  async handleSubmit(e: Event) {
    e.preventDefault()

    if(this.state.password !== this.state.passwordRepeated) {
      this.setState({passwordFeedback:'Passwords do not match.'})
      return
    }

    try {
      await FWApiClient.get().register(this.state.username, this.state.email, this.state.password);
      await FWApiClient.get().login(this.state.username, this.state.password);
      await this.props.loginChanged();

      this.setState(initialState());
      this.props.showMessage('Registered successfully!', 2000);
      history.push('/register/demographics');
    } catch (error) {
      console.error(error);

      if (error.response && error.response.status === 400) {
        const errors = await error.response.json();

        this.setState({
          usernameFeedback: errors['username'],
          password: '',
          passwordRepeated: '',
          error: ''
        });
      } else {
        this.setState({ error: 'A server error occurred.' })
      }
    }
  }

  componentDidMount() {
    this.refs.username.focus();
  }

  render() {
    return (
      <div className="profile-page panel">
        <div className="panel-container">
          <h1>Signup to use Floodwatch.</h1>

          <Row>
            <Form horizontal onSubmit={this.handleSubmit.bind(this)}>
              { this.state.error &&
                <Alert bsStyle="danger">
                  <strong>Registration failed.</strong> {this.state.error}
                </Alert> }
              <FormGroup className={(this.state.usernameFeedback ? 'has-danger' : '')}>
                <Col componentClass={ControlLabel} sm={2} xs={12}>
                  <label htmlFor="username">Username</label>
                </Col>
                <Col sm={10} xs={12}>
                  <FormControl
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Username"
                    required={true}
                    maxLength="120"
                    pattern="\S{3,}"
                    value={this.state.username}
                    onChange={this.setFormState.bind(this)}
                    ref="username" />
                  { this.state.usernameFeedback &&
                    <FormControl.Feedback>{this.state.usernameFeedback}</FormControl.Feedback> }
                  <small id="usernameHelp" className="form-text text-muted">Usernames cannot contain spaces.</small>
                </Col>
              </FormGroup>
              <FormGroup className="form-group">
                <Col componentClass={ControlLabel} sm={2} xs={12}>
                  <label htmlFor="email">Email</label><br />
                </Col>
                <Col sm={10} xs={12}>
                  <input type="email" className="form-control" id="email" placeholder="Email" value={this.state.email} onChange={this.setFormState.bind(this)} />
                  <small className="form-text text-muted">Optional - for password recovery.</small>
                </Col>
              </FormGroup>
              <FormGroup className={(this.state.passwordFeedback ? 'has-danger' : '')}>
                <Col componentClass={ControlLabel} sm={2} xs={12}>
                  <label htmlFor="password">Password</label>
                </Col>
                <Col sm={10} xs={12}>
                  <FormControl type="password"
                    className={this.state.passwordFeedback ? 'form-control-danger' : ''}
                    id="password"
                    placeholder="Password"
                    name="password"
                    required={true}
                    value={this.state.password}
                    onChange={this.setFormState.bind(this)} />
                </Col>
              </FormGroup>
              <FormGroup className={(this.state.passwordFeedback ? 'has-danger' : '')}>
                <Col sm={10} smOffset={2} xs={12}>
                  <FormControl type="password"
                    className={this.state.passwordFeedback ? 'form-control-danger' : ''}
                    id="passwordRepeated"
                    name="passwordRepeated"
                    placeholder="Retype Password"
                    required={true}
                    value={this.state.passwordRepeated}
                    onChange={this.setFormState.bind(this)} />
                  { this.state.passwordFeedback &&
                    <FormControl.Feedback>{this.state.passwordFeedback}</FormControl.Feedback> }
                </Col>
              </FormGroup>
              <FormGroup>
                <Col sm={10} smOffset={2} xs={12}>
                  <Button type="submit" className="btn btn-primary" id="loginInput">Register</Button>
                </Col>
              </FormGroup>
            </Form>
          </Row>
        </div>
      </div>
    );
  }
}
