// @flow

import React, {Component} from 'react';
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
  showMessage: Function
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

      this.setState(initialState());
      this.props.showMessage('Registered successfully! Please log in in the extension.');
      history.push('/login');
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
      <div className="row">
        <div className="col-md-12">
          <h3>Signup to use Floodwatch.</h3>
        </div>
        <div className="col-md-12">
            <form onSubmit={this.handleSubmit.bind(this)}>
              <div className="alert alert-danger" role="alert" style={this.state.error ? {} : {display: 'none'}}>
                <strong>Registration failed.</strong> {this.state.error}
              </div>
              <div className={this.state.usernameFeedback ? 'form-group row has-danger' : 'form-group row'}>
                <label className="col-sm-2 col-form-label" htmlFor="username">Username</label>
                <div className="col-sm-10">
                  <input type="text" className="form-control" id="username" placeholder="Username" required={true}  maxLength="120" pattern="\S{3,}" value={this.state.username} onChange={this.setFormState.bind(this)} ref="username" />
                  {(() => {if(this.state.usernameFeedback){
                    return <div className="form-control-feedback">{this.state.usernameFeedback}</div>
                  }})()}
                  <small id="usernameHelp" className="form-text text-muted">Usernames cannot contain spaces.</small>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-2 col-form-label" htmlFor="email">Email <small className="text-muted">(optional)</small></label>
                <div className="col-sm-10">
                  <input type="email" className="form-control" id="email" placeholder="Email" value={this.state.email} onChange={this.setFormState.bind(this)} />
                </div>
              </div>
              <div className={this.state.passwordFeedback ? 'form-group row has-danger' : 'form-group row'}>
                <label className="col-sm-2 col-form-label" htmlFor="password">Password</label>
                <div className="col-sm-10">
                  <input type="password" className={this.state.passwordFeedback ? 'form-control form-control-danger' : 'form-control'} id="password" placeholder="Password" minLength="10" required={true} value={this.state.password} onChange={this.setFormState.bind(this)} />
                </div>
              </div>
              <div className={this.state.passwordFeedback ? 'form-group row has-danger' : 'form-group row'}>
                <div className="offset-sm-2 col-sm-10">
                  <input type="password" className={this.state.passwordFeedback ? 'form-control form-control-danger' : 'form-control'} id="passwordRepeated" placeholder="Retype Password" required={true} value={this.state.passwordRepeated} onChange={this.setFormState.bind(this)} />
                  {(() => {if(this.state.passwordFeedback){
                    return <div className="form-control-feedback">{this.state.passwordFeedback}</div>
                  }})()}
                </div>
              </div>
              <div className="form-group row">
                <div className="offset-sm-2 col-sm-10">
                  <button type="submit" className="btn btn-primary" id="loginInput">Register</button>
                </div>
              </div>
            </form>
        </div>
      </div>
    );
  }
}
