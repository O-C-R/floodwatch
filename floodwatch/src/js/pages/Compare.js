// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import FWApiClient from '../api/api';
import ChartContainer from '../components/ChartContainer';
import ComparisonModal from '../components/comparison_modal/ComparisonModal';
import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
} from '../common/comparisontools';

import type { VisibilityMap, FilterPresetsJSON } from '../common/types';
import type {
  PersonResponse,
  FilterResponse,
  FilterRequestItem,
} from '../api/types';

const FILTER_PRESETS: FilterPresetsJSON = require('../../data/filter_presets.json');

function socialWindow(
  url: string,
  network: string,
  { height = 570, width = 570 }: { height?: number, width?: number } = {},
) {
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  const params = `menubar=no,toolbar=no,status=no,scrollbars=no,width=${width},height=${height},top=${top},left=${left}`;
  window.open(url, network, params);
}

type State = {
  leftFilter: FilterRequestItem,
  rightFilter: FilterRequestItem,
  visibilityMap: VisibilityMap,
  leftData: ?FilterResponse,
  rightData: ?FilterResponse,
  currentCategoryId: ?number,
  modalVisible: boolean,
  userData: ?PersonResponse,
  updateCurrentCategoryId: boolean,
  loadingTwitter: boolean,
  loadingFacebook: boolean,
};

export default class Compare extends Component {
  state: State;

  node: ?Element;
  scrollHeight: ?number;
  scrollTop: ?number;

  constructor(props: any) {
    super(props);
    this.state = {
      leftFilter: FILTER_PRESETS.presets[0].filter,
      rightFilter: FILTER_PRESETS.presets[1].filter,
      leftData: null,
      rightData: null,
      visibilityMap: {},
      currentCategoryId: null,
      modalVisible: false,
      userData: null,
      updateCurrentCategoryId: true,
      loadingTwitter: false,
      loadingFacebook: false,
    };
  }

  componentDidMount() {
    const init = async () => {
      const userData = await FWApiClient.get().getCurrentPerson();
      this.setState({ userData });

      const { leftFilter, rightFilter } = this.state;
      await this.updateData(leftFilter, rightFilter);
    };
    init();
  }

  componentWillUpdate() {
    const { node } = this;
    if (node && node instanceof Element) {
      this.scrollHeight = node.scrollHeight;
      this.scrollTop = node.scrollTop;
    }
  }

  componentDidUpdate() {
    const { node } = this;
    if (
      node &&
      node instanceof Element &&
      this.scrollHeight !== undefined &&
      this.scrollHeight !== null &&
      this.scrollTop !== undefined &&
      this.scrollTop !== null
    ) {
      node.scrollTop = this.scrollTop + (node.scrollHeight - this.scrollHeight);
    }
  }

  mouseEnterHandler(categoryId: number): void {
    if (this.state.updateCurrentCategoryId) {
      this.setState({ currentCategoryId: categoryId });
    }
  }

  mouseLeaveHandler() {
    if (this.state.updateCurrentCategoryId) {
      this.setState({ currentCategoryId: null });
    }
  }

  mouseClickHandler(categoryId: ?number): void {
    if (categoryId === null || categoryId === undefined) {
      return;
    }

    if (this.state.updateCurrentCategoryId) {
      this.setState({
        currentCategoryId: categoryId,
        updateCurrentCategoryId: false,
      });
    } else {
      this.setState({
        currentCategoryId: categoryId,
        updateCurrentCategoryId: false,
      });
    }
  }

  setFilters(left: ?FilterRequestItem, right: ?FilterRequestItem): void {
    this.updateData(
      left || this.state.leftFilter,
      right || this.state.rightFilter,
    );
  }

  toggleComparisonModal(): void {
    const curState = this.state.modalVisible;
    this.setState({
      modalVisible: !curState,
    });
  }

  async updateData(left: FilterRequestItem, right: FilterRequestItem) {
    const adBreakdown = await FWApiClient.get().getFilteredAdCounts({
      filter_a: left,
      filter_b: right,
    });

    const { data_a: dataA, data_b: dataB } = adBreakdown;
    const visibilityMap = getVisibilityMap(dataA, dataB);

    this.setState({
      leftData: adBreakdown.data_a,
      rightData: adBreakdown.data_b,
      visibilityMap,
      leftFilter: left,
      rightFilter: right,
    });
  }

  async shareComparison(): Promise<string> {
    const req = {
      filter_a: this.state.leftFilter,
      filter_b: this.state.rightFilter,
      cur_category_id: this.state.currentCategoryId,
    };

    const res = await FWApiClient.get().requestGalleryImage(req);
    return `${window.location.protocol}//${window.location.host}/i/${res.slug}`;
  }

  async shareTwitter(): Promise<void> {
    this.setState({ loadingTwitter: true });
    const text = 'A demographic comparison of ad categories';
    const galleryUrl = await this.shareComparison();
    const via = 'floodwatchapp';
    const intentUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURI(galleryUrl)}&via=${via}`;

    socialWindow(intentUrl, 'twitter', { height: 253 });
    this.setState({ loadingTwitter: false });
  }

  async shareFacebook(): Promise<void> {
    this.setState({ loadingFacebook: true });
    const galleryUrl = await this.shareComparison();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(galleryUrl)}`;

    socialWindow(shareUrl, 'facebook');
    this.setState({ loadingFacebook: false });
  }

  onBodyClick(event: Event) {
    // $FlowBug: this is valid
    const tagName = event.target.tagName.toLowerCase();

    // Ignore clicks on the buttons or chart
    if (tagName === 'rect' || tagName === 'button') {
      return;
    }

    this.setState({
      currentCategoryId: null,
      updateCurrentCategoryId: true,
    });
  }

  render() {
    const {
      currentCategoryId,
      userData,
      leftData,
      rightData,
      leftFilter,
      rightFilter,
      modalVisible,
      visibilityMap,
      loadingTwitter,
      loadingFacebook,
    } = this.state;

    const lVal = currentCategoryId !== null &&
      currentCategoryId !== undefined &&
      leftData
      ? leftData.categories[currentCategoryId]
      : 0;
    const rVal = currentCategoryId !== null &&
      currentCategoryId !== undefined &&
      rightData
      ? rightData.categories[currentCategoryId]
      : 0;
    const sentence = currentCategoryId !== null &&
      currentCategoryId !== undefined
      ? generateDifferenceSentence(
          leftFilter,
          rightFilter,
          lVal,
          rVal,
          currentCategoryId,
        )
      : '';

    const lSentence = createSentence(leftFilter);
    const rSentence = createSentence(rightFilter);

    const leftPersonal = leftFilter.personal === true;
    const rightPersonal = rightFilter.personal === true;

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    return (
      <div
        className="main compare"
        onClick={this.onBodyClick.bind(this)}
        role="presentation"
        ref={node => (this.node = node)}>
        <ChartContainer
          currentCategoryId={currentCategoryId}
          leftSentence={lSentence}
          rightSentence={rSentence}
          leftPersonal={leftPersonal}
          rightPersonal={rightPersonal}
          leftData={leftData}
          rightData={rightData}
          visibilityMap={visibilityMap}
          mouseClickHandler={this.mouseClickHandler.bind(this)}
          mouseEnterHandler={this.mouseEnterHandler.bind(this)}
          mouseLeaveHandler={this.mouseLeaveHandler.bind(this)} />

        <Col xs={10} xsOffset={1} style={{ padding: 0 }}>
          <Row
            style={{
              position: 'fixed',
              bottom: 0,
              left: '1.3%',
              width: '100%',
            }}>
            <Col xs={10} xsOffset={1} md={6} mdOffset={3} lg={6} lgOffset={3}>
              <h3 className="chart-sentence text-center">
                {sentence}
              </h3>
              <div
                className="chart-actions"
                style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                <button
                  className="chart-actions_toggleCompare btn btn-primary button"
                  onClick={this.toggleComparisonModal.bind(this)}>
                  Change demographics
                </button>
                <button
                  className="chart-actions_share btn btn-default button"
                  onClick={
                    !loadingTwitter ? this.shareTwitter.bind(this) : null
                  }>
                  {!loadingTwitter &&
                    <FontAwesome
                      name="twitter"
                      style={{ pointerEvents: 'none' }} />}
                  {loadingTwitter &&
                    <FontAwesome
                      name="cog"
                      spin
                      style={{ pointerEvents: 'none' }} />}
                </button>
                <button
                  className="chart-actions_share btn btn-default button"
                  onClick={
                    !loadingFacebook ? this.shareFacebook.bind(this) : null
                  }>
                  {!loadingFacebook &&
                    <FontAwesome
                      name="facebook"
                      style={{ pointerEvents: 'none' }} />}
                  {loadingFacebook &&
                    <FontAwesome
                      name="cog"
                      spin
                      style={{ pointerEvents: 'none' }} />}
                </button>
              </div>

            </Col>
          </Row>
        </Col>

        {userData &&
          <ComparisonModal
            visible={modalVisible}
            toggleModal={this.toggleComparisonModal.bind(this)}
            currentSelectionLeft={leftFilter}
            currentSelectionRight={rightFilter}
            setFilters={this.setFilters.bind(this)}
            userData={userData} />}
      </div>
    );
    /* eslint-enable jsx-a11y/no-static-element-interactions */
  }
}
