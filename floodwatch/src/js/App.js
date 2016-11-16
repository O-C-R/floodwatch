import React, { Component } from 'react';
import { withRouter, Link } from 'react-router'
import auth from './api/auth.js';
import '../css/App.css';

var AppNavigation =  withRouter( React.createClass({
  render: function() {
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
    )
  }
}))

var App = withRouter( React.createClass({
  getInitialState: function() {
    return {user: null};
  },
  componentDidMount: function() {
    if(auth.loggedIn()){
      this.loadUserFromServer()
    } else {
      this.setState({user: null});
      this.props.router.push('/login')
    }
  },
  loadUserFromServer: function() {
    return auth.get('/api/person/current', null)
      .then((user) => {
        this.setState({user: user});
      })
      .catch((error) => {
        this.setState({user: null});
        this.props.router.push('/login')
      })
  },
  handleLogout: function(loginInfo) {
    auth.logout()
      .then(() => {
        this.setState({user: null});
        this.props.router.push('/login')
      })
  },
  render: function() {
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
}))


export default App;
