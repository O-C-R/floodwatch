// @flow

import React, { Component } from 'react';
import { Router, Route, IndexRoute, Redirect } from 'react-router';

import FWApiClient from './api/api.js';
import history from './common/history';

import Main from './pages/Main';
import Register from './pages/Register';
import RegisterDemographics from './pages/RegisterDemographics';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import Faq from './pages/Faq';
import Compare from './pages/Compare';
import Generate from './pages/Generate';
import GalleryImage from './pages/GalleryImage';
import MyAds from './pages/MyAds';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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

export default class App extends Component {
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
          <Route path="myads" component={MyAds} onEnter={requireAuth} />

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
