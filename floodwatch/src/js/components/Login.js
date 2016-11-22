// @flow

import React, {Component} from 'react';
import { withRouter } from 'react-router';

import auth from '../api/auth';
import history from '../common/history';

type Props = {
  showMessage: Function,
  loginChanged: Function,
  user: ?Object
}

type State = {
  username: string;
  password: string;
  error: ?string;
}

export class Login extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      error: null
    };

    // this.refs.username.focus();
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
    e.preventDefault();

    try {
      await auth.login(this.state.username, this.state.password);
      this.props.showMessage('Logged in!');
      this.props.loginChanged();

      history.push('/');
    } catch (error) {
      if(error.response) {
        switch(error.response.status){
          case 429:
            this.setState({ error: 'Try again later' });
            break;
          case 401:
            this.setState({error: 'Username or password incorrect.' });
            break;
        }
      } else {
        this.setState({error: 'A server error occurred.' });
      }
    }
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-12">
          <h3>Login.</h3>
          <p></p>
        </div>
        <div className="col-md-12">
            <form onSubmit={this.handleSubmit.bind(this)}>
              <div className="alert alert-danger" role="alert" style={this.state.error ? {} : {display: 'none'}}>
                <strong>Login failed.</strong> {this.state.error}
              </div>
              <div className="form-group">
                <input type="name" className="form-control" id="username" placeholder="Username" required={true} value={this.state.username} onChange={this.setFormState.bind(this)} ref="username" />
              </div>
              <div className="form-group">
                <input type="password" className="form-control" id="password" placeholder="Password" required={true} value={this.state.password} onChange={this.setFormState.bind(this)} />
              </div>
              <button type="submit" className="btn btn-primary" id="loginInput">Login</button>
            </form>
        </div>
      </div>
    )
  }
}
