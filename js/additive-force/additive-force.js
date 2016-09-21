import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {format} from 'd3-format';
import {axisBottom} from 'd3-axis';
import {line} from 'd3-shape';
import {rgb,hsl,lab} from 'd3-color';
import {sortBy, sum, map, filter, debounce, findIndex} from 'lodash';

export class AdditiveForce extends HTMLElement {
  constructor() {
    super(); // pollyfill hack
    this.innerHTML = `
<style>
  :host {
    display: block;
    font-family: arial, sans-serif;
  }
  .force-bar-axis path {
    fill: none;
    opacity: 0.4;
  }
  .force-bar-axis paths {
    display: none;
  }

  .force-bar {
    font-family: arial, sans-serif;
    background: #fff;
    color: #fff;
    border: none;
    /*position: fixed;
    bottom: 0px;
    left: 0px;
    right: 0px;*/
    width: 100%;
    text-align: center;
    /*box-shadow: 0px 0px 7px rgba(0,0,0,.4);*/
  }

  .tick line {
    stroke: #000;
    stroke-width: 1px;
    opacity: 0.4;
  }

  .tick text {
    fill: #000;
    opacity: 0.5;
    font-size: 12px;
    padding: 0px;
  }
  .force-bar-blocks {
    stroke: none;
  }
  .force-bar-labels {
    stroke: none;
    font-size: 12px;
  }
  .force-bar-labelBacking {
    stroke: none;
    opacity: 0.2;
  }
  .force-bar-labelLinks {
    stroke-opacity: 0.5;
    stroke-width: 1px;
  }
  .force-bar-blockDividers {
    opacity: 1.0;
    stroke-width: 2px;
    fill: none;
  }
  .force-bar-labelDividers {
    height: 21px;
    width: 1px;
  }
</style>
<div class="force-bar-wrapper">
  <svg class="force-bar" style="user-select: none; -webkit-user-select: none; display: block;">
    <g class="mainGroup"><g class="force-bar-axis" transform="translate(0,35)"></g></g>
    <g class="onTopGroup"></g>
    <text class="baseValueTitle"></text>
    <line class="joinPointLine"></line>
    <text class="joinPointLabelOutline"></text>
    <text class="joinPointLabel"></text>
    <text class="joinPointTitleLeft"></text>
    <text class="joinPointTitleLeftArrow"></text>
    <text class="joinPointTitle"></text>
    <text class="joinPointTitleRightArrow"></text>
    <text class="joinPointTitleRight"></text>
  </svg>
</div>
    `;

    this.colors = [
      "rgb(245, 39, 87)", "rgb(30, 136, 229)", "#FF9902", "#0C9618", "#0099C6",
      "#990099", "#DD4477", "#66AA00", "#B82E2E", "#316395",
      "#994499", "#22AA99", "#AAAA11", "#6633CC", "#E67300"
    ].map(x => hsl(x));
    window.this_af = this;

    this.root = select(this);
    this.wrapper = this.root.select('.force-bar-wrapper');
    this.svg = this.root.select('.force-bar');
    this.group = this.root.select(".mainGroup");
    this.onTopGroup = this.root.select(".onTopGroup");
    this.axisElement = this.root.select(".force-bar-axis");
    this.redraw = debounce(() => this.draw(this.lastExplanation), 200);
    this.baseValue = 0;
    let tickFormat = format(",.2f");

    this.colors.map((c,i) => {
      let grad = this.svg.append("linearGradient")
        .attr("id", "linear-grad-"+i)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
      grad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", c)
        .attr("stop-opacity", 0.6);
      grad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", c)
        .attr("stop-opacity", 0);

      let grad2 = this.svg.append("linearGradient")
        .attr("id", "linear-backgrad-"+i)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
      grad2.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", c)
        .attr("stop-opacity", 0.5);
      grad2.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", c)
        .attr("stop-opacity", 0);
    });

    this.scaleCentered = scaleLinear();
    this.axis = axisBottom()
      .scale(this.scaleCentered)
      .tickSizeInner(4)
      .tickSizeOuter(0)
      .tickFormat(d => tickFormat(this.invLinkFunction(d)))
      .tickPadding(-18);
  }

  static get observedAttributes() {
    return ["explanation"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.draw(JSON.parse(newValue));
  }

  connectedCallback() {
    window.addEventListener("resize", this.redraw);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.redraw);
  }

  invLinkFunction(x) { return this.baseValue + x; }

  draw(explanation) {
    this.lastExplanation = explanation;

    this.baseValue = explanation.baseValue;
    if (explanation.link === "identity") {
      this.invLinkFunction = x => this.baseValue + x; // logistic is inverse of logit
    } else if (explanation.link === "logit") {
      this.invLinkFunction = x => 1/(1+Math.exp(-(this.baseValue + x))); // logistic is inverse of logit
    } else {
      console.log("ERROR: Unrecognized link function: ", explanation.link)
    }


    let data = sortBy(explanation.features, x=>-1/(x.effect+1e-10));
    let width = this.wrapper.node().offsetWidth;
    if (width == 0) return setTimeout(() => this.draw(explanation), 500);
    this.svg.style('height', 150);
    this.topOffset = 50; // 35
    console.log("width", width)
    let totalEffect = sum(map(data, x=>Math.abs(x.effect)));
    let totalPosEffects = sum(map(filter(data, x=>x.effect>0), x=>x.effect)) || 0;
    let totalNegEffects = sum(map(filter(data, x=>x.effect<0), x=>-x.effect)) || 0;
    this.domainSize = Math.max(totalPosEffects, totalNegEffects)*3;
    let scale = scaleLinear().domain([0, this.domainSize]).range([0,width]);
    let scaleOffset = width/2 - scale(totalNegEffects);

    this.scaleCentered.domain([-this.domainSize/2, this.domainSize/2]).range([0,width]).clamp(true);
    this.axisElement.attr("transform", "translate(0,"+this.topOffset+")").call(this.axis);

    // calculate the position of the join point between positive and negative effects
    // and also the positions of each feature effect block
    let pos = 0, i, joinPoint, joinPointIndex;
    for (i=0; i < data.length; ++i) {
      data[i].x = pos;
      if (data[i].effect < 0 && joinPoint === undefined) {
        joinPoint = pos;
        joinPointIndex = i;
      }
      pos += Math.abs(data[i].effect);
    }
    if (joinPoint === undefined) {
      joinPoint = pos;
      joinPointIndex = i;
    }

    let lineFunction = line()
      .x(d => d[0])
      .y(d => d[1]);
    let blocks = this.group.selectAll(".force-bar-blocks").data(data);
    blocks.enter().append("path")
        .attr("class", "force-bar-blocks")
      .merge(blocks)
        .attr("d", (d,i) => {
          let x = scale(d.x)+scaleOffset;
          let w = scale(Math.abs(d.effect));
          let pointShiftStart = (d.effect<0 ? -4 : 4);
          let pointShiftEnd = pointShiftStart;
          if (i === joinPointIndex) pointShiftStart = 0;
          if (i === joinPointIndex-1) pointShiftEnd = 0;
          return lineFunction([
            [x, 6+this.topOffset],
            [x+w, 6+this.topOffset],
            [x+w+pointShiftEnd, 14.5+this.topOffset],
            [x+w, 23+this.topOffset],
            [x, 23+this.topOffset],
            [x+pointShiftStart, 14.5+this.topOffset],
          ]);
        })
        .attr("fill", d=>d.effect > 0 ? this.colors[0] : this.colors[1]);
    blocks.exit().remove();

    let filteredData = _.filter(data, d => {
      return scale(Math.abs(d.effect)) > scale(totalEffect)/50
        && scale(Math.abs(d.effect)) > 10;
    });

    let labels = this.onTopGroup.selectAll(".force-bar-labels").data(filteredData);
    labels = labels.enter().append("text")
        .attr("class", "force-bar-labels")
        .attr("y", d => 48+this.topOffset)
      .merge(labels)
        .text(d => d.value !== undefined && d.value != null ? d.name+" = "+d.value : d.name)
        .attr("fill", d=>d.effect > 0 ? this.colors[0] : this.colors[1])
        .attr("stroke", function(d, i) {
          d.textWidth = Math.max(this.getComputedTextLength(), scale(Math.abs(d.effect))-10);
          d.innerTextWidth = this.getComputedTextLength();
          return "none";
        });
    labels.exit().remove();
    this.filteredData = filteredData;

    // compute where the text labels should go
    pos = joinPoint + scale.invert(5);
    for (let i=joinPointIndex; i < data.length; ++i) {
      data[i].textx = pos;
      pos += scale.invert(data[i].textWidth+10);
    }
    pos = joinPoint - scale.invert(5);
    for (let i=joinPointIndex-1; i >= 0; --i) {
      data[i].textx = pos;
      pos -= scale.invert(data[i].textWidth+10);
    }

    labels
        .attr("x", d =>scale(d.textx) + scaleOffset + (d.effect > 0 ? -d.textWidth/2 : d.textWidth/2))
        .attr("text-anchor", "middle")//d => d.effect > 0 ? 'end' : 'start');

    // Now that we know the text widths we further filter by what fits on the screen
    filteredData = filter(filteredData, d => {
      return scale(d.textx) + scaleOffset > 20 && scale(d.textx) + scaleOffset < width - 20;
    });
    this.filteredData2 = filteredData;

    // Build an array with one extra feature added
    let filteredDataPlusOne = filteredData.slice();
    let ind = findIndex(data, filteredData[0])-1;
    if (ind >= 0) filteredDataPlusOne.unshift(data[ind]);

    let labelBacking = this.group.selectAll(".force-bar-labelBacking").data(filteredData);
    labelBacking.enter().append("path")
        .attr("class", "force-bar-labelBacking")
      .merge(labelBacking)
        .attr("d", d => {
          return lineFunction([
            [scale(d.x) + scale(Math.abs(d.effect)) + scaleOffset, 23+this.topOffset],
            [(d.effect > 0 ? scale(d.textx) : scale(d.textx) + d.textWidth) + scaleOffset + 5, 33+this.topOffset],
            [(d.effect > 0 ? scale(d.textx) : scale(d.textx) + d.textWidth) + scaleOffset + 5, 54+this.topOffset],
            [(d.effect > 0 ? scale(d.textx) - d.textWidth : scale(d.textx)) + scaleOffset - 5, 54+this.topOffset],
            [(d.effect > 0 ? scale(d.textx) - d.textWidth : scale(d.textx)) + scaleOffset - 5, 33+this.topOffset],
            [scale(d.x) + scaleOffset, 23+this.topOffset]
          ]);
        })
        .attr("fill", d => `url(#linear-backgrad-${d.effect > 0 ? 0 : 1})`);
    labelBacking.exit().remove();

    let labelDividers = this.group.selectAll(".force-bar-labelDividers").data(filteredData.slice(0,-1));
    labelDividers.enter().append("rect")
        .attr("class", "force-bar-labelDividers")
        .attr("y", 33+this.topOffset)
      .merge(labelDividers)
        .attr("x", d => (d.effect > 0 ? scale(d.textx) : scale(d.textx) + d.textWidth) + scaleOffset + 4.5)
        .attr("fill", d => `url(#linear-grad-${d.effect > 0 ? 0 : 1})`);
    labelDividers.exit().remove();

    let labelLinks = this.group.selectAll(".force-bar-labelLinks").data(filteredData.slice(0,-1));
    labelLinks.enter().append("line")
        .attr("class", "force-bar-labelLinks")
        .attr("y1", 23+this.topOffset)
        .attr("y2", 33+this.topOffset)
      .merge(labelLinks)
        .attr("x1", d => scale(d.x) + scale(Math.abs(d.effect)) + scaleOffset)
        .attr("x2", d => (d.effect > 0 ? scale(d.textx) : scale(d.textx) + d.textWidth) + scaleOffset + 5)
        .attr("stroke", d=>d.effect > 0 ? this.colors[0] : this.colors[1]);
    labelLinks.exit().remove();

    let blockDividers = this.group.selectAll(".force-bar-blockDividers").data(data.slice(0,-1));
    blockDividers.enter().append("path")
        .attr("class", "force-bar-blockDividers")
      .merge(blockDividers)
        .attr("d", d => {
          let pos = scale(d.x) + scale(Math.abs(d.effect)) + scaleOffset;
          return lineFunction([
            [pos, 6+this.topOffset],
            [pos+(d.effect<0 ? -4 : 4), 14.5+this.topOffset],
            [pos, 23+this.topOffset]
          ]);
        })
        .attr("stroke", (d,i) => {
          if (joinPointIndex === i+1 || Math.abs(d.effect) < 1e-8) return "#rgba(0,0,0,0)";
          else if (d.effect > 0) return this.colors[0].brighter(1.6);
          else return this.colors[1].brighter(1.6);
        });
    blockDividers.exit().remove();

    this.root.select('.joinPointLine')
        .attr("x1", scale(joinPoint) + scaleOffset)
        .attr("x2", scale(joinPoint) + scaleOffset)
        .attr("y1", 0+this.topOffset)
        .attr("y2", 6+this.topOffset)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("opacity", 1);

    this.root.select('.joinPointLabelOutline')
        .attr("x", scale(joinPoint) + scaleOffset)
        .attr("y", -5+this.topOffset)
        .attr("color", "#fff")
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr("stroke", "#fff")
        .attr("stroke-width", 6)
        .text(format(",.2f")(this.invLinkFunction(joinPoint - totalNegEffects)))
        .attr("opacity", 1);

    this.root.select('.joinPointLabel')
        .attr("x", scale(joinPoint) + scaleOffset)
        .attr("y", -5+this.topOffset)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr("fill", "#000")
        .text(format(",.2f")(this.invLinkFunction(joinPoint - totalNegEffects)))
        .attr("opacity", 1);

    this.root.select('.joinPointTitle')
        .attr("x", scale(joinPoint) + scaleOffset)
        .attr("y", -22+this.topOffset)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12')
        .attr("fill", "#000")
        .text(explanation.outNames[0])
        .attr("opacity", 0.5);

    this.root.select('.joinPointTitleLeft')
        .attr("x", scale(joinPoint) + scaleOffset - 16)
        .attr("y", -38+this.topOffset)
        .attr('text-anchor', 'end')
        .attr('font-size', '13')
        .attr("fill", this.colors[0])
        .text("higher")
        .attr("opacity", 1.0);
    this.root.select('.joinPointTitleRight')
        .attr("x", scale(joinPoint) + scaleOffset + 16)
        .attr("y", -38+this.topOffset)
        .attr('text-anchor', 'start')
        .attr('font-size', '13')
        .attr("fill", this.colors[1])
        .text("lower")
        .attr("opacity", 1.0);
    this.root.select('.joinPointTitleLeftArrow')
        .attr("x", scale(joinPoint) + scaleOffset + 7)
        .attr("y", -42+this.topOffset)
        .attr('text-anchor', 'end')
        .attr('font-size', '13')
        .attr("fill", this.colors[0])
        .text("→")
        .attr("opacity", 1.0);
    this.root.select('.joinPointTitleRightArrow')
        .attr("x", scale(joinPoint) + scaleOffset - 7)
        .attr("y", -36+this.topOffset)
        .attr('text-anchor', 'start')
        .attr('font-size', '13')
        .attr("fill", this.colors[1])
        .text("←")
        .attr("opacity", 1.0);
    this.root.select('.baseValueTitle')
        .attr("x", this.scaleCentered(0))
        .attr("y", -22+this.topOffset)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12')
        .attr("fill", "#000")
        .text("base value")
        .attr("opacity", 0.5);
  }
}

try {
  customElements.define('additive-force', AdditiveForce);
} catch (e) {
  console.log("additive-force element already registered...")
}
