// @flow

import React, { Component } from 'react';
import { Row, Col, Button, ListGroup, ListGroupItem, Well } from 'react-bootstrap';
import history from '../common/history';

export class Landing extends Component {
  handleJoinUs() {
    history.push('/register');
  }

  render() {
    const divStyle = {
      backgroundImage: "url('static/img/home-back.png')",
    };

    return (
      <div className="home">
        <div className="home_header" style={{backgroundImage: "url('static/img/home-back.png')"}}>
          <Row>
            <Col xs={10} xsOffset={1} md={8} mdOffset={2}>
              <div className="panel-container">
                  <h1 className="home_header_title">Floodwatch</h1>
                  <p>Floodwatch collects the ads you see as you browse the internet, in order to track how advertisers are categorizing and tracking you.</p>
                  <p>Join Floodwatch, and help us create a database of how advertisers are targeting their ads, which can be used to uncover discriminatory practices in online advertising.</p>
                  <Button className="btn btn-primary" onClick={this.handleJoinUs.bind(this)}>Join Us</Button>
            </div>
            </Col>
          </Row>
        </div>


        <Row>
          <Col xs={10} xsOffset={1} md={8} mdOffset={2}>
            <div className="panel">
              <div className="panel-body">
                <h2 className="h1">Why Floodwatch Matters</h2>
                <p>We spend hours a day online, and we see ads on every webpage we visit. But we don’t have any way of tracking the ads we’re being served — we don’t even know how many ads the average person sees in a given day.</p>
                <p>Currently, advertisers have the power to gather whatever information they want about you, mark you as a particular demographic, and tailor their marketing strategies to whatever demographic they’ve decided you are. This practice can quickly move from neutral to invasive to unlawful.</p>
                <p>Floodwatch gives users a platform to help them understand the volume and types of ads they’re being served. Users can also compare their ad profile to other demographic groups, in order to paint a more detailed picture of how the ad industry is using--and sometimes abusing--our information.</p>
                <p>With Floodwatch, you can:</p>
                <ul>
                  <li>Capture the ads that you see</li>
                  <li>See your ad breakdown and the categories of ads you get served</li>
                  <li>Compare your breakdown to other demographics</li>
                  <li>Mark any unusual observations for further investigation</li>
                </ul>
              </div>
            </div>

            <div className="panel">
              <div className="panel-body">
                <h2 className="h1">Safety and Privacy</h2>
                <p>Floodwatch has several security mechanisms in place to make sure your data is safe and controllable by you:</p>
                <ul>
                  <li>You get to choose how much demographic information you give us. The core functionality of Floodwatch--seeing your ad breakdown--will always be available to all users.</li>
                  <li>We keep your data secure through the security industry’s best practices. You can read our latest security audit here.</li>
                  <li>We vet our researchers. You can see the current list of approved researchers here.</li>
                  <li>We’ll never sell your data to third parties or advertisers (obviously).</li>
                  <li>Done with Floodwatch? You can delete your data whenever you want.</li>
                </ul>
                <p>Still have questions? Read through our FAQ and Privacy Policy, or check out our most recent security audit.</p>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

}
