// @flow

import React, { Component } from 'react';
import { Router, Route, IndexRoute, Redirect } from 'react-router';

import { FWApiClient } from './api/api.js';
import history from './common/history';

import { Main } from './components/Main';

import Register from './components/Register';
import { RegisterDemographics } from './components/RegisterDemographics';
import { Login } from './components/Login';
import { ProfilePage } from './components/Profile';
import { Faq } from './components/Faq';
import { Compare } from './components/Compare';
import Generate from './components/Generate';
import GalleryImage from './components/GalleryImage';
import { Landing } from './components/Landing';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';

function requireNoAuth(nextState, replace): void {
  if (FWApiClient.get().loggedIn()) {
    replace({
      pathname: '/compare',
      state: { nextPathname: nextState.location.pathname },
    });
  }
}

function requireAuth(nextState, replace): void {
  if (!FWApiClient.get().loggedIn()) {
    replace({
      pathname: '/register',
      state: { nextPathname: nextState.location.pathname },
    });
  }
}

export class App extends Component {
  constructor() {
    super();

    const apiHost =
      process.env.REACT_APP_API_HOST ||
      `${window.location.protocol}//${window.location.host}`;
    FWApiClient.setup(apiHost, this.onLogout.bind(this));
  }

  onLogout() {
    history.pushState('/');
  }

  render() {
    return (
      <Router history={history}>
        <Route path="/" component={Main}>
          <IndexRoute component={Landing} />

          <Route path="login" component={Login} onEnter={requireNoAuth} />
          <Route path="faq" component={Faq} />

          <Route path="/register">
            <IndexRoute component={Register} onEnter={requireNoAuth} />
            <Route path="demographics" component={RegisterDemographics} />
          </Route>

          <Route path="/forgot_password" component={ForgotPassword} />
          <Route path="/reset_password" component={ResetPassword} />

          <Route path="compare" component={Compare} onEnter={requireAuth} />

          <Route path="profile" component={ProfilePage} onEnter={requireAuth} />
        </Route>

        {/* Routes for gallery */}
        <Route path="/generate" component={Generate} />
        <Redirect from="/i/:imageSlug" to="/gallery/image/:imageSlug" />
        <Route path="/gallery/image/:imageSlug" component={GalleryImage} />
      </Router>
    );
  }
}
