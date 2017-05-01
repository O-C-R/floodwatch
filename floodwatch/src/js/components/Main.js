// @flow
import React, {Component} from 'react';
import {Grid, Nav, Navbar, NavItem, Row, Col, Button, Alert} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

import '../../css/app.css';

import history from '../common/history';
import {FWApiClient} from '../api/api';

import {Navigation} from './Navigation';

const chrome = window.chrome;

type MainState = {
  user: ?Object,
  message: ?string,
  messageClearTimeout: ?number,
  extensionInstalled: boolean,
  extensionInstallMsgDismissed: boolean
};

export class Main extends Component {
  state: MainState;

  constructor() {
    super();

    this.state = {
      user: null,
      message: null,
      messageClearTimeout: null,
      extensionInstalled: false,
      extensionInstallMsgDismissed: false
    };

    this.loadUserFromServer();
    this.detectExtension();
  }

  async loadUserFromServer(): Promise<void> {
    try {
      const user = await FWApiClient.get().getCurrentPerson()
      this.setState({ user: user });
    } catch (e) {
      this.setState({ user: null });
    }
  }

  detectExtension(): void {
    const hasExtension = () => {
      if (document.body.getAttribute('data-fw-frame-id') != null) {
        setTimeout(() => this.setState({ extensionInstalled: true }), 1);
      } else {
        setTimeout(hasExtension, 100);
      }
    }
    hasExtension();
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

  installClick() {
    chrome.webstore.install(
      "https://chrome.google.com/webstore/detail/oiilbnnfccienlfahiecfglojnkhpgaf",
      () => { this.setState({ extensionInstalled: true }) },
      (err) => { console.error(err); }
    );
  }

  dismissInstallClick() {
    this.setState({ extensionInstallMsgDismissed: true });
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

    const navElem = (window.location.pathname !== "/generate") ? <Navigation navs={navs} /> : null;

    return (
      <Grid fluid style={{position:'relative'}}>
        <Row id="row-top">
          { this.state.message && <Alert bsStyle="info">{this.state.message}</Alert> }
          { this.state.user && !this.state.message && !this.state.extensionInstalled && !this.state.extensionInstallMsgDismissed &&
            <Alert bsStyle="info" className="text-center" onDismiss={this.dismissInstallClick.bind(this)}>
              <span style={{ paddingRight: '10px' }}>Install the extension to get started</span>
              <Button bsStyle="primary" bsSize="small" onClick={this.installClick.bind(this)}>Add to Chrome</Button>
          </Alert> }
          {navElem}
        </Row>
        <Row>
          {this.props.children && React.cloneElement(this.props.children, {
            showMessage: this.showMessage.bind(this),
            loginChanged: this.loadUserFromServer.bind(this),
            handleLogout: this.handleLogout.bind(this),
            user: this.state.user
           })}
         </Row>
      </Grid>
    );
  }
}
