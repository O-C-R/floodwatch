// @flow

import React, { Component } from 'react';
import { Col } from 'react-bootstrap';
import Waypoint from 'react-waypoint';
import Modal from 'react-modal';
import FontAwesome from 'react-fontawesome';
import _ from 'lodash';
import moment from 'moment';
import log from 'loglevel';

import FWApiClient from '../api/api';

import type { ImpressionResponseItem } from '../api/types';
import type { AdCategoriesJSON } from '../common/types';

const AD_CATEGORIES: AdCategoriesJSON = require('../../data/ad_categories.json');

type State = {
  impressions: ?(ImpressionResponseItem[]),
  oldest: ?Date,
  requesting: boolean,
  canRequest: boolean,
  modalOpen: boolean,
  selectedImpression: ?ImpressionResponseItem,
  selectedImpressionIdx: ?number,
};

export default class MyAds extends Component {
  state: State;
  keydownListener: (e: KeyboardEvent) => void;

  constructor(): void {
    super();
    this.state = {
      impressions: null,
      oldest: undefined,
      requesting: false,
      canRequest: true,
      modalOpen: false,
      selectedImpression: null,
      selectedImpressionIdx: null,
    };
    this.keydownListener = this.handleKeydown.bind(this);
  }

  componentDidMount() {
    this.requestPage();
    document.addEventListener('keydown', this.keydownListener);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydownListener);
  }

  handleKeydown(e: KeyboardEvent) {
    const { modalOpen, impressions, selectedImpressionIdx } = this.state;

    if (
      modalOpen &&
      selectedImpressionIdx !== null &&
      selectedImpressionIdx !== undefined &&
      impressions !== null &&
      impressions !== undefined
    ) {
      if (e.code === 'ArrowLeft') {
        const newIdx = Math.max(selectedImpressionIdx - 1, 0);
        this.setState({ selectedImpression: impressions[newIdx], selectedImpressionIdx: newIdx });
      } else if (e.code === 'ArrowRight') {
        const newIdx = Math.min(selectedImpressionIdx + 1, impressions.length - 1);
        this.setState({ selectedImpression: impressions[newIdx], selectedImpressionIdx: newIdx });
      }
    }
  }

  async requestPage() {
    const { requesting } = this.state;
    if (requesting) {
      return;
    }

    let { impressions, oldest } = this.state;

    try {
      this.setState({ requesting: true });

      const res = await FWApiClient.get().getImpressionsPaged({
        before: moment(oldest).format(),
      });

      if (!res.impressions || res.impressions.length === 0) {
        this.setState({ canRequest: false });
      }

      if (!impressions) {
        impressions = res.impressions;
      } else {
        impressions.push(...res.impressions);
      }

      const oldestItem = _.minBy(impressions, i => moment(i.timestamp));
      oldest = moment(oldestItem.timestamp).toDate();

      this.setState({ impressions, oldest, requesting: false });
    } catch (e) {
      log.error(e);
      this.setState({ requesting: false });
    }
  }

  selectImpression(im: ImpressionResponseItem, idx: number): void {
    this.setState({ modalOpen: true, selectedImpression: im, selectedImpressionIdx: idx });
  }

  render() {
    const { impressions, requesting, canRequest, modalOpen, selectedImpression } = this.state;

    let selectedUrl = '';
    if (selectedImpression) {
      const url = new URL(selectedImpression.top_url);
      selectedUrl = url.host;
    }

    let selectedTopic = null;
    if (selectedImpression) {
      if (selectedImpression.category_id) {
        const categoryName = AD_CATEGORIES.categories[selectedImpression.category_id].name;

        let categoryScore = null;
        if (selectedImpression.classifier_output.tags) {
          categoryScore = selectedImpression.classifier_output.tags[categoryName];
        }

        if (categoryScore) {
          selectedTopic = `${categoryName} (${(categoryScore * 100).toFixed(0)}% confidence)`;
        } else {
          selectedTopic = categoryName;
        }
      } else {
        selectedTopic = 'Not classified';
      }
    }

    return (
      <Col xs={12} md={10} mdOffset={1}>
        <div className="myads panel">
          {selectedImpression &&
            <Modal
              isOpen={modalOpen}
              contentLabel="Ad detail"
              portalClassName="ad-modal"
              style={{
                content: {
                  top: '50%',
                  left: '50%',
                  right: 'auto',
                  bottom: 'auto',
                  marginRight: '-50%',
                  transform: 'translate(-50%, -50%)',
                },
              }}
              onRequestClose={() => {
                this.setState({ modalOpen: false });
              }}>
              <img
                src={`//images.floodwatch.me/${selectedImpression.ad_id}.png`}
                alt="impression" />
              <div className="seen">
                <a href={selectedImpression.top_url} className="url">
                  {selectedUrl}
                </a>
              </div>
              <div className="details">
                {selectedTopic &&
                  <span className="category">
                    {selectedTopic}{' - '}
                  </span>}
                <span className="time">
                  seen {moment(selectedImpression.timestamp).fromNow()}
                </span>
              </div>
              <button className="close" onClick={() => this.setState({ modalOpen: false })}>
                <FontAwesome name="times" />
              </button>
            </Modal>}
          <div className="panel-container">
            <h1>My Ads</h1>
            <div className="ads-container">
              {impressions &&
                impressions.map((im, idx) => (
                  <button
                    className="ad-container"
                    key={im.id}
                    style={{
                      backgroundImage: `url("//images.floodwatch.me/${im.ad_id}.png")`,
                    }}
                    onClick={() => this.selectImpression(im, idx)}>
                    <span className="sr-only">impression #{idx}</span>
                  </button>
                ))}
            </div>
            <div className="bottom">
              {!requesting && canRequest && <Waypoint onEnter={this.requestPage.bind(this)} />}
              {requesting && <FontAwesome name="cog" spin />}
              {!canRequest && <FontAwesome name="check" />}
            </div>
          </div>
        </div>
      </Col>
    );
  }
}
