


export default class BarChartBoth {
  constructor(svg_id, data, width, height) {
    this.margin = 50
    this.width = width;
    this.height = height;
    this.svg = d3
      .select("#" + svg_id)
      .attr("width", width+200)
      .attr("height", height+200);

    this.wholeData = data;
    console.log(this.wholeData);

    this.createBarChart(this.wholeData)
    console.log('finish');

}

createBarChart(data) {

  console.log('aaa');
  const chart = this.svg.append("g")
  .attr("transform", `translate(${this.margin}, ${this.margin})`);

  const yScale = d3.scaleLinear()
  .range([this.height, 0])
  .domain([0, 300]);
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

    // add bars
    console.log(data);

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const barGroups = chart.selectAll()
      .data(data)
      .enter()
      .append('g')
/*
    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.time))
      .attr('y', (d) => yScale(d.count))
      .attr('height', (d) => this.height - yScale(d.count))
      .attr('width', xScale.bandwidth()) */
    /*barGroups
      .transition()
      .duration(1500)
      .delay(10000)
      .attr("fill", "#800")*/
      console.log('xxx');
      data.forEach(function(d, i) {
          setTimeout(function() {
                  barGroups.append("rect")
                  .datum(d)
                  .attr('x', (d) => xScale(d.time))
                  .attr('y', (d) => yScale(d.count))
                  .attr('height', (d) => 1000 - yScale(d.count))
                  .attr('width', xScale.bandwidth())
                  .style("fill","#800")

          }, 500 * i);
      });
      console.log('yyy');

      setTimeout(function() {
        //your code to be executed after 1 second
      }, 15000);

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
