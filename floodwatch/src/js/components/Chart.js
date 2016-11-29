// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import * as d3 from 'd3';
import _ from 'lodash';
import colors from './colors'

type Props = {
  barData: Array;
  currentTopic: string;
  side: string;
  updateMouseOver: Function;
}

type State = {
  height: Number;
}

function initialState() {
  return {
    height:500
  }
}

export class Chart extends React.Component {
  state: State;
  props: Props

  constructor(props: Props) {
    super(props);
    this.state = initialState();
  }

  componentDidMount() {
    let ctx = this;
    let svg = d3.select('.svg-' + this.props.side).append('svg').attr('width', '100%').attr('height', ctx.state.height)
    let defs = svg.append('defs')

    let keys = Object.keys(colors)
    keys.map((key) => {
      console.log(key)

      let thisGradient = defs.append('linearGradient')
        .attr('id', key)
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

  drawRects(svg, mydata) {
    // Some of this  d3is redundant, but it's tricky to strip out before testing it with the query changer. Willfix.

    let data = _.cloneDeep(mydata)
    let ctx = this;

    if (data[0] == undefined) {
      return;
    }

    let x = d3.scale.ordinal()
      .rangeRoundBands([0, 1000], 0);

    x.domain(data[0].map(function(d) {
      return d.x;
    }));
    

    let y = d3.scale.linear()
      .range([ctx.state.height, 0]);

    y.domain([0,
      d3.max(data[data.length - 1],
        function(d) { return d.y0 + d.y;})
      ])


    let layer = svg.selectAll('.stack')
      .data(data)
            

    layer.enter().append('g')
      .attr('class', 'stack ')
      .attr('width', '100%')
      .attr('fill', function(d) {
        return 'url(#' + d[0].name + ')'
      })

    layer.data(data)
      .attr('fill', function(d) {
        return 'url(#' + d[0].name + ')'
      })

    layer.exit().remove()



    let rect = layer.selectAll('rect')
      .data(function(d) {
        return d
      })

    rect.enter().append('rect')
      .attr('x', function(d) {
        return x(d.x);
      })
      .attr('y', function(d) {
        return y(d.y + d.y0);
      })
      .attr('height', function(d) {
        return y(d.y0) - y(d.y + d.y0);
      })
      .attr('class', function(d) {
        return (d.name.toLowerCase())
      })
      .attr('width', '100%')
      .on('click', function(d) {
        ctx.props.updateMouseOver(d.name)
      })
      .style('overflowY', 'hidden')


    rect.exit()
      .transition()
      .attr('width', 0)
      .remove()

    rect.data(function(d) {
      return d
    })
      .transition()
      .attr('x', function(d) {
        return x(d.x);
      })
      .attr('y', function(d) {
        return y(d.y + d.y0) 
      })
      .attr('height', function(d) {
        return y(d.y0) - y(d.y + d.y0);
      })
      .attr('width', '100%')
      .attr('stroke', function(d) {
        if (d.name == ctx.props.currentTopic) {
          return 'white'
        }
        return 'transparent'
      })
      .attr('stroke-width', function(d) {
        if (d.name == ctx.props.currentTopic) {
          return 3
        }
        return 0
      })

    let text = layer.selectAll('.text-label')
      .data(function(d) {
        return d
      })

    text.enter().append('text')
      .attr('x','50%')
      .attr('fill', 'white')
      .text(function(d) {
        if (d.y > 0.03) {
          return d.name + ' ads'
        } 
        return ''
      })
      .attr('class', 'text-label')
      .attr('text-anchor', 'middle')


    text.exit()
      .transition()
      .remove()

    text.data(function(d) {
      return d
    })
      .transition()
      .attr('x', '50%')
      .attr('y', function(d) {
        return (y(d.y + d.y0) + (y(d.y0) - y(d.y + d.y0))/2)
      })
      .text(function(d) {
        if (d.y > .03) {
          return d.name + ' ads'
        } 
        return ''
      })
            

    let percentage = layer.selectAll('.text-number')
      .data(function(d) {
        return d
      })

    percentage.enter().append('text').attr('class', 'text-number')
      .attr('x', '50%')
      .attr('y', function(d) {
        return (y(d.y + d.y0) + (y(d.y0) - y(d.y + d.y0))/2) + 9
      })
      .text(function(d){ 
        if (d.y > 0.05) {
          return Math.floor((d.y)*100) + '%'
        }
        return ''
      })
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '8px')


    percentage.data(function(d) { return d })
      .attr('x', '50%')
      .attr('y', function(d) {
        return (y(d.y + d.y0) + (y(d.y0) - y(d.y + d.y0))/2) + 9
      })
      .text(function(d){ 
        if (d.y > 0.05) {
          return Math.floor((d.y)*100) + '%'
        }
        return ''
      })
    
    layer = svg.selectAll('.stack')
      .data(data)
      .exit().remove()

    layer.selectAll('rect')
      .data(function(d) {
        return d
      })
      .exit().remove()
    
  }


  componentDidUpdate() {
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
