// @flow

import React, { Component } from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';

import history from '../common/history';

type NavigationProps = {
  navs: Array<{ to?: string, name: string, action?: Function }>,
};

type NavigationState = {};

export default class Navigation extends Component {
  props: NavigationProps;
  state: NavigationState;

  handleSelect(selectedKey: string) {
    const keyNum = parseInt(selectedKey, 10);
    const nav = this.props.navs[keyNum];
    if (nav) {
      if (nav.action) {
        nav.action();
      } else if (nav.to) {
        history.push(nav.to);
      }
    }
  }

  render() {
    return (
      <Navbar collapseOnSelect>
        <div className="container">
          <Navbar.Header>
            <Navbar.Brand>
              <a href="/">Floodwatch</a>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav
              pullRight
              onSelect={this.handleSelect.bind(this)}
              activeHref={window.location.pathname}>
              {this.props.navs.map((nav, key) => (
                <NavItem eventKey={key} key={nav.name} href={nav.to}>
                  {nav.name}
                </NavItem>
              ))}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Navbar>
    );
  }
}
