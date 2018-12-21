export default class BarChartTime {
  constructor(svg_id, data, width, height) {
    this.margin = 50
    this.width = width;
    this.height = height;
    this.svg = d3.select("#" + svg_id)
                  .attr("width", width+200)
                  .attr("height", height+200);

    this.wholeData = data;
    console.log(this.wholeData);

    this.createBarChart(this.wholeData)
    console.log('finish');

}

createBarChart(data) {

  //console.log('maax', max((d) => d.count));
  const chart = this.svg.append("g")
                        .attr("transform", `translate(${this.margin}, ${this.margin})`);

  const yScale = d3.scaleLinear()
                    .range([this.height, 0])
                    .domain([0,200]);
  console.log('ccc');
  chart.append('g')
        .call(d3.axisLeft(yScale));

  const xScale = d3.scaleBand()
                    .range([0, this.width])
                    .domain(data.map((d) => d.time))
                    .padding(0.5)


  console.log(`translate(0, ${this.height})`);
  chart.append('g')
        .attr('transform',  `translate(0, ${this.height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)");

    console.log(data);

    // Define div for the tooltip mouse hover on
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const barGroups = chart.selectAll()
      .data(data)
      .enter()
      .append('g')

      console.log('xxxheight',this.height);
      data.forEach(function(d, i) {
          setTimeout(function(height) {
                  barGroups.append("rect")
                            .datum(d)
                            .attr('x', (d) => xScale(d.time))
                            .attr('y', (d) => yScale(d.count))
                            .attr('height', (d) => 400 - yScale(d.count))
                            .attr('width', xScale.bandwidth())
                            .style("fill","#800");
          }, 2000 * i);
      });
  }
}
