// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory, IndexRedirect } from 'react-router'
import App from './js/App'
import Register from './js/components/Register'
import Login from './js/components/Login'
import Person from './js/components/Person'
import auth from './js/api/auth.js'


function requireAuth(nextState, replace) {
	console.log(auth.loggedIn())
  if (!auth.loggedIn()) {
  	console.log("not logged in")
    replace({
      pathname: '/register',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App} onEnter={App.handleEnter}>
    	<IndexRedirect to="/person" />
      <Route path="person" component={Person} onEnter={requireAuth}>

      </Route>

      <Route path="login" component={Login} />
      <Route path="register" component={Register} />
    </Route>
  </Router>
), document.getElementById('root'))
