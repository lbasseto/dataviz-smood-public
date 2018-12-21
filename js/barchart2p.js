


export default class BarChart2 {
  constructor(svg_id, data, width, height) {
    this.margin = 50
    this.width = width;
    this.height = height;
    this.svg = d3
      .select("#" + svg_id)
      //.attr("width", width+100)
      //.attr("height", height+100);

    this.wholeData = data;
    console.log(this.wholeData);
    console.log('**********barchart2***********');
    //console.log('***max',max);

    this.createBarChart(this.wholeData)
    console.log('finish');

}

createBarChart(data){
  var dataset = data
  console.log('dataa',dataset);
  var svg = this.svg
      .attr("width", this.width+100)
      .attr("height", this.height+100);
  var max = Math.max.apply(Math, data.map(function(o) { return o.count; }))
  var chart = svg.append("g")
                 .attr("transform", `translate(${this.margin}, ${this.margin})`);
  console.log('ggg');
  var yScale = d3.scaleLinear()
                .range([this.height, 0])
                .domain([0, max]);

  console.log('222222222');
  chart.append('g')
       .call(d3.axisLeft(yScale));

  var xScale = d3.scaleBand()
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

    var barGroups = chart.selectAll()
                          .data(data)
                          .enter()
                          .append('g')

    barGroups.append('rect')
              .attr("class", "bar")
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
      function render(data) {
        //  console.log('aaa',height);
        //  console.log('aaa',width);
        var width=500;
        var height=300;
        var max=120;
        console.log('=====');
        yScale.domain([0, max]);
        xScale.domain(data.map((d) => d.time))

        console.log('xxxx',data);

        var maxData = Math.max.apply(Math, data.map(function(d) { return d.count; }))
        console.log('maxxxx',maxData);

        // delete previous bars
        var bars = svg.selectAll(".bar")
                        .remove()
                        .exit()
                        .data(data[0]);

      var barsEnter = bars.enter()
                          .append('g')
                          .append('rect')
                          .attr('x', (d) => xScale(d.time))
                          .attr('y', (d) => yScale(d.count))
                          .attr('height', (d) => height - yScale(d.count))
                          .attr('width', xScale.bandwidth())
                          .attr("fill", '#111');

      var barsUpdate = bars.append('rect')
                          .attr('x', (d) => xScale(d.time))
                          .attr('y', (d) => yScale(d.count))
                          .attr('height', (d) => height - yScale(d.count))
                          .attr('width', xScale.bandwidth())
                          .attr("fill", '#111');

      console.log('after data',data);

      }
      render(dataset);

      setInterval(function() {
          console.log('boom updaaaate')
          update();
          console.log('bla updaaaate')
      }, 3000);

      var counter = 0;
      function update() {
          let dataPath_pickup = "../data/pickup_counts_per_time.csv";
          let listt=["18:30","14:30","10:00","19:00",
                    "18:30","14:30","10:00","19:00"]
          function row_bar2(d, x, y ) {
            return {
              id:d.id,
              time:d.id,//d[x],
              count: d[y]
            };
          }
          let dataset2 = [];
          //let plot = new GraphPlot("main_svg", 500, 500);
          d3.csv(dataPath_pickup, function(d) {
            dataset2.push(row_bar2(d, 'pickup',listt[counter]));
            //
          });
          counter++;
          render(dataset2);
      }


}

}
