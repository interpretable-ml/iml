import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {format} from 'd3-format';
import {sortBy, reverse, max} from 'lodash';

export class SimpleList extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
<style>
  :host {
    display: block;
  }
  .simple-list-label {
    float: left;
    width: 150px;
    height: 30px;
    font-weight: bold;
    font-size: 12px;
    color: #000;
    text-align: right;
    line-height: 30px;
    vertical-align: middle;
    margin-bottom: 10px;
  }
  .simple-list-value {
    display: inline-block;
    height: 30px;
    font-weight: normal;
    text-align: right;
    background: #f88;
    margin-bottom: 10px;
  }
  .simple-list-padding {
    display: inline-block;
    height: 30px;
    margin-left: 10px;
    margin-bottom: 10px;
  }
</style>
<div class="simple-list-container"><div>
    `;
    this.container = this.querySelector('.simple-list-container');
  }

  static get observedAttributes() {
    return ["explanation"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.draw(JSON.parse(newValue));
  }

  draw(explanation) {

    let scale = scaleLinear().domain([0,max(explanation.features.map(x=>Math.abs(x.effect)))]).range([0,100]);
    window.scale = scale;
    console.log("sdf", [0,extent(explanation.features.map(x=>x.effect))[1]])
    let fmt = format('.2');
    let incomingItems = select(this.container).selectAll('.element').data(reverse(sortBy(explanation.features, 'effect')))
      .enter().append('div');
    incomingItems.append('div').classed('simple-list-label', true).text(x => `${x.name} (${fmt(x.effect)})`)
    incomingItems.append('div')
      .classed('simple-list-padding', true)
      .style('width', x=> (x.effect > 0 ? 100 : 100 + scale(x.effect))+"px");
    incomingItems.append('div')
      .classed('simple-list-value', true)
      .style('width', x=>{ let v = Math.abs(scale(x.effect)); console.log(v); return v+"px";})
      .style('background', x=> x.effect > 0 ? '#00a' : '#a00');
  }
}

try {
  customElements.define('simple-list', SimpleList);
} catch (e) {
  console.log("simple-list element already registered...")
}
