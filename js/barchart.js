export default class BarChart {
  constructor(svg_id, data, width, height) {
    this.margin = 40
    this.width = width;
    this.height = height;
    this.svg = d3
      .select("#" + svg_id)
      .attr("width", width+100)
      .attr("height", height+180);

    this.wholeData = data;
    console.log(this.wholeData);
    this.createBarChart(this.wholeData)
}

createBarChart(data) {
  var max = Math.max.apply(Math, data.map(function(o) { return o.count; }))
    // create chart
  const chart = this.svg.append("g")
                        .attr("transform", `translate(${this.margin}, ${this.margin})`);

    // specify scales and axes
  const yScale = d3.scaleLinear()
                    .range([this.height, 0])
                    .domain([0, max]);
  chart.append('g')
        .call(d3.axisLeft(yScale));

  const xScale = d3.scaleBand()
                    .range([0, this.width])
                    .domain(data.map((d) => d.time))
                    .padding(0.5)

  chart.append('g')
    .attr('transform',  `translate(0, ${this.height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // create and add bars
    const barGroups = chart.selectAll()
      .data(data)
      .enter()
      .append('g')

    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.time))
      .attr('y', (d) => yScale(d.count))
      .attr('height', (d) => this.height - yScale(d.count))
      .attr('width', xScale.bandwidth())
      .on('mouseenter', function (actual, i) {
          d3.select(this).attr('opacity', 0.5)
          d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.time) - 5)
            .attr('width', xScale.bandwidth() + 10)

            div.transition()
                .duration(200)
                .style("opacity", .9);
            div	.html(actual.time + "<br/>"  + actual.count)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
      })
      .on('mouseleave', function (actual, i) {
          d3.select(this).attr('opacity', 1)

          d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.time))
            .attr('width', xScale.bandwidth())
          div.transition()
            .duration(500)
            .style("opacity", 0);
      })
}

}
