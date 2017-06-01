// @flow

import React, { Component } from 'react';
import { Link } from 'react-router';
import { Row, Col } from 'react-bootstrap';
import moment from 'moment';
import log from 'loglevel';

import FWApiClient from '../api/api';
import ChartContainer from '../components/ChartContainer';

import type { FilterResponse, FilterRequestItem } from '../api/types';
import type { VisibilityMap } from '../common/types';

import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
} from '../common/comparisontools';

type Props = {
  params: {
    // eslint-disable-next-line react/no-unused-prop-types
    imageSlug: string,
  },
};

type State = {
  createdAgo?: string,

  filterA?: FilterRequestItem,
  filterB?: FilterRequestItem,
  dataA?: FilterResponse,
  dataB?: FilterResponse,
  curTopic?: ?string,
  currentCategoryId?: ?number,
  visibilityMap?: VisibilityMap,
  lSentence?: string,
  rSentence?: string,
  sentence?: ?string,
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
        this.props.params.imageSlug,
      );

      const { data, created_at } = imageRes;
      const {
        filter_a: filterA,
        filter_b: filterB,
        data_a: dataA,
        data_b: dataB,
        cur_category_id: currentCategoryId,
      } = data;

      const visibilityMap = getVisibilityMap(dataA, dataB);
      const lVal = currentCategoryId ? dataA.categories[currentCategoryId] : 0;
      const rVal = currentCategoryId ? dataB.categories[currentCategoryId] : 0;

      const lSentence = createSentence(filterA, { contextIsImpersonal: true });
      const rSentence = createSentence(filterB, { contextIsImpersonal: true });

      let sentence = null;
      if (currentCategoryId !== null && currentCategoryId !== undefined) {
        sentence = generateDifferenceSentence(
          filterA,
          filterB,
          lVal,
          rVal,
          currentCategoryId,
        );
      }

      this.setState({
        createdAgo: moment(created_at).fromNow(),
        filterA,
        filterB,
        dataA,
        dataB,
        currentCategoryId,
        visibilityMap,
        lSentence,
        rSentence,
        sentence,
      });
    } catch (e) {
      log.error(e);
    }
  }

  render() {
    const {
      lSentence,
      rSentence,
      sentence,
      currentCategoryId,
      filterA,
      filterB,
      dataA,
      dataB,
      visibilityMap,
      createdAgo,
    } = this.state;

    // Wait for load
    if (!lSentence || !rSentence) return <div />;

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
              visibilityMap &&
              <ChartContainer
                currentCategoryId={currentCategoryId}
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
                <h3 className="chart-sentence text-center">{sentence}</h3>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}
