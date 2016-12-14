// @flow
import React, {Component} from 'react';
import {Link} from 'react-router';
import {Grid, Nav, Navbar, NavItem, Row, Col} from 'react-bootstrap';

import '../../css/App.css';

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
      <nav className="navigation">

        <Link className="navigation_logo" to="/"><p>Floodwatch</p></Link>

        <ul className="navigation_items">
          {this.props.navs.map((nav, key) => {
            return (
              <li className="navigation_item" eventKey={key} key={key}><Link className="navigation_item_link" to={nav.to}>{nav.name}</Link></li>
            )
          })}
        </ul>

      </nav>
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
      <AppNavigation navs={[{name: 'Compare', to: '/compare'}, /*{name: 'My ads', to: '/myads'},{name:'Findings', to:'/findings'},{name:'Research', to:'/research'}, */ {name:'About', to:'/faq'}, {name:'Profile', to:'/user'}]} />
    );
  }

  loggedOutHeader() {
    return (
      <AppNavigation navs={[{name:'Register', to:'/register'}, {name:'Login', to:'/login'}]} />
    );
  }

  render() {
    return (
      <div>
        {this.state.message && <div className="alert alert-info">{this.state.message}</div>}
        {this.state.user && this.loggedInHeader(this.state.user)}
        {!this.state.user && this.loggedOutHeader()}

        {this.props.children && React.cloneElement(this.props.children, {
          showMessage: this.showMessage.bind(this),
          loginChanged: this.loadUserFromServer.bind(this),
          user: this.state.user
        })}
      </div>
    );
  }
}
