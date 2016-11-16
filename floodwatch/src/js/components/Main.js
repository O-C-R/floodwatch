// @flow

import React, {Component} from 'react';
import {Link} from 'react-router';

import '../../css/App.css';

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
}

export class Main extends Component {
  state: MainState;

  constructor() {
    super();

    this.state = {
      user: null
    };
  }

  componentDidMount() {
    if(auth.loggedIn()){
      this.loadUserFromServer()
    } else {
      this.setState({user: null});
      this.props.router.push('/login')
    }
  }

  loadUserFromServer() {
    return auth.get('/api/person/current', null)
      .then((user) => {
        this.setState({user: user});
      })
      .catch((error) => {
        this.setState({user: null});
        this.props.router.push('/login')
      })
  }

  handleLogout() {
    auth.logout()
      .then(() => {
        this.setState({user: null});
        this.props.router.push('/login')
      })
  }

  render() {
    return (
      <div className="container">
        {(() => {
          if(this.state.user) {
            return (
              <div>
                <div className="row">
                  <div className="col-md-12">
                    <small>
                      User <strong>{this.state.user.username}</strong> logged in. <a href="#" onClick={this.handleLogout}>Log out</a>.
                    </small>
                     <hr />
                  </div>
                </div>
                <AppNavigation navs={[{name:"User", to:"/user"},{name:"Upload", to:"/upload"}]} />
              </div>
            )
          } else {
            return (
              <div>
                <div className="row">
                  <div className="col-md-12">
                    <small>
                      Please <Link to='/register'>register</Link> or <Link to='/login'>login</Link> to continue.
                    </small>
                     <hr />
                  </div>
                </div>
                <AppNavigation navs={[{name:"Register", to:"/register"}, {name:"Login", to:"/login"}]} />
              </div>
            )
          }
        })()}
        {this.props.children && React.cloneElement(this.props.children, {
          loadUserFromServer: this.loadUserFromServer,
          user: this.state.user
        })}
      </div>
    );
  }
}
