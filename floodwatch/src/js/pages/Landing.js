// @flow

import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import history from '../common/history';

function handleJoinUs() {
  history.push('/register');
}

export default () => (
  <div className="home">
    <div
      className="home_header"
      style={{ backgroundImage: "url('static/img/home-back.png')" }}>
      <Row>
        <Col xs={12} md={10} mdOffset={1}>
          <div className="panel-container">
            <h1 className="home_header_title">Floodwatch</h1>
            <p>
              Floodwatch collects the ads you see as you browse the internet,
              in order to track how advertisers are categorizing and tracking you.
            </p>
            <p>
              Join Floodwatch, and help us create a database of how advertisers
              are targeting their ads, which can be used to uncover discriminatory
              practices in online advertising.
            </p>
            <Button className="btn btn-primary" onClick={handleJoinUs}>
              Join Us
            </Button>
          </div>
        </Col>
      </Row>
    </div>

    <Col xs={12} md={10} mdOffset={1}>
      <div className="panel">
        <div className="panel-body">
          <h2 className="h1">Features</h2>
          <Row>
            <Col xs={4}>
              <img className="demo-image" alt="" src="static/img/ad.png" />
            </Col>

            <Col xs={4}>
              <img className="demo-image" alt="" src="static/img/compare.png" />
            </Col>

            <Col xs={4}>
              <img className="demo-image" alt="" src="static/img/modal.png" />
            </Col>
          </Row>

          <Row>
            <Col xs={4}>
              <p className="text-center">Examine the ads you get served</p>
            </Col>

            <Col xs={4}>
              <p className="text-center">
                Compare your ad breakdown to other users
              </p>
            </Col>

            <Col xs={4}>
              <p className="text-center">
                Explore advertising differences across demographics
              </p>
            </Col>
          </Row>

        </div>
      </div>
    </Col>

    <Col xs={12} md={10} mdOffset={1}>
      <div className="panel">
        <div className="panel-body">
          <h2 className="h1">Why Floodwatch Matters</h2>
          <p>
            We spend hours a day online, and we see ads on every webpage we visit.
            But we don’t have any way of tracking the ads we’re being served — we
            don’t even know how many ads the average person sees in a given day.
          </p>
          <p>
            Currently, advertisers have the power to gather whatever information
            they want about you, mark you as a particular demographic, and tailor
            their marketing strategies to whatever demographic they’ve decided
            you are. This practice can quickly move from neutral to invasive to
            unlawful.
          </p>
          <p>
            Floodwatch gives users a platform to help them understand the volume
            and types of ads they’re being served. Users can also compare their
            ad profile to other demographic groups, in order to paint a more
            detailed picture of how the ad industry is using--and sometimes
            abusing--our information.
          </p>
          <p>With Floodwatch, you can:</p>
          <ul>
            <li>Capture the ads that you see</li>
            <li>Compare your breakdown to other demographics</li>
            <li>Explore advertising differences across demographics</li>
          </ul>
          <p>
            The more demographic information you volunteer, the more tools
            you&apos;ll have to examine and filter ad data. But
            Floodwatch&apos;s core functionality of ad-tracking and
            categorization is available to everyone, regardless of whether they
            donate data.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <h2 className="h1">Safety and Privacy</h2>
          <p>
            Floodwatch has several security mechanisms in place to make sure
            your data is safe and controllable by you:
          </p>
          <ul>
            <li>
              You get to choose how much demographic information you give us.
              The core functionality of Floodwatch--seeing your ad
              breakdown--will always be available to all users.
            </li>
            <li>
              We keep your data secure through the security industry’s best
              practices. Want to check our work? Our code is
              {' '}
              <a
                href="https://github.com/O-C-R/floodwatch"
                rel="noopener noreferrer"
                target="_blank">
                open source
              </a>
              .
            </li>
            <li>
              We vet our researchers, and will make the list of approved
              researchers publicly available.
            </li>
            <li>
              We’ll never sell your data to third parties or advertisers
              (obviously).
            </li>
            <li>
              Done with Floodwatch? You can delete your data whenever you want.
            </li>
          </ul>
          <p>
            Still have questions? Read through our
            {' '}
            <a href="/faq#faq">FAQ</a>
            {' '}
            and
            {' '}
            <a href="/faq#privacy">Privacy Policy</a>
            .
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <p>
            Some users may recognize Floodwatch from its
            {' '}
            <a
              href="https://ocr.nyc/user-focused-tools/2014/06/15/floodwatch/"
              rel="noopener noreferrer"
              target="_blank">
              first version
            </a>
            {' '}
            in 2014. v1 is now deprecated in favor of v2, which will provide
            even better functionality, features, design, and stability for our
            users and researchers. v2 is currently in beta.
          </p>
          <p>
            Floodwatch is still being developed by
            {' '}
            <a href="https://ocr.nyc">The Office for Creative Research</a>
            . Have questions? Email us at
            {' '}
            <a
              href="mailto:floodwatch@ocr.nyc"
              className="underlined"
              target="_top">
              floodwatch@ocr.nyc
            </a>
            .
          </p>
        </div>
      </div>

    </Col>
  </div>
);
