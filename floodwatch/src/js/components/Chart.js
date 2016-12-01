// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import * as d3 from 'd3';
import _ from 'lodash';
import colors from './colors'
import type {StackedData} from './FilterParent'
import TopicKeys from '../../stubbed_data/topic_keys.json';

type PropsType = {
  barData: Array<Array<StackedData>>,
  currentTopic: string,
  side: string,
  updateMouseOver: (topic: string) => void
};

type StateType = {
  height: number,
  svg?: mixed
};

function initialState(): StateType {
  return {
    height:500,
    // svg: null
  }
}

export class Chart extends Component {
  state: StateType;
  props: PropsType;

  constructor(props: PropsType): void {
    super(props);
    this.state = initialState();
  }

  componentDidMount(): void {
    const ctx = this;
    let svg = d3.select('.svg-' + this.props.side).append('svg').attr('width', '100%').attr('height', ctx.state.height)
    let defs = svg.append('defs')

    const keys = Object.keys(colors)
    keys.map((key: string): void => {
      let thisGradient = defs.append('linearGradient')
        .attr('id', key.replace(/[\/\s,\-!]+/g, ""))
        .attr('x1', '0%')
        .attr('x2', '100%')
        .attr('y1', '0%')
        .attr('y2', '100%');

      thisGradient.append('stop')
        .attr('class', 'start')
        .attr('offset', '0%')
        .attr('stop-color', colors[key][1])
        .attr('stop-opacity', 1);

      thisGradient.append('stop')
        .attr('class', 'end')
        .attr('offset', '90%')
        .attr('stop-color', colors[key][0])
        .attr('stop-opacity', 1);

    })

    this.drawRects(svg, this.props.barData);
    this.setState({
      svg: svg,
    })
  }

  drawRects(svg: any, mydata: Array<Array<StackedData>>): void {
    // Some of this  d3is redundant, but it's tricky to strip out before testing it with the query changer. Willfix.

    const data = _.cloneDeep(mydata)
    let ctx = this;

    if (data[0] == undefined) {
      return;
    }

    const x = d3.scale.ordinal()
      .rangeRoundBands([0, 1000], 0)
      .domain(data[0].map((d: Object): number => {
        return d.x;
      }));
    

    const y = d3.scale.linear()
      .range([ctx.state.height, 0])
      .domain([0,
      d3.max(data[data.length - 1],
        (d: Object): number => { return d.y0 + d.y;})
      ])


    let layer = svg.selectAll('.stack')
      .data(data)
            

    layer.enter().append('g')
      .attr('class', 'stack ')
      .attr('width', '100%')
      .attr('fill', (d: Object): string => {
        return 'url(#' + TopicKeys[d[0].name].replace(/[\/\s,\-!]+/g, "") + ')'
      })

    layer.data(data)
      .attr('fill', (d: Object): string => {
        return 'url(#' + TopicKeys[d[0].name].replace(/[\/\s,\-!]+/g, "") + ')'
      })

    layer.exit().remove()



    let rect = layer.selectAll('rect')
      .data((d: Object): Object => {
        return d
      })

    rect.enter().append('rect')
      .attr('x', (d: Object): number => {
        return x(d.x);
      })
      .attr('y', (d: Object): number => {
        return y(d.y + d.y0);
      })
      .attr('height', (d: Object): number => {
        return y(d.y0) - y(d.y + d.y0);
      })
      .attr('class', (d: Object): string => {
        return (d.name.toLowerCase())
      })
      .attr('width', '100%')
      .on('click', (d: Object): void => {
        this.props.updateMouseOver(d.name)
      })
      .style('overflowY', 'hidden')


    rect.exit()
      .transition()
      .attr('width', 0)
      .remove()

    rect.data((d: Object): Object => {
      return d
    })
      .transition()
      .attr('x', (d: Object): number => {
        return x(d.x);
      })
      .attr('y', (d: Object): number => {
        return y(d.y + d.y0) 
      })
      .attr('height', (d: Object): number => {
        return y(d.y0) - y(d.y + d.y0);
      })
      .attr('width', '100%')
      .attr('stroke', (d: Object): string => {
        if (d.name == this.props.currentTopic) {
          return 'white'
        }
        return 'transparent'
      })
      .attr('stroke-width', (d: Object): number => {
        if (d.name == this.props.currentTopic) {
          return 3
        }
        return 0
      })

    let text = layer.selectAll('.text-label')
      .data((d: Object): Object => {
        return d
      })

    text.enter().append('text')
      .attr('x','50%')
      .attr('fill', 'white')
      .text((d: Object): string => {
        if (d.y > 0.03) {
          const myName = TopicKeys[+d.name];
          return myName + ' ads'
        } 
        return ''
      })
      .attr('class', 'text-label')
      .attr('text-anchor', 'middle')


    text.exit()
      .transition()
      .remove()

    text.data((d: Object): Object => {
      return d
    })
      .transition()
      .attr('x', '50%')
      .attr('y', (d: Object): number => {
        return (y(d.y + d.y0) + (y(d.y0) - y(d.y + d.y0))/2)
      })
      .text((d: Object): mixed => {
        if (d.y > .03) {
          const myName = TopicKeys[+d.name];
          return myName + ' ads'
        } 
        return ''
      })
            

    let percentage = layer.selectAll('.text-number')
      .data((d: Object): Object => {
        return d
      })

    percentage.enter().append('text').attr('class', 'text-number')
      .attr('x', '50%')
      .attr('y', (d: Object): number => {
        return (y(d.y + d.y0) + (y(d.y0) - y(d.y + d.y0))/2) + 9
      })
      .text((d: Object): string =>{ 
        if (d.y > 0.05) {
          return Math.floor((d.y)*100) + '%'
        }
        return ''
      })
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '8px')


    percentage.data((d: Object): Object => { return d })
      .attr('x', '50%')
      .attr('y', (d: Object): number => {
        return (y(d.y + d.y0) + (y(d.y0) - y(d.y + d.y0))/2) + 9
      })
      .text((d: Object): mixed => { 
        if (d.y > 0.05) {
          return Math.floor((d.y)*100) + '%'
        }
        return ''
      })
    
    layer = svg.selectAll('.stack')
      .data(data)
      .exit().remove()

    layer.selectAll('rect')
      .data((d: Object): Object => {
        return d
      })
      .exit().remove()
  
  }


  componentDidUpdate(): void {
    if (this.state.svg) {
      this.drawRects(this.state.svg, this.props.barData)  
    }
  }

  render() {
    return  (
      <div className={'chart_svg svg-' + this.props.side}>
      </div>
    )
  }
}
