// @flow

import React from 'react';
import { Col } from 'react-bootstrap';

import ProfileExplanation from '../components/ProfileExplanation';
import ProfileDemographics
  from '../components/profile_demographics/ProfileDemographics';

const ProfilePage = () => (
  <Col xs={12} md={8} mdOffset={2}>
    <div className="profile-page panel">
      <div className="panel-container">
        <h1>My Profile</h1>
        <ProfileExplanation />
      </div>

      <ProfileDemographics />
      <div className="panel-container">
        <p>
          If you would like to download your data, reset your password, or
          delete your account, please email us at
          {' '}
          <a href="mailto:floodwatch@ocr.nyc">floodwatch@ocr.nyc</a>
        </p>
      </div>
    </div>
  </Col>
);
export default ProfilePage;
