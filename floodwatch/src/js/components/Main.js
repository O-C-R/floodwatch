// @flow

import React, {Component} from 'react';
import {Link} from 'react-router';

import '../../css/App.css';

import history from '../common/history';
import auth from '../api/auth';

export class AppNavigation extends Component {
  render() {
    return (
      <div className="row">
        <div className="col-md-12">
          <ul className="nav nav-tabs">
            {this.props.navs.map((nav, key) => {
              return (
                <li className="nav-item" key={key}>
                  <Link to={nav.to} className="nav-link" activeClassName="nav-link active">{nav.name}</Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    );
  }
}

type MainState = {
  user: ?Object;
  message: ?string;
}

export class Main extends Component {
  state: MainState;

  constructor() {
    super();

    this.state = {
      user: null,
      message: null
    };

    this.loadUserFromServer();
  }

  loadUserFromServer() {
    return auth.get('/api/person/current', null)
      .then((user) => {
        this.setState({ user: user });
      })
      .catch((error) => {
        this.setState({ user: null });
        history.push('/login');
      })
  }

  showMessage(message: string) {
    this.setState({ message });
  }

  async handleLogout() {
    await auth.logout();
    this.setState({ user: null });
    history.push('/login');
  }

  loggedInHeader(user: Object) {
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <small>
              User <strong>{user.username}</strong> logged in. <a href="#" onClick={this.handleLogout.bind(this)}>Log out</a>.
            </small>
             <hr />
          </div>
        </div>
        <AppNavigation navs={[{name:"User", to:"/user"},{name:"Upload", to:"/upload"}]} />
      </div>
    );
  }

  loggedOutHeader() {
    return (
      <AppNavigation navs={[{name:"Register", to:"/register"}, {name:"Login", to:"/login"}]} />
    );
  }

  render() {
    return (
      <div className="container">
        {this.state.message && <div className="alert alert-info">{this.state.message}</div>}
        {this.state.user && this.loggedInHeader(this.state.user)}
        {!this.state.user && this.loggedOutHeader()}

        {this.props.children && React.cloneElement(this.props.children, {
          showMessage: this.showMessage.bind(this),
          loginChanged: this.loadUserFromServer.bind(this),
          user: this.state.user
        })}
      </div>
    );
  }
}
