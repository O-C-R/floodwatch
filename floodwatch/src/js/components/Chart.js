// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';

import * as d3 from 'd3';
import _ from 'lodash';

import colors from './colors';
import TopicKeys from '../../stubbed_data/topic_keys.json';
import { createSentence } from './Compare';

import type { UnstackedData, VisibilityMap } from './Compare';

type StackedData = Array<{
  name: string,
  id: string,
  y: number,
  height: number,
  value: number,
}>;

type PropsType = {
  side: string,
  data: UnstackedData,
  sentence: string,
  visibilityMap: VisibilityMap,
  currentTopic: ?string,
  mouseEnterHandler: (topic: string) => void,
  mouseLeaveHandler: (topic: string) => void,
  mouseClickHandler: (topic: string) => void,
};

type StateType = {
  height: number,
  svg?: any,
  defs?: any,
};

function initialState(): StateType {
  return {
    height: 500,
  };
}

export class Chart extends Component {
  props: PropsType;
  state: StateType;

  constructor(props: PropsType) {
    super(props);
    this.state = initialState();
  }

  componentDidMount() {
    const svg = d3
      .select(`.chart_svg-${this.props.side}`)
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.state.height);
    const defs = svg.append('defs');

    this.setState({
      svg,
      defs,
    });
  }

  processData(data: UnstackedData, visibilityMap: VisibilityMap): StackedData {
    const processedData = [];
    let totalValue = 0;
    let other = 0;

    /**
     *
     * Create structure
     *
     */

    for (const catId in data) {
      if (visibilityMap[catId] === 'show') {
        const obj = {
          name: TopicKeys[catId],
          value: data[catId],
          id: catId,
          y: 0,
          height: 0,
        };
        processedData.push(obj);
        totalValue += data[catId];
      } else if (visibilityMap[catId] === 'other') {
        other += data[catId];
        totalValue += data[catId];
      }
    }

    /**
     *
     * Sort
     *
     */

    processedData.sort((a, b): number => {
      if (a.value < b.value) return 1;
      if (a.value > b.value) return -1;
      return 0;
    });

    /**
     *
     * Add other
     *
     */

    processedData.push({
      name: 'Other',
      id: 'Other',
      value: other,
      y: 0,
      height: 0,
    });

    /**
     *
     * Map Height and get Y
     *
     */

    const scaleHeight = d3.scale
      .linear()
      .domain([0, totalValue])
      .range([0, this.state.height]);

    processedData.map((item, index) => {
      item.height = Math.floor(scaleHeight(item.value));

      let count = 0;
      for (let i = 0; i < index; i++) {
        count += processedData[i].height;
      }
      item.y = count;

      // Correct the offset due to the floor
      if (index === processedData.length - 1) {
        item.height = this.state.height - count;
      }

      return item;
    });

    return processedData;
  }

  drawChart(data: StackedData) {
    if (this.state.svg && this.state.defs) {
      const svg = this.state.svg;
      const defs = this.state.defs;

      const rects = svg.selectAll('rect').data(data);
      const names = svg.selectAll('text.name').data(data);
      const percentages = svg.selectAll('text.percentage').data(data);
      const grads = defs.selectAll('linearGradient').data(data);

      // Enter
      rects
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('width', '100%')
        .on('mouseenter', (d) => {
          this.props.mouseEnterHandler(d.id);
        })
        .on('mouseleave', (d) => {
          this.props.mouseLeaveHandler(d.id);
        })
        .on('click', (d) => {
          this.props.mouseClickHandler(d.id);
        })
        .attr('fill', (d, i) => `url(#${this.props.side}${i})`);

      names
        .enter()
        .append('text')
        .attr('fill', '#FFF')
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('class', (d) => {
          if (d.height < 20) return 'name xsmall';
          if (d.height < 30) return 'name small';
          return 'name';
        });

      percentages
        .enter()
        .append('text')
        .attr('fill', '#FFF')
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('class', 'percentage');

      grads
        .enter()
        .append('linearGradient')
        .attr('id', (d, i) => this.props.side + i)
        .selectAll('stop')
        .data((d) => {
          if (this.props.side === 'right') {
            return [
              { offset: 0, color: colors[d.name][0] },
              { offset: 1, color: colors[d.name][1] },
            ];
          }
          return [
            { offset: 0, color: colors[d.name][1] },
            { offset: 1, color: colors[d.name][0] },
          ];
        })
        .enter()
        .append('stop')
        .attr('class', d => `color_${d.offset}`)
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

      // Update
      rects
        .transition()
        .duration(200)
        .attr('stroke-width', 0)
        .attr('fill-opacity', (d) => {
          if (this.props.currentTopic === null) {
            return 1;
          } else if (this.props.currentTopic === d.id) {
            return 1;
          }
          return 0.1;
        })
        .attr('height', (d, i) => (d.height >= 1.5 ? d.height : 0))
        .attr('y', (d, i) => d.y)
        .attr('stroke', 'yellow')
        .attr('stroke-width', (d) => {
          if (
            this.props.noOutline == false &&
            this.props.currentTopic === d.id
          ) {
            return 2;
          }
          return 0;
        });

      names
        .text(d => d.name)
        .attr('class', (d) => {
          if (d.height < 20) return 'name xsmall';
          if (d.height < 30) return 'name small';
          return 'name';
        })
        .transition()
        .duration(200)
        .attr(
          'fill-opacity',
          d => 1,
          // return 0
        )
        .attr('y', (d, i) => d.y + d.height / 2 + 4);

      percentages
        .text(d => `${Math.floor(d.value * 100)}%`)
        .transition()
        .duration(200)
        .attr('fill-opacity', (d) => {
          if (d.height > 70) return;
          return 0;
        })
        .attr('y', (d, i) => d.y + d.height / 2 + 20);

      grads
        .selectAll('stop')
        .data((d) => {
          if (this.props.side === 'right') {
            return [
              { offset: 0, color: colors[d.name][0] },
              { offset: 1, color: colors[d.name][1] },
            ];
          }
          return [
            { offset: 0, color: colors[d.name][1] },
            { offset: 1, color: colors[d.name][0] },
          ];
        })
        .transition()
        .duration(200)
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

      // Exit
      rects.exit().remove();
      names.exit().remove();
      percentages.exit().remove();
      grads.exit().remove();
    }
  }

  render() {
    const processedData = this.processData(
      this.props.data,
      this.props.visibilityMap,
    );
    let error;
    if (processedData.length <= 1) {
      error = (
        <Col xs={12} md={8} className="chart" style={{ padding: '2px' }}>
          Whoops! Not enough data for this demographic category - try another comparison.
        </Col>
      );
    }

    let ret;
    if (this.props.side == 'left') {
      ret = (
        <div>
          <Col xs={12} md={4} className="sentence left-sentence">
            {this.props.sentence}
          </Col>
          <Col xs={12} md={8} className="chart" style={{ padding: '2px' }}>
            <div
              className={`chart_svg chart_svg-${this.props.side} ${error ? 'hide' : 'show'}`}
            />
            {error}
          </Col>
        </div>
      );
    } else {
      ret = (
        <div>
          <Col xs={12} md={4} mdPush={8} className="sentence right-sentence">
            {this.props.sentence}
          </Col>
          <Col
            xs={12}
            md={8}
            mdPull={4}
            className="chart"
            style={{ padding: '2px' }}
          >
            <div
              className={`chart_svg chart_svg-${this.props.side} ${error ? 'hide' : 'show'}`}
            />
            {error}
          </Col>
        </div>
      );
    }

    this.drawChart(processedData);
    return ret;
  }
}
