// @flow

import React, { Component } from 'react';
import {Router, Route, IndexRedirect} from 'react-router';

import {FWApiClient} from './api/api.js';
import history from './common/history';

import {Main} from './components/Main';
import {Register} from './components/Register';
import {Login} from './components/Login';
import Person from './components/Person';
import {Faq} from './components/Faq';
import {Compare} from './components/Compare';


function requireAuth(nextState, replace): void {
  if (!FWApiClient.get().loggedIn()) {
    replace({
      pathname: '/register',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

export class App extends Component {
  constructor() {
    super();

    FWApiClient.setup(process.env.REACT_APP_API_HOST || '', this.onLogout.bind(this));
  }

  onLogout() {
    // TODO: redirect to login
  }

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
