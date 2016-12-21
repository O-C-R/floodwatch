// @flow
import React, {Component} from 'react';
import {Grid, Nav, Navbar, NavItem, Row, Col} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

import '../../css/app.css';

import history from '../common/history';
import {FWApiClient} from '../api/api';

import {Navigation} from './Navigation';

type MainState = {
  user: ?Object,
  message: ?string,
  messageClearTimeout: ?number
};

export class Main extends Component {
  state: MainState;

  constructor() {
    super();
    this.state = {
      user: null,
      message: null,
      messageClearTimeout: null
    };

    this.loadUserFromServer();
  }

  loadUserFromServer(): Promise<void> {
    return FWApiClient.get().getCurrentPerson()
      .then((user) => {
        this.setState({ user: user });
      })
      .catch((error) => {
        this.setState({ user: null });
        history.push('/login');
      })
  }

  showMessage(message: string, timeout?: number) {
    this.setState({ message });

    if (this.state.messageClearTimeout) {
      clearTimeout(this.state.messageClearTimeout);
    }

    if (timeout) {
      const messageClearTimeout = setTimeout(() => this.setState({ message: null }), timeout);
      this.setState({ messageClearTimeout });
    }
  }

  async handleLogout() {
    await FWApiClient.get().logout();
    this.setState({ user: null });
    history.push('/');
  }

  render() {
    // Navs have to be designed here because we're passing handleLogout
    const SIGNED_IN_NAVS = [
      { name: 'Compare', to: '/compare' },
      { name: 'Profile', to: '/profile' },
      { name: 'FAQ', to: '/faq' },
      { name: 'Logout', to: '/logout', action: this.handleLogout.bind(this) }
    ];

    const SIGNED_OUT_NAVS = [
      { name: 'Home', to: '/' },
      { name: 'Login', to: '/login' },
      { name: 'Register', to: '/register' },
      { name: 'FAQ', to: '/faq' }
    ];

    const navs = this.state.user ? SIGNED_IN_NAVS : SIGNED_OUT_NAVS;

    return (
      <Grid fluid style={{position:'relative'}}>
        <Row>
          {this.state.message && <div className="alert alert-info">{this.state.message}</div>}
          <Navigation navs={navs} />
        </Row>
        <Row>
        <Col xs={10} xsOffset={1} md={8} mdOffset={2}>
          {this.props.children && React.cloneElement(this.props.children, {
            showMessage: this.showMessage.bind(this),
            loginChanged: this.loadUserFromServer.bind(this),
            handleLogout: this.handleLogout.bind(this),
            user: this.state.user
          })}
        </Col>
        </Row>
      </Grid>
    );
  }
}
