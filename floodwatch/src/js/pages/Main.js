// @flow
import React, { Component } from 'react';
import { Grid, Row, Button, Alert } from 'react-bootstrap';
import log from 'loglevel';

import '../../css/app.css';

import history from '../common/history';
import FWApiClient from '../api/api';

import Navigation from '../components/Navigation';

const chrome = window.chrome;

type Props = {
  children: any,
};

type State = {
  user: ?Object,
  message: ?string,
  messageClearTimeout: ?number,
  extensionInstalled: boolean,
  extensionInstallMsgDismissed: boolean,
};

export default class Main extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      user: null,
      message: null,
      messageClearTimeout: null,
      extensionInstalled: false,
      extensionInstallMsgDismissed: false,
    };

    this.loadUserFromServer();
    this.detectExtension();
  }

  async loadUserFromServer(): Promise<void> {
    try {
      const user = await FWApiClient.get().getCurrentPerson();
      this.setState({ user });
    } catch (e) {
      this.setState({ user: null });
    }
  }

  detectExtension(): void {
    const hasExtension = () => {
      const body = document.body;

      if (body && body.getAttribute('data-fw-frame-id') != null) {
        setTimeout(() => this.setState({ extensionInstalled: true }), 1);
      } else {
        setTimeout(hasExtension, 100);
      }
    };
    hasExtension();
  }

  showMessage(message: string, timeout?: number) {
    this.setState({ message });

    if (this.state.messageClearTimeout) {
      clearTimeout(this.state.messageClearTimeout);
    }

    if (timeout) {
      const messageClearTimeout = setTimeout(
        () => this.setState({ message: null }),
        timeout,
      );
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
      'https://chrome.google.com/webstore/detail/oiilbnnfccienlfahiecfglojnkhpgaf',
      () => {
        this.setState({ extensionInstalled: true });
      },
      (err) => {
        log.error(err);
      },
    );
  }

  dismissInstallClick() {
    this.setState({ extensionInstallMsgDismissed: true });
  }

  render() {
    const { children } = this.props;

    // Navs have to be designed here because we're passing handleLogout
    const SIGNED_IN_NAVS = [
      { name: 'Compare', to: '/compare' },
      { name: 'My Ads', to: '/myads' },
      { name: 'Profile', to: '/profile' },
      { name: 'FAQ', to: '/faq' },
      { name: 'Logout', to: '/logout', action: this.handleLogout.bind(this) },
    ];

    const SIGNED_OUT_NAVS = [
      { name: 'Home', to: '/' },
      { name: 'Login', to: '/login' },
      { name: 'Register', to: '/register' },
      { name: 'FAQ', to: '/faq' },
    ];

    const navs = this.state.user ? SIGNED_IN_NAVS : SIGNED_OUT_NAVS;

    return (
      <Grid fluid style={{ position: 'relative', height: '100%' }}>
        <Row id="row-top">
          {this.state.message &&
            <Alert bsStyle="info">{this.state.message}</Alert>}
          {this.state.user &&
            !this.state.message &&
            !this.state.extensionInstalled &&
            !this.state.extensionInstallMsgDismissed &&
            <Alert
              bsStyle="info"
              className="text-center"
              onDismiss={this.dismissInstallClick.bind(this)}>
              <span style={{ paddingRight: '10px' }}>
                Install the extension to get started
              </span>
              <Button
                bsStyle="primary"
                bsSize="small"
                onClick={this.installClick.bind(this)}>
                Add to Chrome
              </Button>
            </Alert>}

          <Navigation navs={navs} />
        </Row>
        <Row>
          {children &&
            React.cloneElement(children, {
              showMessage: this.showMessage.bind(this),
              loginChanged: this.loadUserFromServer.bind(this),
              handleLogout: this.handleLogout.bind(this),
              user: this.state.user,
            })}
        </Row>
      </Grid>
    );
  }
}
