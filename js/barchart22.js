


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
      var width = 500,
          height = 300;

      var svg = this.svg
                  .attr("width", width+100)
                  .attr("height", height+100);

      var chart = svg.append("g")
                     .attr("transform", `translate(${this.margin}, ${this.margin})`);

     var yScale = d3.scaleLinear()
                   .range([height, 0])
                   .domain([0, d3.max(data, function(d) { return d.count; })]);
     chart.append('g')
     .call(d3.axisLeft(yScale));

     var xScale = d3.scaleBand()
                     .range([0, width])
                     .domain(data.map((d) => d.time))
                     .padding(0.5)

      chart.append("g")
          .attr('transform',  `translate(0, ${this.height})`)
          .call(d3.axisBottom(xScale))
          .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

    function render(data){
      // measure the domain (for x, unique letters) (for y [0,maxFrequency])
      // now the scales are finished and usable
      xScale.domain(data.map((d) => d.time));
      yScale.domain([0, d3.max(data, function(d) { return d.count; })]);

      // another g element, this time to move the origin to the bottom of the svg element
      // someSelection.call(thing) is roughly equivalent to thing(someSelection[i])
      //   for everything in the selection\
      // the end result is g populated with text and lines!
      chart.select('.x.axis').transition().duration(300).call(xScale);

      // same for yAxis but with more transform and a title
      chart.select(".y.axis").transition().duration(300).call(yScale)

      // THIS IS THE ACTUAL WORK!
      var bars = chart.selectAll(".bar").data(data, function(d) { return d.time; }) // (data) is an array/iterable thing, second argument is an ID generator function

      bars.exit()
          .attr('y', (d) => yScale(d.count))
          .attr('height', (d) => height - yScale(d.count))
        //.attr("height", height - y(0))
        .style('fill-opacity', 1e-6)
        .remove();

      // data that needs DOM = enter() (a set/selection, not an event!)
      bars.enter().append("rect")
        .attr("class", "bar")
        .attr('y', (d) => yScale(d.count))
        .attr('height', (d) => height - yScale(d.count));

      // the "UPDATE" set:
      bars.attr('x', (d) => xScale(d.time))
      .attr('y', (d) => yScale(d.count))
      .attr('height', (d) => height - yScale(d.count))
      .attr('width', xScale.bandwidth());
    }//end render


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
