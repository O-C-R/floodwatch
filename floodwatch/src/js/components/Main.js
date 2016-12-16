// @flow
import React, {Component} from 'react';
import {Link} from 'react-router';
import {Grid, Nav, Navbar, NavItem, Row, Col} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

import '../../css/app.css';

import history from '../common/history';
import {FWApiClient} from '../api/api';

type AppNavigationProps = {
  navs: any
};

type AppNavigationState = {
  selectedKey: ?string
};

export class AppNavigation extends Component {
  props: AppNavigationProps;
  state: AppNavigationState;

  constructor(props: AppNavigationProps) {
    super(props);

    let curPath = window.location.pathname;
    let selectedKey = null;
    this.props.navs.map((nav, key) => {
      if (nav.to === curPath) {
        selectedKey = key;
      }
    })

    this.state = { selectedKey }
  }

  handleSelect(selectedKey: string) {
    this.setState({
      selectedKey: selectedKey
    })
  }

  render() {
    return (
      <Navbar collapseOnSelect>
        <div className="container">
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#">Floodwatch</a>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight>
              {this.props.navs.map((nav, key) => {
                return (
                      <LinkContainer to={nav.to}>
                        <NavItem eventKey={key} key={key}>{nav.name}</NavItem>
                      </LinkContainer>
                  )
              })}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Navbar>
    );
  }
}

type MainState = {
  user: ?Object,
  message: ?string
};

export class Main extends Component {
  state: MainState;

  constructor() {
    super();
    this.state = {
      user: null,
      message: null
    };

    this.loadUserFromServer();
  }

  loadUserFromServer() {
    return FWApiClient.get().getCurrentPerson()
      .then((user) => {
        this.setState({ user: user });
      })
      .catch((error) => {
        this.setState({ user: null });
        history.push('/login');
      })
  }

  showMessage(message: string) {
    this.setState({ message });
  }

  async handleLogout() {
    await FWApiClient.get().logout();
    this.setState({ user: null });
    history.push('/login');
  }

  loggedInHeader(user: Object) {
    return (
      <Row>
        <Col>
        <AppNavigation navs={[{name: 'Compare', to: '/compare'}, /*{name: 'My ads', to: '/myads'},{name:'Findings', to:'/findings'},{name:'Research', to:'/research'}, */ {name:'About', to:'/faq'}, {name:'Profile', to:'/profile'}]} />
        </Col>
      </Row>
    );
  }

  loggedOutHeader() {
    return (
      <Row>
      <Col>
      <AppNavigation navs={[{name:'Register', to:'/register'}, {name:'Login', to:'/login'}]} />
      </Col>
      </Row>
    );
  }

  render() {
    return (
      <Grid fluid style={{position:'relative'}}>
        <Row>

                {this.state.message && <div className="alert alert-info">{this.state.message}</div>}
        {this.state.user && this.loggedInHeader(this.state.user)}
        {!this.state.user && this.loggedOutHeader()}
        </Row>
        <Row>
        <Col xs={8} xsOffset={2}>

        {this.props.children && React.cloneElement(this.props.children, {
          showMessage: this.showMessage.bind(this),
          loginChanged: this.loadUserFromServer.bind(this),
          user: this.state.user
        })}
        </Col>
        </Row>
      </Grid>
    );
  }
}
