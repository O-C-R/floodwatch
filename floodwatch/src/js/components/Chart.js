// @flow

import React, { Component } from 'react';
import { Col } from 'react-bootstrap';

import * as d3 from 'd3';

import { OTHER_COLORS } from '../common/constants';

import type { VisibilityMap, AdCategoriesJSON } from '../common/types';
import type { FilterResponse } from '../api/types';

const AD_CATEGORIES: AdCategoriesJSON = require('../../data/ad_categories.json');

type ColorBar = {
  categoryId: ?number,
  name: string,
  y: number,
  height: number,
  value: number,
  colors: [string, string],
};

type Props = {|
  side: string,
  data: ?FilterResponse,
  sentence: string,
  visibilityMap: VisibilityMap,
  currentCategoryId: ?number,
  isPersonal: boolean,
  mouseEnterHandler: ?(categoryId: number) => void,
  mouseLeaveHandler: ?(categoryId: number) => void,
  mouseClickHandler: ?(categoryId: number) => void,
|};

type State = {
  height: number,
};

export default class Chart extends Component {
  props: Props;
  state: State;

  svg: any;
  defs: any;

  colorBars: ?Array<ColorBar>;

  constructor(props: Props) {
    super(props);

    const { data, visibilityMap } = this.props;
    if (data && visibilityMap) {
      this.colorBars = this.processData(data, visibilityMap);
    }
  }

  state = {
    height: 500,
  };

  componentDidMount() {
    this.svg = d3
      .select(`.chart_svg-${this.props.side}`)
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.state.height);
    this.defs = this.svg.append('defs');

    const { data, visibilityMap } = this.props;
    if (data && visibilityMap) {
      this.colorBars = this.processData(data, visibilityMap);
    } else {
      this.colorBars = null;
    }

    if (this.colorBars) {
      this.drawChart(this.colorBars);
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const { data, visibilityMap } = nextProps;
    if (data && visibilityMap) {
      this.colorBars = this.processData(data, visibilityMap);
    } else {
      this.colorBars = null;
    }
  }

  componentDidUpdate() {
    if (this.colorBars) {
      this.drawChart(this.colorBars);
    }
  }

  processData(
    data: FilterResponse,
    visibilityMap: VisibilityMap,
  ): Array<ColorBar> {
    const categoryBars = [];
    let otherValue = 0;
    let totalValue = 0;

    for (const categoryIdStr of Object.keys(data.categories)) {
      const categoryId = parseInt(categoryIdStr, 10);

      const value = data.categories[categoryId];

      if (visibilityMap[categoryId] === 'show') {
        const obj = {
          categoryId,
          value,
          y: 0,
          height: 0,
        };
        categoryBars.push(obj);
        totalValue += value;
      } else if (visibilityMap[categoryId] === 'other') {
        otherValue += value;
        totalValue += value;
      }
    }

    categoryBars.sort((a, b) => b.value - a.value);

    const scaleHeight = d3.scale
      .linear()
      .domain([0, totalValue])
      .range([0, this.state.height]);

    const colorBars: Array<ColorBar> = categoryBars.reduce((m, categoryBar, i) => {
      const category = AD_CATEGORIES.categories[categoryBar.categoryId];
      const height = Math.floor(scaleHeight(categoryBar.value));

      let y = 0;
      for (let j = 0; j < i; ++j) {
        y += m[j].height;
      }

      m.push({
        categoryId: categoryBar.categoryId,
        name: category.name,
        colors: category.colors,
        value: categoryBar.value,
        y,
        height,
      });

      return m;
    }, []);

    const last = colorBars[colorBars.length - 1];
    if (last) {
      colorBars.push({
        categoryId: null,
        name: 'Other',
        colors: OTHER_COLORS,
        value: otherValue,
        y: last.y + last.height,
        height: this.state.height - (last.y + last.height),
      });
    }

    return colorBars;
  }

  drawChart(data: Array<ColorBar>) {
    const { svg, defs } = this;

    if (svg && defs) {
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
        .on('mouseenter', (d: ColorBar) => {
          if (this.props.mouseEnterHandler && d.categoryId) {
            this.props.mouseEnterHandler(d.categoryId);
          }
        })
        .on('mouseleave', (d: ColorBar) => {
          if (this.props.mouseLeaveHandler && d.categoryId) {
            this.props.mouseLeaveHandler(d.categoryId);
          }
        })
        .on('click', (d: ColorBar) => {
          if (this.props.mouseClickHandler && d.categoryId) {
            this.props.mouseClickHandler(d.categoryId);
          }
        })
        .attr(
          'fill',
          (d: ColorBar, i: number) => `url(#${this.props.side}${i})`,
        );

      names
        .enter()
        .append('text')
        .attr('fill', '#FFF')
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('class', (d: ColorBar) => {
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
        .attr('id', (d, i: number) => `${this.props.side}${i}`)
        .selectAll('stop')
        .data((d: ColorBar) => {
          if (this.props.side === 'right') {
            return [
              { offset: 0, color: d.colors[0] },
              { offset: 1, color: d.colors[1] },
            ];
          }
          return [
            { offset: 0, color: d.colors[1] },
            { offset: 1, color: d.colors[0] },
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
        .attr('fill-opacity', (d: ColorBar) => {
          if (
            this.props.currentCategoryId === null ||
            this.props.currentCategoryId === undefined
          ) {
            return 1;
          } else if (this.props.currentCategoryId === d.categoryId) {
            return 1;
          }
          return 0.1;
        })
        .attr('height', (d: ColorBar) => (d.height >= 1.5 ? d.height : 0))
        .attr('y', (d: ColorBar) => d.y)
        .attr('stroke', 'yellow');

      names
        .text(d => d.name)
        .attr('class', (d: ColorBar) => {
          if (d.height < 10) return 'hidden';
          if (d.height < 20) return 'name xsmall';
          if (d.height < 30) return 'name small';
          return 'name';
        })
        .transition()
        .duration(200)
        .attr('fill-opacity', 1)
        // eslint-disable-next-line no-mixed-operators
        .attr('y', (d: ColorBar) => d.y + d.height / 2 + 4);

      percentages
        .text((d: ColorBar) => `${Math.floor(d.value * 100)}%`)
        .transition()
        .duration(200)
        .attr('fill-opacity', (d: ColorBar) => {
          if (d.height > 70) return null;
          return 0;
        })
        // eslint-disable-next-line no-mixed-operators
        .attr('y', (d: ColorBar) => d.y + d.height / 2 + 20);

      grads
        .selectAll('stop')
        .data((d: ColorBar) => {
          if (this.props.side === 'right') {
            return [
              { offset: 0, color: d.colors[0] },
              { offset: 1, color: d.colors[1] },
            ];
          }
          return [
            { offset: 0, color: d.colors[1] },
            { offset: 1, color: d.colors[0] },
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
    const { data, side, sentence, isPersonal } = this.props;
    const { height } = this.state;
    let error;

    if (!data) {
      error = <div />;
    } else if (!this.colorBars || this.colorBars.length <= 1) {
      let errorMessage = '';
      if (isPersonal) {
        errorMessage =
          "We haven't seen enough ads from you yet, install the extension and get browsing!";
      } else {
        errorMessage =
          'Whoops! Not enough data for this demographic category - try another comparison.';
      }

      error = (
        <Col
          xs={12}
          className="chart"
          style={{
            textAlign: 'center',
            height,
            background: '#ccc',
          }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height,
            }}>
            {errorMessage}
          </div>
        </Col>
      );
    }

    let ret;
    if (side === 'left') {
      ret = (
        <div>
          <Col xs={12} md={4} className="sentence left-sentence">
            {sentence}
          </Col>
          <Col xs={12} md={8} className="chart" style={{ padding: '2px' }}>
            <div
              className={`chart_svg chart_svg-${side} ${error ? 'hide' : 'show'}`} />
            {error}
          </Col>
        </div>
      );
    } else {
      ret = (
        <div>
          <Col xs={12} md={4} mdPush={8} className="sentence right-sentence">
            {sentence}
          </Col>
          <Col
            xs={12}
            md={8}
            mdPull={4}
            className="chart"
            style={{ padding: '2px' }}>
            <div
              className={`chart_svg chart_svg-${side} ${error ? 'hide' : 'show'}`} />
            {error}
          </Col>
        </div>
      );
    }

    return ret;
  }
}
