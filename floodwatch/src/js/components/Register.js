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

import { FWApiClient, APIError } from '../api/api';
import history from '../common/history';

type State = {
  username: string,
  usernameFeedback: ?string,
  password: string,
  passwordRepeated: string,
  passwordFeedback: ?string,
  email: ?string,
  error: ?string,
};

function initialState() {
  return {
    username: '',
    usernameFeedback: '',
    password: '',
    passwordRepeated: '',
    passwordFeedback: '',
    email: '',
    error: null,
  };
}

type Props = {
  showMessage: (msg: string, timeout?: number) => void,
  loginChanged: () => Promise<void>,
};

export default class Register extends Component {
  props: Props;
  state: State;

  usernameInput: HTMLInputElement;

  constructor(props: Props) {
    super(props);
    this.state = initialState();
  }

  componentDidMount() {
    this.usernameInput.focus();
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

  onPasswordChange(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      const id = e.target.id;
      const val = e.target.value;

      this.setState({ [id]: val });

      if (
        this.state.passwordFeedback &&
        this.state.passwordRepeated === this.state.password
      ) {
        this.setState({ passwordFeedback: '' });
      }
    }
  }

  async handleSubmit(event: Event) {
    event.preventDefault();

    const { showMessage, loginChanged } = this.props;

    if (this.state.password !== this.state.passwordRepeated) {
      this.setState({ passwordFeedback: 'Passwords do not match.' });
      return;
    }

    try {
      await FWApiClient.get().register(
        this.state.username,
        this.state.email,
        this.state.password,
      );
      await FWApiClient.get().login(this.state.username, this.state.password);
      await loginChanged();

      this.setState(initialState());
      showMessage('Registered successfully!', 2000);
      history.push('/register/demographics');
    } catch (error) {
      if (error instanceof APIError) {
        const apiError: APIError = error;
        if (
          apiError.response &&
          error.response.status === 400 &&
          apiError.body
        ) {
          try {
            const errors: Object = JSON.parse(apiError.body);

            this.setState({
              usernameFeedback: errors.username,
              passwordFeedback: errors.password,
              error: '',
            });
          } catch (e) {
            this.setState({ error: apiError.body });
          }
        } else {
          this.setState({
            error: 'A unknown API error occurred, please contact us at floodwatch@ocr.nyc!',
          });
        }
      } else {
        this.setState({
          error: 'A unknown error occurred, please contact us at floodwatch@ocr.nyc!',
        });
      }
    }
  }

  render() {
    return (
      <Col xs={10} xsOffset={1} md={8} mdOffset={2}>
        <div className="panel">
          <div className="panel-container">
            <h1>Signup to use Floodwatch.</h1>

            <Row>
              <Form horizontal onSubmit={this.handleSubmit.bind(this)}>
                {this.state.error &&
                  <Alert bsStyle="danger">
                    <strong>Registration failed.</strong> {this.state.error}
                  </Alert>}
                <FormGroup
                  className={this.state.usernameFeedback ? 'has-danger' : ''}
                >
                  <Col componentClass={ControlLabel} sm={2} xs={12}>
                    <label htmlFor="username">Username</label>
                  </Col>
                  <Col sm={10} xs={12}>
                    <FormControl
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Username"
                      required
                      maxLength="120"
                      pattern="\S{3,}"
                      value={this.state.username}
                      onChange={this.setFormState.bind(this)}
                      ref={(r) => {
                        this.usernameInput = r;
                      }}
                    />
                    {this.state.usernameFeedback &&
                      <HelpBlock>{this.state.usernameFeedback}</HelpBlock>}
                    <small id="usernameHelp" className="form-text text-muted">
                      Usernames cannot contain spaces.
                    </small>
                  </Col>
                </FormGroup>
                <FormGroup className="form-group">
                  <Col componentClass={ControlLabel} sm={2} xs={12}>
                    <label htmlFor="email">Email</label><br />
                  </Col>
                  <Col sm={10} xs={12}>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="Email"
                      value={this.state.email}
                      onChange={this.setFormState.bind(this)}
                    />
                    <small className="form-text text-muted">
                      Optional - for password recovery.
                    </small>
                  </Col>
                </FormGroup>
                <FormGroup
                  className={this.state.passwordFeedback ? 'has-danger' : ''}
                >
                  <Col componentClass={ControlLabel} sm={2} xs={12}>
                    <label htmlFor="password">Password</label>
                  </Col>
                  <Col sm={10} xs={12}>
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
                      onChange={this.onPasswordChange.bind(this)}
                    />
                  </Col>
                </FormGroup>
                <FormGroup
                  className={this.state.passwordFeedback ? 'has-danger' : ''}
                >
                  <Col sm={10} smOffset={2} xs={12}>
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
                      onChange={this.onPasswordChange.bind(this)}
                    />
                    {this.state.passwordFeedback &&
                      <HelpBlock>{this.state.passwordFeedback}</HelpBlock>}
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col sm={10} smOffset={2} xs={12}>
                    <Button
                      type="submit"
                      className="btn btn-primary"
                      id="loginInput"
                    >
                      Register
                    </Button>
                  </Col>
                </FormGroup>
              </Form>
            </Row>
          </div>
        </div>
      </Col>
    );
  }
}
