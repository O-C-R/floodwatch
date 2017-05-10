// @flow

import React, { Component } from 'react';
import { Link } from 'react-router';
import { Grid, Nav, Navbar, NavItem, Row, Col } from 'react-bootstrap';

import history from '../common/history';
import { FWApiClient } from '../api/api';

type NavigationProps = {
  navs: Array<{ to?: string, name: string, action?: Function }>,
};

type NavigationState = {};

export class Navigation extends Component {
  props: NavigationProps;
  state: NavigationState;

  constructor(props: NavigationProps) {
    super(props);
  }

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
              activeHref={window.location.pathname}
            >
              {this.props.navs.map((nav, key) => (
                <NavItem eventKey={key} key={key} href={nav.to}>
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
