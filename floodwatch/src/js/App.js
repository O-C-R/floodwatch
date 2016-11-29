// @flow

import React, { Component } from 'react';
import {Router, Route, IndexRedirect} from 'react-router';

import auth from './api/auth.js';
import history from './common/history';

import {Main} from './components/Main';
import {Register} from './components/Register';
import {Login} from './components/Login';
import Person from './components/Person';
import {Faq} from './components/Faq';
import {Compare} from './components/Compare';


function requireAuth(nextState, replace): void {
  if (!auth.loggedIn()) {
    replace({
      pathname: '/compare',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

export class App extends Component {
  render() {
    return (
      <Router history={history}>
        <Route path="/" component={Main}>
          <IndexRedirect to="/person" />

          <Route path="person" component={Person} onEnter={requireAuth} />
          <Route path="faq" component={Faq} />
          <Route path="compare" component={Compare} />
          <Route path="login" component={Login} />
          <Route path="register" component={Register} />
        </Route>
      </Router>
    );
  }
}
