// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import d3 from 'd3';
import _ from 'lodash';

// import {FilterParent} from './FilterParent';
import { Chart } from './Chart';
import { ComparisonModal } from './ComparisonModal';
import {
  getVisibilityMap,
  generateDifferenceSentence,
  createSentence,
} from './comparisontools';
import { FWApiClient } from '../api/api';

import type { Preset, Filter, FilterLogic } from './filtertypes';
import type { PersonResponse, FilterRequestItem } from '../api/types';

import DemographicKeys from '../../stubbed_data/demographic_keys.json';
import Filters from '../../stubbed_data/filter_response.json';
import TopicKeys from '../../stubbed_data/topic_keys.json';

export type VisibilityMap = {
  [catId: string]: 'show' | 'hide' | 'other',
};

export type UnstackedData = {
  [key: string]: number,
};

export class Compare extends Component {
  render() {
    return (
      <Row style={{ height: '100%' }}>
        <Col xs={12} style={{ height: '100%' }}>
          <CompareContainer />
        </Col>
      </Row>
    );
  }
}

type StateType = {
  leftOptions: Array<Filter>,
  rightOptions: Array<Filter>,
  visibilityMap: VisibilityMap,
  leftData: UnstackedData,
  rightData: UnstackedData,
  currentTopic: ?string,
  modalVisible: boolean,
  userData: PersonResponse,
  updateCurrentTopic: boolean,
};

function CompareContainerInitialState(): Object {
  return {
    leftOptions: Filters.presets[0].filters,
    rightOptions: Filters.presets[1].filters,
    leftData: {},
    rightData: {},
    visibilityMap: {},
    currentTopic: null,
    modalVisible: false,
    updateCurrentTopic: true,
  };
}

export class CompareContainer extends Component {
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

      const AdBreakdown = await FWApiClient.get().getFilteredAdCounts({
        filterA: cleanedFilterA,
        filterB: cleanedFilterB,
      });

      const leftData = AdBreakdown.filterA.categories;
      const rightData = AdBreakdown.filterB.categories;
      const visibilityMap = getVisibilityMap(leftData, rightData);

      const FilterATopic = d3
        .entries(AdBreakdown.filterA.categories)
        .sort((a, b) => d3.descending(a.value, b.value))[0];

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
          countryCodes: f.choices,
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
          curInfo[i].choices = _.filter(curInfo[i].choices, (
            n: string,
          ) => n !== info.choices[0]);
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

    const AdBreakdown = await FWApiClient.get().getFilteredAdCounts({
      filterA: cleanedFilterA,
      filterB: cleanedFilterB,
    });

    this.setState({
      leftData: AdBreakdown.filterA.totalCount > 0
        ? AdBreakdown.filterA.categories
        : {},
      rightData: AdBreakdown.filterB.totalCount > 0
        ? AdBreakdown.filterB.categories
        : {},
      leftOptions: left,
      rightOptions: right,
    });
  }

  shareComparison(): void {
    const obj = {
      filterA: this.generateFilterRequestItem(this.state.leftOptions),
      dataA: this.state.leftData,
      filterB: this.generateFilterRequestItem(this.state.rightOptions),
      dataB: this.state.rightData,
      curTopic: this.state.currentTopic,
    };

    const url = `${window.location.origin}/generate?data=${JSON.stringify(obj)}`;

    window.open(url);
  }

  clearTopic(event) {
    if (event.target.tagName != 'rect') {
      this.setState({
        currentTopic: null,
        updateCurrentTopic: true,
      });
    }
  }

  render() {
    const lVal = this.state.currentTopic
      ? this.state.leftData[this.state.currentTopic]
      : 0;
    const rVal = this.state.currentTopic
      ? this.state.rightData[this.state.currentTopic]
      : 0;
    const sentence = generateDifferenceSentence(
      this.state.leftOptions,
      this.state.rightOptions,
      lVal,
      rVal,
      this.state.currentTopic,
    );

    const lSentence = createSentence(this.state.leftOptions);
    const rSentence = createSentence(this.state.rightOptions);

    return (
      <div
        className="main compare"
        onClick={this.clearTopic.bind(this)}
        style={{ height: '100%' }}
      >
        <Row className="chart-container">
          <Col sm={5} smOffset={1} xs={10} xsOffset={1} style={{ padding: 0 }}>
            <Chart
              side="left"
              data={this.state.leftData}
              sentence={lSentence}
              visibilityMap={this.state.visibilityMap}
              currentTopic={this.state.currentTopic}
              noOutline={this.state.updateCurrentTopic}
              mouseEnterHandler={this.mouseEnterHandler.bind(this)}
              mouseClickHandler={this.mouseClickHandler.bind(this)}
              mouseLeaveHandler={this.mouseLeaveHandler.bind(this)}
            />
          </Col>
          <Col sm={5} smOffset={0} xs={10} xsOffset={1} style={{ padding: 0 }}>
            <Chart
              side="right"
              data={this.state.rightData}
              sentence={rSentence}
              visibilityMap={this.state.visibilityMap}
              currentTopic={this.state.currentTopic}
              noOutline={this.state.updateCurrentTopic}
              mouseEnterHandler={this.mouseEnterHandler.bind(this)}
              mouseClickHandler={this.mouseClickHandler.bind(this)}
              mouseLeaveHandler={this.mouseLeaveHandler.bind(this)}
            />
          </Col>
        </Row>

        <Row>
          <Col xs={10} xsOffset={1} style={{ padding: 0 }}>
            <Row>
              <Col md={8} mdOffset={2}>
                <h3 className="chart-sentence">{sentence}</h3>

                <div className="chart-actions">
                  <button
                    className="chart-actions_toggleCompare btn btn-primary button"
                    onClick={this.toggleComparisonModal.bind(this)}
                  >
                    Change demographics
                  </button>
                  <button
                    className="btn btn-default button"
                    onClick={this.shareComparison.bind(this)}
                  >
                    Share
                  </button>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        <ComparisonModal
          visible={this.state.modalVisible}
          toggleModal={this.toggleComparisonModal.bind(this)}
          currentSelectionLeft={this.state.leftOptions}
          currentSelectionRight={this.state.rightOptions}
          changeCategoriesPreset={this.changeCategoriesPreset.bind(this)}
          changeCategoriesCustom={this.changeCategoriesCustom.bind(this)}
          updateSearchLogic={this.updateSearchLogic.bind(this)}
          userData={this.state.userData}
        />
      </div>
    );
  }
}
