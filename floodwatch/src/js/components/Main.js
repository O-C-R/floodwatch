// @flow
import React, {Component} from 'react';
import {Link} from 'react-router';
import {Grid, Nav, Navbar, NavItem, Row, Col} from 'react-bootstrap';

import '../../css/App.css';

import history from '../common/history';
import auth from '../api/auth';

type AppNavigationState = {
  selectedKey: ?string
};

export class AppNavigation extends Component {
  state: AppNavigationState;

  constructor(props) {
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

  handleSelect(selectedKey) {
    this.setState({
      selectedKey: selectedKey
    })
  }

  render() {
    return (
      <Navbar collapseOnSelect>
        <Navbar.Header>
          <Navbar.Brand>
            <Navbar.Link href="#"><Navbar.Text>Floodwatch</Navbar.Text></Navbar.Link>
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav pullRight onSelect={this.handleSelect.bind(this)} activeKey={this.state.selectedKey}>
            {this.props.navs.map((nav, key) => {
              return (
                    <NavItem eventKey={key} key={key}><Link to={nav.to}><Navbar.Text>{nav.name}</Navbar.Text></Link></NavItem>
                )
            })}
          </Nav>
        </Navbar.Collapse>
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
    return auth.get('/api/person/current', null)
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
    await auth.logout();
    this.setState({ user: null });
    history.push('/login');
  }

  loggedInHeader(user: Object) {
    return (
      <Row>
        <Col>
        <AppNavigation navs={[{name: 'Compare', to: '/compare'}, /*{name: 'My ads', to: '/myads'},{name:'Findings', to:'/findings'},{name:'Research', to:'/research'}, */ {name:'About', to:'/faq'}, {name:'Profile', to:'/user'}]} />
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
