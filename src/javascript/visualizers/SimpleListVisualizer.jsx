import React from 'react';
import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {format} from 'd3-format';
import {sortBy, reverse, max, range, copy} from 'lodash';
import colors from './color-set';

export default class SimpleListVisualizer extends React.Component {
  constructor(props) {
    super(props);
    this.width = 100;
    this.scale = scaleLinear().domain([0,max(props.features.map(x=>Math.abs(x.effect)))]).range([0,this.width]);
  }

  render() {

    // build the rows of the
    let sortedFeatureInds = reverse(sortBy(range(this.props.features.length), i=>Math.abs(this.props.features[i].effect)));
    let rows = sortedFeatureInds.map(i => {
      let x = this.props.features[i];
      let name = this.props.featureNames[i]
      let tmp = this.scale(Math.abs(x.effect));
      let margin = x.effect < 0 ? this.width-tmp : 0;
      let style = {
        width: this.scale(Math.abs(x.effect)),
        marginLeft: margin,
        height: "20px",
        background: x.effect < 0 ? colors.colors[0] : colors.colors[1],
        display: "inline-block"
      };
      let beforeLabel;
      let afterLabel;
      let beforeLabelStyle = {
        lineHeight: "20px",
        display: "inline-block",
        width: this.width+40,
        verticalAlign: "top",
        marginRight: "5px",
        textAlign: "right"
      };
      let afterLabelStyle = {
        lineHeight: "20px",
        display: "inline-block",
        width: this.width+40,
        verticalAlign: "top",
        marginLeft: "5px"
      };
      if (x.effect < 0) {
        afterLabel = <span style={afterLabelStyle}>{name}</span>
        beforeLabelStyle.width = 40;
        beforeLabelStyle.textAlign = "right";
        beforeLabelStyle.color = "#999";
        beforeLabelStyle.fontSize = "13px";
        beforeLabel = <span style={beforeLabelStyle}>{x.effect}</span>
      } else {
        beforeLabelStyle.textAlign = "right";
        beforeLabel = <span style={beforeLabelStyle}>{name}</span>
        afterLabelStyle.width = 40;
        afterLabelStyle.textAlign = "left";
        afterLabelStyle.color = "#999";
        afterLabelStyle.fontSize = "13px";
        afterLabel = <span style={afterLabelStyle}>{x.effect}</span>
      }

      return <div key={i} style={{marginTop: "2px"}}>
        {beforeLabel}
        <div style={style}></div>
        {afterLabel}
      </div>
    });


    return (
      <span>
        {rows}
      </span>
    );
  }
}
