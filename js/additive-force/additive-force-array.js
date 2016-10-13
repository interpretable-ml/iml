import {select, mouse} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {format} from 'd3-format';
import {axisBottom, axisLeft} from 'd3-axis';
import {line} from 'd3-shape';
import {rgb,hsl,lab} from 'd3-color';
import {cloneDeep, min, max, sortBy, sum, map, filter, debounce, findIndex, range, rangeRight, shuffle, keys} from 'lodash';

export class AdditiveForceArray extends HTMLElement {
  constructor() {
    super(); // pollyfill hack
    this.innerHTML = `
<style>
  :host {
    display: block;
    font-family: arial, sans-serif;
  }
  .force-bar-array-wrapper {
    text-align: center;
  }
  .force-bar-array-xaxis path {
    fill: none;
    opacity: 0.4;
  }
  .force-bar-array-xaxis .domain {
    opacity: 0;
  }
  .force-bar-array-xaxis paths {
    display: none;
  }
  .force-bar-array-yaxis path {
    fill: none;
    opacity: 0.4;
  }
  .force-bar-array-yaxis paths {
    display: none;
  }

  .force-bar-array {
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
  .force-bar-array-blocks {
    stroke: none;
  }
  .force-bar-array-labels {
    stroke: none;
    font-size: 12px;
  }
  .force-bar-array-labelBacking {
    stroke: none;
    opacity: 0.2;
  }
  .force-bar-array-labelLinks {
    stroke-opacity: 0.5;
    stroke-width: 1px;
  }
  .force-bar-array-blockDividers {
    opacity: 1.0;
    stroke-width: 2px;
    fill: none;
  }
  .force-bar-array-labelDividers {
    height: 21px;
    width: 1px;
  }
  .force-bar-array-flabels {
    font-size: 12px;
    fill: #fff;
    text-anchor: middle;
  }
  .additive-force-array-xlabel {
    background: none;
    border: 1px solid #ccc;
    opacity: 0.5;
    margin-bottom: 0px;
    font-size: 12px;
    font-family: arial;
    margin-left: 80px;
    max-width: 300px;
  }
  .additive-force-array-xlabel:focus {
    outline: none;
  }
  .additive-force-array-ylabel {
    position: relative;
    top: 0px;
    left: 0px;
    transform: rotate(-90deg);
    background: none;
    border: 1px solid #ccc;
    opacity: 0.5;
    margin-bottom: 0px;
    font-size: 12px;
    font-family: arial;
    max-width: 150px;
  }
  .additive-force-array-ylabel:focus {
    outline: none;
  }
  .additive-force-array-hoverLine {
    stroke-width: 1px;
    stroke: #fff;
    opacity: 1;
  }
  .additive-force-array-hoverx {
    text-anchor: middle;
    font-weight: bold;
    fill: #000;
    font-size: 12px;
  }
  .additive-force-array-hoverxOutline {
    text-anchor: middle;
    font-weight: bold;
    fill: #fff;
    stroke: #fff;
    stroke-width: 6;
    font-size: 12px;
  }
  .additive-force-array-hoverxTitle {
    font-size: 12px;
    text-anchor: middle;
    opacity: 0.6;
  }
  .additive-force-array-hovery {
    text-anchor: end;
    font-weight: bold;
    fill: #000;
    font-size: 12px;
  }
  .additive-force-array-hoveryOutline {
    text-anchor: end;
    font-weight: bold;
    fill: #fff;
    stroke: #fff;
    stroke-width: 6;
    font-size: 12px;
  }
</style>
<div class="force-bar-array-wrapper">
  <select class="additive-force-array-xlabel">
  </select>
  <div style="height: 0px; text-align: left;">
    <select class="additive-force-array-ylabel">
    </select>
  </div>
  <svg class="force-bar-array" style="user-select: none; -webkit-user-select: none; display: block;">
    <g class="mainGroup"></g>
    <g class="onTopGroup"><g class="force-bar-array-xaxis" transform="translate(0,35)"></g><g class="force-bar-array-yaxis" transform="translate(0,35)"></g></g>
    <g class="additive-force-array-hoverGroup1"></g>
    <g class="additive-force-array-hoverGroup2"></g>
    <text class="baseValueTitle"></text>
    <line class="additive-force-array-hoverLine"></line>
    <text class="additive-force-array-hoverxOutline"></text>
    <text class="additive-force-array-hoverx"></text>
    <text class="additive-force-array-hoverxTitle"></text>
    <text class="additive-force-array-hoveryOutline"></text>
    <text class="additive-force-array-hovery"></text>
    <text class="joinPointTitleLeft"></text>
    <text class="joinPointTitleLeftArrow"></text>
    <text class="additive-force-array-yla9bel"></text>
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
    window.this_arrf = this;

    this.root = select(this);
    this.wrapper = this.root.select('.force-bar-array-wrapper');
    this.svg = this.root.select('.force-bar-array');
    this.group = this.root.select(".mainGroup");
    this.onTopGroup = this.root.select(".onTopGroup");
    this.xaxisElement = this.root.select(".force-bar-array-xaxis");
    this.yaxisElement = this.root.select(".force-bar-array-yaxis");
    this.xlabel = this.root.select('.additive-force-array-xlabel');
    this.ylabel = this.root.select('.additive-force-array-ylabel');
    this.hoverLine = this.root.select('.additive-force-array-hoverLine');
    this.hoverx = this.root.select('.additive-force-array-hoverx');
    this.hoverxOutline = this.root.select('.additive-force-array-hoverxOutline');
    this.hoverxTitle = this.root.select('.additive-force-array-hoverxTitle');
    this.hovery = this.root.select('.additive-force-array-hovery');
    this.hoveryOutline = this.root.select('.additive-force-array-hoveryOutline');
    this.hoverGroup1 = this.root.select('.additive-force-array-hoverGroup1');
    this.hoverGroup2 = this.root.select('.additive-force-array-hoverGroup2');
    this.redraw = debounce(() => this.draw(this.lastExplanation), 200);
    this.lastData = {baseValue: 0};
    this.topOffset = 28;
    this.leftOffset = 80;
    this.height = 350;
    this.tickFormat = format(",.4");

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

    this.xscale = scaleLinear();
    this.xaxis = axisBottom()
      .scale(this.xscale)
      .tickSizeInner(4)
      .tickSizeOuter(0)
      .tickFormat(d => this.tickFormat(d))
      .tickPadding(-18);

    this.yscale = scaleLinear();
    this.yaxis = axisLeft()
      .scale(this.yscale)
      .tickSizeInner(4)
      .tickSizeOuter(0)
      .tickFormat(d => this.tickFormat(this.invLinkFunction(d)))
      .tickPadding(2);

    this.xlabel.node().onchange = x => this.internalDraw();
    this.ylabel.node().onchange = x => this.internalDraw();

    //setInterval(x => this.internalDraw(), 1000);

    this.svg.on("mousemove", x => this.mouseMoved(x));
    this.svg.on("mouseout", x => this.mouseLeft(x));
  }

  static get observedAttributes() {
    return ["explanations"];
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

  invLinkFunction(x) { return this.lastData.baseValue + x; }

  mouseLeft(event) {
    this.hoverLine.attr("display", "none");
    this.hoverx.attr("display", "none");
    this.hoverxOutline.attr("display", "none");
    this.hoverxTitle.attr("display", "none");
    this.hovery.attr("display", "none");
    this.hoveryOutline.attr("display", "none");
    this.hoverGroup1.attr("display", "none");
    this.hoverGroup2.attr("display", "none");
  }

  mouseMoved(event) {
    let i, nearestExp;

    this.hoverLine.attr("display", "");
    this.hoverx.attr("display", "");
    this.hoverxOutline.attr("display", "");
    this.hoverxTitle.attr("display", "");
    this.hovery.attr("display", "");
    this.hoveryOutline.attr("display", "");
    this.hoverGroup1.attr("display", "");
    this.hoverGroup2.attr("display", "");

    let x = mouse(this.svg.node())[0];
    if (this.currExplanations) {
      for (i = 0; i < this.currExplanations.length; ++i) {
        if (!nearestExp || Math.abs(nearestExp.xmapScaled-x) > Math.abs(this.currExplanations[i].xmapScaled-x)) {
          nearestExp = this.currExplanations[i];
        }
      }

      this.hoverLine
          .attr("x1", nearestExp.xmapScaled)
          .attr("x2", nearestExp.xmapScaled)
          .attr("y1", 0+this.topOffset)
          .attr("y2", this.height);

      this.hoverx
          .attr("x", nearestExp.xmapScaled)
          .attr("y", this.topOffset-5)
          .text(this.tickFormat(nearestExp.xmap));
      this.hoverxOutline
          .attr("x", nearestExp.xmapScaled)
          .attr("y", this.topOffset-5)
          .text(this.tickFormat(nearestExp.xmap));
      this.hoverxTitle
          .attr("x", nearestExp.xmapScaled)
          .attr("y", this.topOffset-18)
          .text(nearestExp.count > 1 ? nearestExp.count+" averaged samples" : "");

      this.hovery
          .attr("x", this.leftOffset-6)
          .attr("y", nearestExp.joinPointy)
          .text(this.tickFormat(this.invLinkFunction(nearestExp.joinPoint)));
      this.hoveryOutline
          .attr("x", this.leftOffset-6)
          .attr("y", nearestExp.joinPointy)
          .text(this.tickFormat(this.invLinkFunction(nearestExp.joinPoint)));

      let P = this.lastData.featureNames.length;

      let posFeatures = [];
      let lastPos, pos;
      for (let j = this.currPosOrderedFeatures.length-1; j >= 0; --j) {
        let i = this.currPosOrderedFeatures[j];
        let d = nearestExp.features[i];
        pos = 5+(d.posyTop + d.posyBottom)/2;
        if ((!lastPos || pos - lastPos >= 15) && (d.posyTop - d.posyBottom) >= 6) {
          posFeatures.push(d);
          lastPos = pos;
        }
      }

      let negFeatures = [];
      lastPos = undefined;
      for (let i of this.currNegOrderedFeatures) {
        let d = nearestExp.features[i];
        pos = 5+(d.negyTop + d.negyBottom)/2;
        if ((!lastPos || lastPos - pos >= 15) && (d.negyTop - d.negyBottom) >= 6) {
          negFeatures.push(d);
          lastPos = pos;
        }
      }

      let labelFunc = d => {
        let valString = "";
        if (d.value !== null && d.value !== undefined) valString = " = "+this.tickFormat(d.value);
        if (nearestExp.count > 1) {
          return "mean("+this.lastData.featureNames[d.ind]+")"+valString ;
        } else {
          return this.lastData.featureNames[d.ind]+valString;
        }
      };

      let featureHoverLabels1 = this.hoverGroup1.selectAll(".pos-values").data(posFeatures);
      featureHoverLabels1.enter().append("text")
          .attr("class", "pos-values")
        .merge(featureHoverLabels1)
          .attr("x", nearestExp.xmapScaled+5)
          .attr("y", d => 4+(d.posyTop + d.posyBottom)/2)
          .attr("text-anchor", "start")
          .attr("font-size", 12)
          .attr("stroke", "#fff")
          .attr("fill", "#fff")
          .attr("stroke-width", "4")
          .attr("stroke-linejoin", "round")
          .attr("opacity", 1)
          .text(labelFunc);
      featureHoverLabels1.exit().remove();

      let featureHoverLabels2 = this.hoverGroup2.selectAll(".pos-values").data(posFeatures);
      featureHoverLabels2.enter().append("text")
          .attr("class", "pos-values")
        .merge(featureHoverLabels2)
          .attr("x", nearestExp.xmapScaled+5)
          .attr("y", d => 4+(d.posyTop + d.posyBottom)/2)
          .attr("text-anchor", "start")
          .attr("font-size", 12)
          .attr("fill", this.colors[0])
          .text(labelFunc);
      featureHoverLabels2.exit().remove();

      let featureHoverNegLabels1 = this.hoverGroup1.selectAll(".neg-values").data(negFeatures);
      featureHoverNegLabels1.enter().append("text")
          .attr("class", "neg-values")
        .merge(featureHoverNegLabels1)
          .attr("x", nearestExp.xmapScaled+5)
          .attr("y", d => 4+(d.negyTop + d.negyBottom)/2)
          .attr("text-anchor", "start")
          .attr("font-size", 12)
          .attr("stroke", "#fff")
          .attr("fill", "#fff")
          .attr("stroke-width", "4")
          .attr("stroke-linejoin", "round")
          .attr("opacity", 1)
          .text(labelFunc);
      featureHoverNegLabels1.exit().remove();

      let featureHoverNegLabels2 = this.hoverGroup2.selectAll(".neg-values").data(negFeatures);
      featureHoverNegLabels2.enter().append("text")
          .attr("class", "neg-values")
        .merge(featureHoverNegLabels2)
          .attr("x", nearestExp.xmapScaled+5)
          .attr("y", d => 4+(d.negyTop + d.negyBottom)/2)
          .attr("text-anchor", "start")
          .attr("font-size", 12)
          .attr("fill", this.colors[1])
          .text(labelFunc);
      featureHoverNegLabels2.exit().remove();
    }
  }

  draw(data) {
    if (data && data.explanations.length > 0) {
      this.lastData = data;
      for (let i = 0; i < data.explanations.length; ++i) data.explanations[i].simInd = i;
      for (let i = 0; i < data.explanations.length; ++i) data.explanations[i].outValue = sum(map(data.explanations[i].features, x=>x.effect)) + data.baseValue;

      // Find what features are actually used
      let posDefinedFeatures = {};
      let negDefinedFeatures = {};
      let definedFeaturesValues = {};
      for (let e of this.lastData.explanations) {
        for (let k in e.features) {
          if (posDefinedFeatures[k] === undefined) {
            posDefinedFeatures[k] = 0;
            negDefinedFeatures[k] = 0;
            definedFeaturesValues[k] = 0;
          }
          if (e.features[k].effect > 0) {
            posDefinedFeatures[k] += e.features[k].effect;
          } else {
            negDefinedFeatures[k] -= e.features[k].effect;
          }
          if (e.features[k].value !== null && e.features[k].value !== undefined) {
            definedFeaturesValues[k] += 1;
          }
        }
      }
      this.usedFeatures = sortBy(keys(posDefinedFeatures), i=>-(posDefinedFeatures[i]+negDefinedFeatures[i]));
      console.log("found ",this.usedFeatures.length," used features");

      this.posOrderedFeatures = sortBy(this.usedFeatures, i=>posDefinedFeatures[i]);
      this.negOrderedFeatures = sortBy(this.usedFeatures, i=>-negDefinedFeatures[i]);
      this.singleValueFeatures = filter(this.usedFeatures, i => definedFeaturesValues[i] > 0);

      let options = [
        "sample order by similarity",
        "sample order by output value"
      ].concat(this.singleValueFeatures.map(i=>data.featureNames[i]));
      let xLabelOptions = this.xlabel.selectAll('option').data(options);
      xLabelOptions.enter().append("option")
        .merge(xLabelOptions)
          .attr("value", d => d)
          .text(d => d);
      xLabelOptions.exit().remove();

      let n = data.outNames[0] ? data.outNames[0] : "model output value";
      options = map(this.usedFeatures, i=>[data.featureNames[i], data.featureNames[i]+" effects"])
      options.unshift(["model output value", n]);
      let yLabelOptions = this.ylabel.selectAll('option').data(options);
      yLabelOptions.enter().append("option")
        .merge(yLabelOptions)
          .attr("value", d => d[0])
          .text(d => d[1]);
      yLabelOptions.exit().remove();

      this.ylabel
          .style("top", ((this.height-10 - this.topOffset)/2 + this.topOffset) + "px")
          .style("left", (10-this.ylabel.node().offsetWidth/2)+"px")

      this.internalDraw();
    }
  }

  internalDraw() {
    if (!this.lastData) return;

    // we fill in any implicit feature values and assume they have a zero effect and value
    for (let e of this.lastData.explanations) {
      for (let i of this.usedFeatures) {
        if (!e.features.hasOwnProperty(i)) {
          e.features[i] = { effect: 0, value: 0 };
        }
        e.features[i].ind = i;
      }
    }

    let explanations;
    let xsort = this.xlabel.node().value;
    if (xsort === "sample order by similarity") {
      explanations = sortBy(this.lastData.explanations, x=>x.simInd);
      map(explanations, (e,i)=>e.xmap = i);
    } else if (xsort === "sample order by output value") {
      explanations = sortBy(this.lastData.explanations, x=>-x.outValue);
      map(explanations, (e,i)=>e.xmap = i);
    } else {
      let ind = findIndex(this.lastData.featureNames, x=>x===xsort);
      map(this.lastData.explanations, (e,i)=> e.xmap = e.features[ind].value);
      let explanations2 = sortBy(this.lastData.explanations, x=>x.xmap);
      let xvals = map(explanations2, x=>x.xmap);
      let xmin = min(xvals);
      let xmax = max(xvals);
      let binSize = (xmax - xmin)/100;

      // Build explanations where effects are averaged when the x values are identical
      explanations = [];
      let laste, copye, e;
      for (let i = 0; i < explanations2.length; ++i) {

        let e = explanations2[i];
        if (laste && (!copye && e.xmap - laste.xmap <= binSize) || (copye && e.xmap - copye.xmap <= binSize)) {
          if (!copye) {
            copye = cloneDeep(laste);
            copye.count = 1;
          }
          for (let j of this.usedFeatures) {
            copye.features[j].effect += e.features[j].effect;
            copye.features[j].value += e.features[j].value;
          }
          copye.count += 1;
        } else if (laste) {
          if (copye) {
            for (let j of this.usedFeatures) {
              copye.features[j].effect /= copye.count;
              copye.features[j].value /= copye.count;
            }
            explanations.push(copye);
            copye = undefined;
          } else {
            explanations.push(laste);
          }
        }
        laste = e;
      }
      if (laste.xmap - explanations[explanations.length-1].xmap > binSize) {
        explanations.push(laste);
      }
    }

    // adjust for the correct y-value we are plotting
    this.currUsedFeatures = this.usedFeatures;
    this.currPosOrderedFeatures = this.posOrderedFeatures;
    this.currNegOrderedFeatures = this.negOrderedFeatures;
    //let filteredFeatureNames = this.lastData.featureNames;
    let yvalue = this.ylabel.node().value;
    if (yvalue !== "model output value") {
      explanations = cloneDeep(explanations);
      let ind = findIndex(this.lastData.featureNames, x=>x===yvalue);

      for (let i = 0; i < explanations.length; ++i) {
        let v = explanations[i].features[ind];
        explanations[i].features = {};
        explanations[i].features[ind] = v;
      }
      //filteredFeatureNames = [this.lastData.featureNames[ind]];
      this.currUsedFeatures = [ind];
      this.currPosOrderedFeatures = [ind];
      this.currNegOrderedFeatures = [ind];
    }
    this.currExplanations = explanations;

    // determine the link function
    if (this.lastData.link === "identity") { // assume all links are the same
      this.invLinkFunction = x => this.lastData.baseValue + x;
    } else if (this.lastData.link === "logit") {
      this.invLinkFunction = x => 1/(1+Math.exp(-(this.lastData.baseValue + x))); // logistic is inverse of logit
    } else {
      console.log("ERROR: Unrecognized link function: ", this.lastData.link)
    }

    this.predValues = map(explanations, e=>sum(map(e.features, x=>x.effect)));

    //let data = sortBy(explanation.features, x=>x.name);
    let width = this.wrapper.node().offsetWidth;
    if (width == 0) return setTimeout(() => this.draw(explanations), 500);

    this.svg.style('height', this.height);

    let xvals = map(explanations, x=>x.xmap);
    this.xscale.domain([min(xvals), max(xvals)]).range([this.leftOffset,width]).clamp(true);
    this.xaxisElement.attr("transform", "translate(0,"+this.topOffset+")").call(this.xaxis);

    for (let i = 0; i < this.currExplanations.length; ++i) {
      this.currExplanations[i].xmapScaled = this.xscale(this.currExplanations[i].xmap);
    }

    let N = explanations.length;
    let domainSize = 0;
    for (let ind = 0; ind < N; ++ind) {
      let data2 = explanations[ind].features;
      //if (data2.length !== P) error("Explanations have differing numbers of features!");
      let totalPosEffects = sum(map(filter(data2, x=>x.effect>0), x=>x.effect)) || 0;
      let totalNegEffects = sum(map(filter(data2, x=>x.effect<0), x=>-x.effect)) || 0;
      domainSize = Math.max(domainSize, Math.max(totalPosEffects, totalNegEffects)*2.2);
    }
    this.yscale.domain([-domainSize/2,domainSize/2]).range([this.height-10, this.topOffset]);
    this.yaxisElement.attr("transform", "translate("+this.leftOffset+",0)").call(this.yaxis);

    for (let ind = 0; ind < N; ++ind) {
      let data2 = explanations[ind].features;
      //console.log(length(data2))

      let totalEffect = sum(map(data2, x=>Math.abs(x.effect)));
      let totalNegEffects = sum(map(filter(data2, x=>x.effect<0), x=>-x.effect)) || 0;

      //let scaleOffset = height/2 - this.yscale(totalNegEffects);

      // calculate the position of the join point between positive and negative effects
      // and also the positions of each feature effect block
      let pos = -totalNegEffects, i;
      for (i of this.currPosOrderedFeatures) {
        data2[i].posyTop = this.yscale(pos);
        if (data2[i].effect > 0) pos += data2[i].effect;
        data2[i].posyBottom = this.yscale(pos);
        data2[i].ind = i;
      }
      let joinPoint = pos;
      for (i of this.currNegOrderedFeatures) {
        data2[i].negyTop = this.yscale(pos);
        if (data2[i].effect < 0) pos -= data2[i].effect;
        data2[i].negyBottom = this.yscale(pos);
      }
      explanations[ind].joinPoint = joinPoint;
      explanations[ind].joinPointy = this.yscale(joinPoint);
    }

    let lineFunction = line()
      .x(d => d[0])
      .y(d => d[1]);

    let areasPos = this.group.selectAll(".force-bar-array-area-pos").data(this.currUsedFeatures);
    areasPos.enter().append("path")
        .attr("class", "force-bar-array-area-pos")
      .merge(areasPos)
        .attr("d", i => {
          let topPoints = map(range(N), j => [explanations[j].xmapScaled, explanations[j].features[i].posyTop]);
          let bottomPoints = map(rangeRight(N), j => [explanations[j].xmapScaled, explanations[j].features[i].posyBottom]);
          return lineFunction(topPoints.concat(bottomPoints));
        })
        .attr("fill", this.colors[0]);
    areasPos.exit().remove();

    let areasNeg = this.group.selectAll(".force-bar-array-area-neg").data(this.currUsedFeatures);
    areasNeg.enter().append("path")
        .attr("class", "force-bar-array-area-neg")
      .merge(areasNeg)
        .attr("d", i => {
          let topPoints = map(range(N), j => [explanations[j].xmapScaled, explanations[j].features[i].negyTop]);
          let bottomPoints = map(rangeRight(N), j => [explanations[j].xmapScaled, explanations[j].features[i].negyBottom]);
          return lineFunction(topPoints.concat(bottomPoints));
        })
        .attr("fill", this.colors[1]);
    areasNeg.exit().remove();

    let dividersPos = this.group.selectAll(".force-bar-array-divider-pos").data(this.currUsedFeatures);
    dividersPos.enter().append("path")
        .attr("class", "force-bar-array-divider-pos")
      .merge(dividersPos)
        .attr("d", i => {
          let points = map(range(N), j => [explanations[j].xmapScaled, explanations[j].features[i].posyBottom]);
          return lineFunction(points);
        })
        .attr("fill", "none")
        .attr("stroke-width", 1)
        .attr("stroke", d => this.colors[0].brighter(1.2));
    dividersPos.exit().remove();

    let dividersNeg = this.group.selectAll(".force-bar-array-divider-neg").data(this.currUsedFeatures);
    dividersNeg.enter().append("path")
        .attr("class", "force-bar-array-divider-neg")
      .merge(dividersNeg)
        .attr("d", i => {
          let points = map(range(N), j => [explanations[j].xmapScaled, explanations[j].features[i].negyTop]);
          return lineFunction(points);
        })
        .attr("fill", "none")
        .attr("stroke-width", 1)
        .attr("stroke", d => this.colors[1].brighter(1.5));
    dividersNeg.exit().remove();

    let boxBounds = function(es, ind, starti, endi, featType) {
      let maxTop, minBottom;
      if (featType === "pos") {
        maxTop = es[starti].features[ind].posyBottom;
        minBottom = es[starti].features[ind].posyTop;
      } else {
        maxTop = es[starti].features[ind].negyBottom;
        minBottom = es[starti].features[ind].negyTop;
      }
      let t, b;
      for (let i = starti+1; i <= endi; ++i) {
        if (featType === "pos") {
          t = es[i].features[ind].posyBottom;
          b = es[i].features[ind].posyTop;
        } else {
          t = es[i].features[ind].negyBottom;
          b = es[i].features[ind].negyTop;
        }
        if (t > maxTop) maxTop = t;
        if (b < minBottom) minBottom = b;
      }
      return {top: maxTop, bottom: minBottom};
    }

    let neededWidth = 100;
    let neededHeight = 20;
    let neededBuffer = 100;

    // find areas on the plot big enough for feature labels
    let featureLabels = [];
    for (let featType of ["pos", "neg"]) {
      for (let ind of this.currUsedFeatures) {
        let starti = 0, endi = 0, i, boxWidth = 0, hbounds = {top: 0, bottom: 0};
        let newHbounds;
        while (endi < N-1) {

          // make sure our box is long enough
          while (boxWidth < neededWidth && endi < N-1) {
            ++endi;
            boxWidth = explanations[endi].xmapScaled - explanations[starti].xmapScaled;
          }

          // and high enough
          hbounds = boxBounds(explanations, ind, starti, endi, featType);
          while (hbounds.bottom - hbounds.top < neededHeight && starti < endi) {
            ++starti;
            hbounds = boxBounds(explanations, ind, starti, endi, featType);
          }
          boxWidth = explanations[endi].xmapScaled - explanations[starti].xmapScaled;

          // we found a spot!
          if (hbounds.bottom - hbounds.top >= neededHeight && boxWidth >= neededWidth) {
            //console.log(`found a spot! ind: ${ind}, starti: ${starti}, endi: ${endi}, hbounds:`, hbounds)
            // make our box as long as possible
            while (endi < N-1) {
              ++endi;
              newHbounds = boxBounds(explanations, ind, starti, endi, featType);
              if (newHbounds.bottom - newHbounds.top > neededHeight) {
                hbounds = newHbounds;
              } else {
                --endi
                break;
              }
            }
            boxWidth = explanations[endi].xmapScaled - explanations[starti].xmapScaled;
            //console.log("found  ",boxWidth,hbounds)

            featureLabels.push([(explanations[endi].xmapScaled + explanations[starti].xmapScaled)/2, (hbounds.top+hbounds.bottom)/2, this.lastData.featureNames[ind]]);

            let lastEnd = explanations[endi].xmapScaled;
            starti = endi;
            while (lastEnd + neededBuffer > explanations[starti].xmapScaled && starti < N-1) {
              ++starti;
            }
            endi = starti;
          }
        }
      }
    }

    let featureLabelText = this.onTopGroup.selectAll(".force-bar-array-flabels").data(featureLabels);
    featureLabelText.enter().append("text")
        .attr("class", "force-bar-array-flabels")
      .merge(featureLabelText)
        .attr("x", d => d[0])
        .attr("y", d => d[1]+4)
        .text(d => d[2]);
    featureLabelText.exit().remove();
  }
}

try {
  customElements.define('additive-force-array', AdditiveForceArray);
} catch (e) {
  console.log("additive-force element already registered...")
}
