// @flow

import React, { Component } from 'react';
import { Link } from 'react-router';
import { Row, Col } from 'react-bootstrap';
import moment from 'moment';

import url from 'url';

import { FWApiClient } from '../api/api';
import ChartContainer from './ChartContainer';
import { lowercaseFirstLetter } from '../common/util';

import type { FilterResponse, FilterRequestItem } from '../api/types';
import type { VisibilityMap } from './Compare';

import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
  decodeFilterRequestItem,
} from './comparisontools';
import { Chart } from './Chart';

type Props = {
  params: {
    imageId: string,
  },
};

type State = {
  imageUrl?: string,
  createdAgo?: Date,

  filterA?: FilterRequestItem,
  filterB?: FilterRequestItem,
  dataA?: FilterResponse,
  dataB?: FilterResponse,
  curTopic?: ?string,
  visibilityMap?: VisibilityMap,
  lSentence?: string,
  rSentence?: string,
  sentence?: string,
};

export default class GalleryImage extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {};
    this.init();
  }

  async init() {
    try {
      const imageRes = await FWApiClient.get().getGalleryImage(
        this.props.params.imageId,
      );

      const { url, data, created_at } = imageRes;
      const {
        filter_a: filterA,
        filter_b: filterB,
        data_a: dataA,
        data_b: dataB,
        cur_topic: curTopic,
      } = data;

      const visibilityMap = getVisibilityMap(dataA, dataB);
      const lVal = curTopic ? dataA.categories[curTopic] : 0;
      const rVal = curTopic ? dataB.categories[curTopic] : 0;

      const decodedA = decodeFilterRequestItem(filterA);
      const decodedB = decodeFilterRequestItem(filterB);

      const lSentence = createSentence(decodedA, true);
      const rSentence = createSentence(decodedB, true);

      const sentence = generateDifferenceSentence(
        decodedA,
        decodedB,
        lVal,
        rVal,
        curTopic,
      );

      this.setState({
        imageUrl: url,
        createdAgo: moment(created_at).fromNow(),
        filterA,
        filterB,
        dataA,
        dataB,
        curTopic,
        visibilityMap,
        lSentence,
        rSentence,
        sentence,
      });
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const {
      imageUrl,
      sentence,
      lSentence,
      rSentence,
      curTopic,
      filterA,
      filterB,
      dataA,
      dataB,
      visibilityMap,
      createdAgo,
    } = this.state;
    if (!lSentence || !rSentence) return <div />;

    const title = 'Floodwatch';
    const description = `Comparing ads between ${lowercaseFirstLetter(lSentence)} and ${lowercaseFirstLetter(rSentence)}.`;

    const canonical = `${window.location.protocol}//${window.location.host}/gallery/image/${this.props.params.imageId}`;

    return (
      <div className="main generate container">
        <Row>
          <Col
            xs={12}
            md={8}
            mdOffset={2}
            style={{
              textAlign: 'center',
              marginTop: '20px',
              marginBottom: '20px',
            }}>
            <h4>An ad comparsion saved {createdAgo}</h4>
            <h5>Learn more at <Link to="/">floodwatch.me</Link></h5>
          </Col>

          <Col xs={12}>
            {dataA &&
              dataB &&
              <ChartContainer
                currentTopic={curTopic}
                leftPersonal={filterA ? filterA.personal : false}
                rightPersonal={filterB ? filterB.personal : false}
                leftSentence={lSentence}
                rightSentence={rSentence}
                leftData={dataA}
                rightData={dataB}
                visibilityMap={visibilityMap} />}
          </Col>

          <Col xs={10} xsOffset={1} style={{ padding: 0 }}>
            <Row>
              <Col md={8} mdOffset={2}>
                <h3 className="chart-sentence">{this.state.sentence}</h3>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}
