// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import d3 from 'd3';
import _ from 'lodash';
import FontAwesome from 'react-fontawesome';

// import {FilterParent} from './FilterParent';
import ChartContainer from './ChartContainer';
import { ComparisonModal } from './ComparisonModal';
import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
} from './comparisontools';
import { FWApiClient } from '../api/api';

import type { Preset, Filter, FilterLogic } from './filtertypes';
import type {
  PersonResponse,
  FilterResponse,
  FilterRequestItem,
} from '../api/types';

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import Filters from '../../stubbed_data/filter_response.json';
import TopicKeys from '../../stubbed_data/topic_keys.json';

export type VisibilityMap = {
  [catId: string]: 'show' | 'hide' | 'other',
};

type StateType = {
  leftOptions: Array<Filter>,
  rightOptions: Array<Filter>,
  visibilityMap: VisibilityMap,
  leftData: FilterResponse,
  rightData: FilterResponse,
  currentTopic: ?string,
  modalVisible: boolean,
  userData: ?PersonResponse,
  updateCurrentTopic: boolean,
  loadingTwitter: boolean,
  loadingFacebook: boolean,
};

function CompareContainerInitialState(): StateType {
  return {
    leftOptions: Filters.presets[0].filters,
    rightOptions: Filters.presets[1].filters,
    leftData: { categories: {}, total_count: 0 },
    rightData: { categories: {}, total_count: 0 },
    visibilityMap: {},
    currentTopic: null,
    modalVisible: false,
    userData: null,
    updateCurrentTopic: true,
    loadingTwitter: false,
    loadingFacebook: false,
  };
}

export class Compare extends Component {
  state: StateType;

  constructor(): void {
    super();
    this.state = CompareContainerInitialState();
  }

  componentDidMount() {
    const init = async () => {
      const filterA = this.generateFilterRequestItem(this.state.leftOptions);
      const filterB = this.generateFilterRequestItem(this.state.rightOptions);
      const cleanedFilterA = this.cleanFilterRequest(filterA);
      const cleanedFilterB = this.cleanFilterRequest(filterB);

      const adBreakdown = await FWApiClient.get().getFilteredAdCounts({
        filter_a: cleanedFilterA,
        filter_b: cleanedFilterB,
      });

      const leftData = adBreakdown.data_a;
      const rightData = adBreakdown.data_b;
      const visibilityMap = getVisibilityMap(leftData, rightData);

      const UserData = await FWApiClient.get().getCurrentPerson();

      this.setState({
        leftData,
        rightData,
        visibilityMap,
        currentTopic: null,
        userData: UserData,
        updateCurrentTopic: true,
      });
    };
    init();
  }

  mouseEnterHandler(newTopic: string): void {
    if (newTopic !== 'Other' && this.state.updateCurrentTopic) {
      this.setState({
        currentTopic: newTopic,
      });
    }
  }

  mouseLeaveHandler() {
    if (this.state.updateCurrentTopic) {
      this.setState({
        currentTopic: null,
      });
    }
  }

  mouseClickHandler(newTopic: string): void {
    if (newTopic !== 'Other') {
      if (this.state.updateCurrentTopic) {
        this.setState({
          currentTopic: newTopic,
          updateCurrentTopic: false,
        });
      } else {
        this.setState({
          currentTopic: newTopic,
          updateCurrentTopic: false,
        });
      }
    }
  }

  updateSearchLogic(side: string, logic: FilterLogic, filtername: string) {
    let curInfo = [];
    if (side === 'left') {
      curInfo = _.cloneDeep(this.state.leftOptions);
    } else if (side === 'right') {
      curInfo = _.cloneDeep(this.state.rightOptions);
    }

    let found = false;
    for (let i = 0; i < curInfo.length; i++) {
      if (curInfo[i].name === filtername) {
        curInfo[i].logic = logic;
        found = true;
      }
    }
    if (found === false) {
      curInfo.push({ name: filtername, logic, choices: [] });
    }

    if (side === 'left') {
      this.updateData(curInfo, this.state.rightOptions);
    } else if (side === 'right') {
      this.updateData(this.state.leftOptions, curInfo);
    }
  }

  generateFilterRequestItem(filter: Array<Filter>): FilterRequestItem {
    const isPersonal = _.find(
      filter,
      f => f.name === 'data' && f.choices[0] === 'You',
    );
    if (isPersonal) {
      return { personal: true };
    }

    const obj: FilterRequestItem = {
      demographics: [],
    };

    for (const f of filter) {
      if (f.name === 'age') {
        if (f.choices[0]) {
          const min = parseInt(f.choices[0].split('-')[0], 10);
          const max = parseInt(f.choices[0].split('-')[1], 10);
          obj.age = {
            min,
            max,
          };
        }
      } else if (f.name === 'country') {
        obj.location = {
          country_codes: f.choices,
        };
      } else {
        const arr = [];
        const myCategoryId = DemographicKeys.category_to_id[f.name];
        for (const choice of f.choices) {
          for (const key of DemographicKeys.demographic_keys) {
            if (key.name === choice && key.category_id === myCategoryId) {
              arr.push(key.id);
            }
          }
        }
        if (obj.demographics) {
          obj.demographics.push({ operator: f.logic, values: arr });
        }
      }
    }
    return obj;
  }

  cleanFilterRequest(filter: FilterRequestItem): FilterRequestItem {
    if (!filter.demographics) {
      return filter;
    }

    if (filter.demographics.length === 0) {
      return filter;
    }

    for (let i = filter.demographics.length - 1; i >= 0; i--) {
      if (filter.demographics[i].values.length === 0) {
        filter.demographics.splice(i, 1);
      }
    }
    return filter;
  }

  changeCategoriesCustom(side: string, info: Filter, checked: boolean): void {
    let curInfo = [];
    if (side === 'left') {
      curInfo = _.cloneDeep(this.state.leftOptions);
    } else if (side === 'right') {
      curInfo = _.cloneDeep(this.state.rightOptions);
    }

    let found = false;

    for (let i = 0; i < curInfo.length; i++) {
      if (curInfo[i].name === info.name) {
        if (checked) {
          if (info.name === 'age' || info.name === 'country') {
            // special case for age
            curInfo[i].choices = info.choices; // treat it like a radio button: only 1 choice allowed
          } else {
            curInfo[i].choices = _.union(curInfo[i].choices, info.choices);
            curInfo[i].logic = info.logic;
          }
        } else {
          curInfo[i].choices = _.filter(
            curInfo[i].choices,
            (n: string) => n !== info.choices[0],
          );
        }

        found = true;
      }
    }

    if (!found && checked) {
      curInfo.push(info);
    }

    // fixing something stupid for when the filter is You
    for (const [index: number, info: Filter] of curInfo.entries()) {
      if (info.name === 'data') {
        curInfo.splice(index, 1);
      } else if (info.choices.length === 0) {
        // this feels like it should be handled by the above _.filter but it's not...
        curInfo.splice(index, 1);
      }
    }

    if (side === 'left') {
      this.updateData(curInfo, this.state.rightOptions);
    } else if (side === 'right') {
      this.updateData(this.state.leftOptions, curInfo);
    }
  }

  changeCategoriesPreset(side: string, info: Preset): void {
    if (side === 'left') {
      this.updateData(info.filters, this.state.rightOptions);
    } else if (side === 'right') {
      this.updateData(this.state.leftOptions, info.filters);
    }
  }

  toggleComparisonModal(): void {
    const curState = this.state.modalVisible;
    this.setState({
      modalVisible: !curState,
    });
  }

  async updateData(left: Array<Filter>, right: Array<Filter>) {
    const filterA = this.generateFilterRequestItem(left);
    const filterB = this.generateFilterRequestItem(right);

    const cleanedFilterA = this.cleanFilterRequest(filterA);
    const cleanedFilterB = this.cleanFilterRequest(filterB);

    const adBreakdown = await FWApiClient.get().getFilteredAdCounts({
      filter_a: cleanedFilterA,
      filter_b: cleanedFilterB,
    });

    this.setState({
      leftData: adBreakdown.data_a,
      rightData: adBreakdown.data_b,
      leftOptions: left,
      rightOptions: right,
    });
  }

  async shareComparison(): Promise<string> {
    const req = {
      filter_a: this.generateFilterRequestItem(this.state.leftOptions),
      filter_b: this.generateFilterRequestItem(this.state.rightOptions),
      cur_topic: this.state.currentTopic,
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

    this.socialWindow(intentUrl, 'twitter', { height: 253 });
    this.setState({ loadingTwitter: false });
  }

  async shareFacebook(): Promise<void> {
    this.setState({ loadingFacebook: true });
    const galleryUrl = await this.shareComparison();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(galleryUrl)}`;

    this.socialWindow(shareUrl, 'facebook');
    this.setState({ loadingFacebook: false });
  }

  socialWindow(
    url: string,
    network: string,
    { height = 570, width = 570 }: { height: number, width: number } = {},
  ) {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const params = `menubar=no,toolbar=no,status=no,scrollbars=no,width=${width},height=${height},top=${top},left=${left}`;
    window.open(url, network, params);
  }

  onBodyClick(event: Event) {
    const tagName = event.target.tagName.toLowerCase();

    // Ignore clicks on the buttons or chart
    if (tagName == 'rect' || tagName == 'button') {
      return;
    }

    this.setState({
      currentTopic: null,
      updateCurrentTopic: true,
    });
  }

  render() {
    const {
      currentTopic,
      userData,
      leftData,
      rightData,
      leftOptions,
      rightOptions,
      modalVisible,
      updateCurrentTopic,
      visibilityMap,
      loadingTwitter,
      loadingFacebook,
    } = this.state;

    const lVal = currentTopic ? leftData.categories[currentTopic] : 0;
    const rVal = currentTopic ? rightData.categories[currentTopic] : 0;
    const sentence = generateDifferenceSentence(
      leftOptions,
      rightOptions,
      lVal,
      rVal,
      currentTopic,
    );

    const lSentence = createSentence(leftOptions);
    const rSentence = createSentence(rightOptions);

    const leftPersonal =
      leftOptions.length > 0 && leftOptions[0].name === 'data';
    const rightPersonal =
      rightOptions.length > 0 && rightOptions[0].name === 'data';

    return (
      <div className="main compare" onClick={this.onBodyClick.bind(this)}>
        <ChartContainer
          currentTopic={currentTopic}
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
          <Row>
            <Col md={8} mdOffset={2}>
              <h3 className="chart-sentence">{sentence}</h3>

              <div className="chart-actions">
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
                    <div>
                      <i className="fa fa-cog fa-spin fa-fw" />
                      <span className="sr-only">Loading...</span>
                    </div>}
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
                    <div>
                      <i className="fa fa-cog fa-spin fa-fw" />
                      <span className="sr-only">Loading...</span>
                    </div>}
                </button>
              </div>
            </Col>
          </Row>
        </Col>

        {userData &&
          <ComparisonModal
            visible={modalVisible}
            toggleModal={this.toggleComparisonModal.bind(this)}
            currentSelectionLeft={leftOptions}
            currentSelectionRight={rightOptions}
            changeCategoriesPreset={this.changeCategoriesPreset.bind(this)}
            changeCategoriesCustom={this.changeCategoriesCustom.bind(this)}
            updateSearchLogic={this.updateSearchLogic.bind(this)}
            userData={userData} />}
      </div>
    );
  }
}
